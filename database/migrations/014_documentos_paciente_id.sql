-- Migração 014: garante coluna paciente_id na tabela documentos
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL;
