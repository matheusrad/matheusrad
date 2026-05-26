-- Migração 015: adiciona status "Solicitado" para agendamentos online
-- Execute no Supabase → SQL Editor → New query → Run

ALTER TABLE consultas DROP CONSTRAINT IF EXISTS consultas_status_check;

ALTER TABLE consultas ADD CONSTRAINT consultas_status_check
  CHECK (status IN (
    'Agendado','Confirmado','Aguardando','Realizado',
    'Cancelado','Faltou','Remarcado','Solicitado'
  ));

-- Canal de agendamento online
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultas' AND column_name = 'canal_agendamento'
  ) THEN
    ALTER TABLE consultas ADD COLUMN canal_agendamento TEXT;
  END IF;
END $$;
