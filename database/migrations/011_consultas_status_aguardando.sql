-- Migração 011: adiciona status "Aguardando" à tabela consultas
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE consultas DROP CONSTRAINT IF EXISTS consultas_status_check;

ALTER TABLE consultas ADD CONSTRAINT consultas_status_check
  CHECK (status IN (
    'Agendado', 'Confirmado', 'Remarcado', 'Cancelado',
    'Realizado', 'Faltou', 'Aguardando'
  ));
