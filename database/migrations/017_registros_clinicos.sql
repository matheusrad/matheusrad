-- Prontuário clínico: registros de sessões por paciente
-- Suporta tipos: exame_clinico, ortodontia, endodontia
CREATE TABLE IF NOT EXISTS registros_clinicos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id  uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('exame_clinico', 'ortodontia', 'endodontia')),
  data         date NOT NULL DEFAULT CURRENT_DATE,
  conteudo     jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registros_clinicos_paciente_idx ON registros_clinicos(paciente_id, data DESC);

ALTER TABLE registros_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registros_clinicos_all" ON registros_clinicos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
