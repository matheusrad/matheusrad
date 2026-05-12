#!/usr/bin/env node
/**
 * setup-db.mjs
 * Executa schema.sql e rls-policies.sql no Supabase.
 * Uso: npm run db:setup
 * Requer DATABASE_URL no .env.local
 */

import { readFileSync } from 'fs'
import { createConnection } from 'net'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Carrega variáveis de ambiente de .env.local ──────────────
function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local')
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
    console.error('❌  Arquivo .env.local não encontrado em webapp/')
    process.exit(1)
  }
}

loadEnv()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error(`
❌  Variável DATABASE_URL não encontrada no .env.local

Adicione a connection string do Supabase:
  DATABASE_URL=postgresql://postgres:[SENHA]@db.[ref].supabase.co:5432/postgres

Encontre em: Supabase → Settings → Database → Connection string → URI
`)
  process.exit(1)
}

// ── Importa pg dinamicamente ──────────────────────────────────
let pg
try {
  pg = await import('pg')
} catch {
  console.error(`
❌  Pacote 'pg' não instalado. Rode:
  npm install --save-dev pg
`)
  process.exit(1)
}

const { default: { Client } } = pg

// ── Arquivos SQL a executar (ordem importa) ───────────────────
const SQL_FILES = [
  resolve(__dirname, '../../database/schema.sql'),
  resolve(__dirname, '../../database/rls-policies.sql'),
]

// ── Executa ───────────────────────────────────────────────────
const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  console.log('🔌  Conectando ao Supabase...')
  await client.connect()
  console.log('✅  Conectado!\n')

  for (const filePath of SQL_FILES) {
    const fileName = filePath.split(/[\\/]/).pop()
    console.log(`📄  Executando ${fileName}...`)

    let sql
    try {
      sql = readFileSync(filePath, 'utf-8')
    } catch {
      console.error(`❌  Arquivo não encontrado: ${filePath}`)
      process.exit(1)
    }

    await client.query(sql)
    console.log(`✅  ${fileName} executado com sucesso!\n`)
  }

  console.log('🎉  Banco de dados configurado! Tabelas criadas:')
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  )
  rows.forEach(r => console.log(`   • ${r.tablename}`))

} catch (err) {
  console.error('\n❌  Erro ao executar SQL:')
  console.error(err.message)
  process.exit(1)
} finally {
  await client.end()
}
