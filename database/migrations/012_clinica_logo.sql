-- Migração 012: adiciona logo_base64 à tabela configuracoes_clinica
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE configuracoes_clinica ADD COLUMN IF NOT EXISTS logo_base64 TEXT;
