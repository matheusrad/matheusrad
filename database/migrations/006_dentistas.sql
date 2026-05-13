-- ============================================================
-- Migração 006: Tabela de dentistas/profissionais
-- Execute no Supabase → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS dentistas (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome          TEXT NOT NULL,
  especialidade TEXT DEFAULT 'Clínico Geral',
  cro           TEXT,
  cor           TEXT DEFAULT '#3B82F6',
  ativo         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dentistas_ativo ON dentistas(ativo);

ALTER TABLE dentistas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dentistas' AND policyname = 'Dentista gerencia profissionais'
  ) THEN
    CREATE POLICY "Dentista gerencia profissionais"
      ON dentistas FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Adiciona coluna dentista_id em consultas (para filtro futuro)
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS dentista_id UUID REFERENCES dentistas(id) ON DELETE SET NULL;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS dentista_nome TEXT;
