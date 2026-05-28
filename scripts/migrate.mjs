#!/usr/bin/env node
/**
 * migrate.mjs — executa migrations pendentes no Supabase.
 *
 * Uso:
 *   node scripts/migrate.mjs                  → roda todas as pendentes
 *   node scripts/migrate.mjs 016              → roda só a 016_*.sql
 *   node scripts/migrate.mjs --list           → lista status de cada migration
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Carrega scripts/.env ──────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '.env')
  try {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.error('❌  Arquivo scripts/.env não encontrado.')
    process.exit(1)
  }
}

loadEnv()

const PROJECT_REF  = process.env.SUPABASE_PROJECT_REF
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('❌  SUPABASE_PROJECT_REF e SUPABASE_ACCESS_TOKEN são obrigatórios em scripts/.env')
  process.exit(1)
}

// ── Executa SQL via Management API ────────────────────────────
async function runSQL(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return text }
}

// ── Garante tabela de controle de migrations ──────────────────
async function ensureMigrationsTable() {
  await runSQL(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          SERIAL PRIMARY KEY,
      nome        TEXT UNIQUE NOT NULL,
      executado_em TIMESTAMPTZ DEFAULT now()
    );
  `)
}

async function getRan() {
  try {
    const rows = await runSQL(`SELECT nome FROM _migrations ORDER BY nome`)
    return new Set(rows.map(r => r.nome))
  } catch { return new Set() }
}

async function markRan(nome) {
  await runSQL(`INSERT INTO _migrations (nome) VALUES ('${nome}') ON CONFLICT DO NOTHING`)
}

// ── Lista arquivos de migration ───────────────────────────────
function getMigrationFiles() {
  const dir = resolve(__dirname, '../database/migrations')
  return readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => ({ nome: f, path: resolve(dir, f) }))
}

// ── Principal ─────────────────────────────────────────────────
const args = process.argv.slice(2)
const filter = args.find(a => !a.startsWith('--'))
const listOnly = args.includes('--list')

console.log(`\n🔌  Conectando ao projeto: ${PROJECT_REF}\n`)

try {
  await ensureMigrationsTable()
} catch (e) {
  console.error('❌  Não foi possível conectar:', e.message)
  console.error('\nVerifique se o token tem permissão e se o projeto existe.')
  process.exit(1)
}

const ran = await getRan()
const files = getMigrationFiles()

if (listOnly) {
  console.log('📋  Status das migrations:\n')
  for (const { nome } of files) {
    const ok = ran.has(nome)
    console.log(`  ${ok ? '✅' : '⏳'} ${nome}`)
  }
  console.log()
  process.exit(0)
}

const pendentes = files.filter(({ nome }) => {
  if (ran.has(nome)) return false
  if (filter && !nome.includes(filter)) return false
  return true
})

if (pendentes.length === 0) {
  console.log('✅  Nenhuma migration pendente.\n')
  process.exit(0)
}

console.log(`📄  ${pendentes.length} migration(s) para executar:\n`)

let ok = 0
for (const { nome, path } of pendentes) {
  process.stdout.write(`   ▶ ${nome} ... `)
  const sql = readFileSync(path, 'utf-8')
  try {
    await runSQL(sql)
    await markRan(nome)
    console.log('✅')
    ok++
  } catch (e) {
    console.log(`❌\n     ${e.message}`)
  }
}

console.log(`\n🎉  ${ok}/${pendentes.length} migration(s) executada(s) com sucesso.\n`)
