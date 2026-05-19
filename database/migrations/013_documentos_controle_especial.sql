-- Migração 013: adiciona receituario_controle_especial ao check constraint de documentos
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_tipo_check;

ALTER TABLE documentos ADD CONSTRAINT documentos_tipo_check
  CHECK (tipo IN (
    'receituario',
    'receituario_especial',
    'receituario_controle_especial',
    'atestado',
    'pedido_exame'
  ));
