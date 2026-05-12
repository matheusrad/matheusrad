-- ============================================================
-- Migração 001: Campos do Questionário de Saúde (ficha clínica)
-- Execute no Supabase → SQL Editor após schema.sql
-- ============================================================

-- Seção: Questionário de saúde geral (S/N)
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
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS pressao_arterial           TEXT;   -- 'alta' | 'baixa' | 'normal'
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS usa_marcapasso             BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS formigamento_inchazo       BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS doenca_grave               BOOLEAN DEFAULT FALSE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS detalhe_doenca_grave       TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS outras_informacoes_saude   TEXT;

-- Seção: Saúde bucal (22 perguntas abertas — armazenadas em JSONB)
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS saude_bucal JSONB;
