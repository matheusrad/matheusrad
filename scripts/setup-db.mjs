#!/usr/bin/env node
/**
 * setup-db.mjs — executa schema.sql e rls-policies.sql no Supabase.
 *
 * Uso (na pasta raiz do projeto):
 *   node scripts/setup-db.mjs
 *
 * Requer DATABASE_URL no arquivo scripts/.env
 * NUNCA coloque este arquivo .env no webapp — ele contém a senha do superuser.
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
    console.error('    Copie scripts/.env.exemplo para scripts/.env e preencha DATABASE_URL.')
    process.exit(1)
  }
}

loadEnv()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error(`
❌  Variável DATABASE_URL não encontrada em scripts/.env

Adicione a connection string do Supabase:
  DATABASE_URL=postgresql://postgres:[SENHA]@db.[ref].supabase.co:5432/postgres

Encontre em: Supabase → Settings → Database → Connection string → URI

⚠️  ATENÇÃO: nunca coloque DATABASE_URL no webapp/.env.local
    Esta credencial tem acesso total ao banco (superuser).
`)
  process.exit(1)
}

// ── Importa pg ────────────────────────────────────────────────
let Client
try {
  const pg = await import('pg')
  Client = pg.default.Client
} catch {
  console.error(`
❌  Pacote 'pg' não instalado. Rode na raiz do projeto:
    npm install pg
`)
  process.exit(1)
}

// ── Arquivos SQL (ordem importa) ──────────────────────────────
const SQL_FILES = [
  resolve(__dirname, '../database/schema.sql'),
  resolve(__dirname, '../database/rls-policies.sql'),
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
    const sql = readFileSync(filePath, 'utf-8')
    await client.query(sql)
    console.log(`✅  ${fileName} concluído!\n`)
  }

  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  )
  console.log('🎉  Banco configurado! Tabelas criadas:')
  rows.forEach(r => console.log(`   • ${r.tablename}`))

} catch (err) {
  console.error('\n❌  Erro ao executar SQL:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
