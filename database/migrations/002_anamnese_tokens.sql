-- ============================================================
-- Migração 002: Tabela de tokens para anamnese pública
-- Execute no Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS anamnese_tokens (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnese_tokens_token ON anamnese_tokens(token);
CREATE INDEX IF NOT EXISTS idx_anamnese_tokens_paciente ON anamnese_tokens(paciente_id);

-- Permite leitura pública do token (para validar sem auth)
ALTER TABLE anamnese_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de tokens válidos"
  ON anamnese_tokens FOR SELECT
  TO anon
  USING (expires_at > NOW() AND used_at IS NULL);

CREATE POLICY "Dentista gerencia tokens"
  ON anamnese_tokens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
