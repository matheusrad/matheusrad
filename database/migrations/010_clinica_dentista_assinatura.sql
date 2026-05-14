-- Migração 010: campos adicionais em configuracoes_clinica
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE configuracoes_clinica ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE configuracoes_clinica ADD COLUMN IF NOT EXISTS dentista_nome TEXT;
ALTER TABLE configuracoes_clinica ADD COLUMN IF NOT EXISTS dentista_cro  TEXT;
ALTER TABLE configuracoes_clinica ADD COLUMN IF NOT EXISTS assinatura_base64 TEXT;
