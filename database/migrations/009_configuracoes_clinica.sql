-- Migração 009: tabela de configurações da clínica
-- Execute no Supabase → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS configuracoes_clinica (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome         TEXT DEFAULT 'Consultório Dra. Lorena Coutinho',
  email        TEXT,
  cnpj         TEXT,
  telefone     TEXT,
  fuso_horario TEXT DEFAULT 'America/Sao_Paulo',
  cro          TEXT,
  cep          TEXT,
  endereco     TEXT,
  numero       TEXT,
  complemento  TEXT,
  bairro       TEXT,
  cidade       TEXT,
  estado       TEXT,
  emitir_recibo TEXT DEFAULT 'dentista',
  pacientes_aguardando BOOLEAN DEFAULT TRUE,
  pesquisa_satisfacao  BOOLEAN DEFAULT FALSE,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE configuracoes_clinica ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'configuracoes_clinica' AND policyname = 'Dentista gerencia configuracoes'
  ) THEN
    CREATE POLICY "Dentista gerencia configuracoes"
      ON configuracoes_clinica FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insere linha padrão se não existir
INSERT INTO configuracoes_clinica (nome)
SELECT 'Consultório Dra. Lorena Coutinho'
WHERE NOT EXISTS (SELECT 1 FROM configuracoes_clinica);
