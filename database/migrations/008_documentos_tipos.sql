-- Migração 008: garante que a tabela documentos aceita os novos tipos
-- Execute no Supabase → SQL Editor → New query → Run

-- Se a coluna tipo tiver constraint de enum, remove e usa TEXT livre
-- (na maioria dos casos a coluna já é TEXT, então este bloco é seguro)
ALTER TABLE documentos ALTER COLUMN tipo TYPE TEXT;

-- Garante que as colunas necessárias existem
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS conteudo_texto TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS numero_documento TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS paciente_nome TEXT;
