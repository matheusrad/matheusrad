-- ============================================================
-- Migração 003: Corrige e completa a tabela anamneses
-- Seguro rodar mais de uma vez (usa IF NOT EXISTS em tudo)
-- Execute no Supabase → SQL Editor → New query → Run
-- ============================================================

-- ── Colunas da migração 001 (caso ainda não tenham sido adicionadas) ──

ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS em_tratamento_medico       BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS detalhe_tratamento_medico  TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS suspendeu_remedio          BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS detalhe_remedio_suspenso   TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS sensivel_metais_latex      BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS tem_anemia                 BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS tem_asma                   BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS sujeito_infeccoes          BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS tem_epilepsia              BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS ja_teve_convulsoes         BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS desmaios_tonturas          BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS pressao_arterial           TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS usa_marcapasso             BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS formigamento_inchazo       BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS doenca_grave               BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS detalhe_doenca_grave       TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS outras_informacoes_saude   TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS saude_bucal                JSONB;

-- ── Coluna faltando na migração 001 ───────────────────────────────────

ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS articulacoes_artificiais   BOOLEAN DEFAULT FALSE;

-- ── Tabela de tokens (migração 002, caso ainda não exista) ───────────

CREATE TABLE IF NOT EXISTS anamnese_tokens (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnese_tokens_token    ON anamnese_tokens(token);
CREATE INDEX IF NOT EXISTS idx_anamnese_tokens_paciente ON anamnese_tokens(paciente_id);

-- RLS na tabela de tokens
ALTER TABLE anamnese_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'anamnese_tokens'
      AND policyname = 'Leitura pública de tokens válidos'
  ) THEN
    CREATE POLICY "Leitura pública de tokens válidos"
      ON anamnese_tokens FOR SELECT TO anon
      USING (expires_at > NOW() AND used_at IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'anamnese_tokens'
      AND policyname = 'Dentista gerencia tokens'
  ) THEN
    CREATE POLICY "Dentista gerencia tokens"
      ON anamnese_tokens FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;
