#!/usr/bin/env node
/**
 * setup-db.mjs — executa schema.sql e rls-policies.sql no Supabase.
 *
 * Uso (na pasta raiz do projeto):
 *   node scripts/setup-db.mjs
 *
 * Requer em scripts/.env:
 *   SUPABASE_URL=https://xxxxx.supabase.co
 *   SUPABASE_SECRET_KEY=sb_secret_...   (chave secreta do projeto)
 *   SUPABASE_PROJECT_REF=xxxxx          (ID do projeto — ex: aceotmesirvtdtlgeucm)
 *   SUPABASE_ACCESS_TOKEN=sbp_...       (token pessoal de acesso)
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Carrega scripts/.env ──────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '.env')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.error('❌  Arquivo scripts/.env não encontrado.')
    console.error('    Copie scripts/.env.exemplo para scripts/.env e preencha os valores.')
    process.exit(1)
  }
}

loadEnv()

const PROJECT_REF     = process.env.SUPABASE_PROJECT_REF
const ACCESS_TOKEN    = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error(`
❌  Variáveis obrigatórias não encontradas em scripts/.env

Adicione:
  SUPABASE_PROJECT_REF=aceotmesirvtdtlgeucm   (ID do projeto — está em Configurações > Em geral)
  SUPABASE_ACCESS_TOKEN=sbp_...               (token pessoal)

Como gerar o token pessoal:
  1. Acesse https://supabase.com/dashboard/account/tokens
  2. Clique em "Generate new token"
  3. Dê um nome (ex: setup-db) e copie o token gerado
`)
  process.exit(1)
}

// ── Executa SQL via Management API ───────────────────────────
async function runSQL(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status} ao executar ${label}: ${body}`)
  }

  return res.json()
}

// ── Arquivos SQL (ordem importa) ──────────────────────────────
const SQL_FILES = [
  { path: resolve(__dirname, '../database/schema.sql'),      label: 'schema.sql' },
  { path: resolve(__dirname, '../database/rls-policies.sql'), label: 'rls-policies.sql' },
]

// ── Principal ─────────────────────────────────────────────────
console.log('🔌  Conectando ao Supabase via Management API...\n')

for (const { path, label } of SQL_FILES) {
  console.log(`📄  Executando ${label}...`)
  const sql = readFileSync(path, 'utf-8')
  try {
    await runSQL(sql, label)
    console.log(`✅  ${label} concluído!\n`)
  } catch (err) {
    console.error(`❌  ${err.message}`)
    process.exit(1)
  }
}

// ── Lista tabelas criadas ─────────────────────────────────────
try {
  const rows = await runSQL(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    'listagem'
  )
  console.log('🎉  Banco configurado! Tabelas criadas:')
  rows.forEach(r => console.log(`   • ${r.tablename}`))
} catch {
  console.log('🎉  Banco configurado!')
}
