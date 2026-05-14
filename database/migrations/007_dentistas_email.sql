-- Migração 007: adiciona coluna email na tabela dentistas
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE dentistas ADD COLUMN IF NOT EXISTS email TEXT;
