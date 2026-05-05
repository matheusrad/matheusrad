-- ============================================================
-- SecretárIA Dental — Supabase PostgreSQL Schema
-- Execute no Supabase: SQL Editor → New query → Cole e rode
-- ============================================================

-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- TABELA: pacientes
-- Cadastro completo de todos os pacientes do consultório
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pacientes (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome                  TEXT NOT NULL,
  data_nascimento       DATE,
  cpf                   VARCHAR(14) UNIQUE,
  rg                    VARCHAR(20),
  telefone              VARCHAR(20) NOT NULL UNIQUE,
  email                 TEXT,
  endereco              TEXT,
  profissao             TEXT,
  responsavel           TEXT,               -- para menores de idade
  plano_odontologico    TEXT,
  numero_carteirinha    TEXT,

  -- Dados clínicos relevantes (resumo da anamnese)
  tem_alergia           BOOLEAN DEFAULT FALSE,
  descricao_alergia     TEXT,
  usa_medicamento       BOOLEAN DEFAULT FALSE,
  descricao_medicamento TEXT,
  tem_doenca_sistemica  BOOLEAN DEFAULT FALSE,
  descricao_doenca      TEXT,
  observacoes_clinicas  TEXT,

  -- Links e documentos
  link_anamnese_pdf     TEXT,               -- URL do PDF no Google Drive
  link_anamnese_drive   TEXT,

  -- Controle
  status                TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Bloqueado')),
  novo_paciente         BOOLEAN DEFAULT TRUE,
  data_cadastro         TIMESTAMPTZ DEFAULT NOW(),
  data_ultima_consulta  TIMESTAMPTZ,
  total_consultas       INTEGER DEFAULT 0,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: consultas
-- Histórico completo de todos os agendamentos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultas (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id           UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nome         TEXT NOT NULL,       -- desnormalizado para consultas rápidas
  paciente_telefone     VARCHAR(20),

  -- Dados da consulta
  data_consulta         TIMESTAMPTZ NOT NULL,
  data_fim_consulta     TIMESTAMPTZ,
  procedimento          TEXT,               -- tipo de procedimento
  observacoes           TEXT,

  -- Google Calendar
  evento_google_id      TEXT,               -- ID do evento no Google Calendar

  -- Agendamento
  canal_agendamento     TEXT DEFAULT 'WhatsApp' CHECK (canal_agendamento IN ('WhatsApp', 'Telefone', 'Presencial', 'Instagram', 'Site')),
  data_agendamento      TIMESTAMPTZ DEFAULT NOW(),

  -- Confirmação
  status                TEXT DEFAULT 'Agendado' CHECK (status IN (
    'Agendado', 'Confirmado', 'Remarcado', 'Cancelado', 'Realizado', 'Faltou'
  )),
  confirmacao_enviada   BOOLEAN DEFAULT FALSE,
  confirmacao_enviada_em TIMESTAMPTZ,
  confirmacao_resposta  TEXT,               -- 'SIM', 'REMARCAR', 'CANCELAR'
  confirmacao_em        TIMESTAMPTZ,

  -- Financeiro
  valor_cobrado         DECIMAL(10,2),
  forma_pagamento       TEXT,
  nota_fiscal_emitida   BOOLEAN DEFAULT FALSE,
  nota_fiscal_id        UUID,               -- referência futura para notas_fiscais

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: documentos
-- Prescrições e Laudos gerados
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero_documento      TEXT UNIQUE NOT NULL,  -- ex: DOC-1234567890
  tipo                  TEXT NOT NULL CHECK (tipo IN ('prescricao', 'laudo')),

  -- Relacionamento
  paciente_id           UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nome         TEXT NOT NULL,
  consulta_id           UUID REFERENCES consultas(id) ON DELETE SET NULL,

  -- Conteúdo
  informacao_clinica    TEXT,               -- texto informado pela dentista
  html_gerado           TEXT,               -- HTML gerado pelo Claude (para reimpressão)

  -- Arquivo
  link_pdf              TEXT,               -- URL do PDF no Google Drive
  link_drive            TEXT,

  -- Entrega
  enviado_whatsapp      BOOLEAN DEFAULT FALSE,
  enviado_whatsapp_em   TIMESTAMPTZ,
  enviado_email         BOOLEAN DEFAULT FALSE,

  data_emissao          DATE DEFAULT CURRENT_DATE,
  validade              DATE,               -- prescrição: +30 dias / laudo: +90 dias

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: notas_fiscais
-- Notas Fiscais de Serviço (NFS-e) emitidas
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero_nf             TEXT,               -- número da NFS-e emitida
  numero_rps            TEXT UNIQUE,        -- número do RPS (antes da emissão)
  ref_focusnfe          TEXT,               -- referência Focus NF-e
  chave_acesso          TEXT,

  -- Relacionamento
  paciente_id           UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nome         TEXT NOT NULL,
  paciente_cpf          TEXT,
  consulta_id           UUID REFERENCES consultas(id) ON DELETE SET NULL,

  -- Serviço
  descricao_servico     TEXT NOT NULL,
  codigo_servico        TEXT DEFAULT '0401', -- código LC 116
  procedimento          TEXT,

  -- Valores
  valor_servicos        DECIMAL(10,2) NOT NULL,
  valor_deducoes        DECIMAL(10,2) DEFAULT 0,
  valor_iss             DECIMAL(10,2),
  aliquota_iss          DECIMAL(5,2) DEFAULT 2.0,
  valor_liquido         DECIMAL(10,2),

  -- Arquivo
  link_pdf              TEXT,               -- URL do DANFSE em PDF
  link_xml              TEXT,

  -- Entrega
  enviado_whatsapp      BOOLEAN DEFAULT FALSE,
  enviado_email         BOOLEAN DEFAULT FALSE,

  -- Status
  status                TEXT DEFAULT 'Emitida' CHECK (status IN (
    'Pendente', 'Emitida', 'Cancelada', 'Erro'
  )),
  erro_descricao        TEXT,

  data_emissao          TIMESTAMPTZ DEFAULT NOW(),
  mes_competencia       VARCHAR(7),         -- formato: 2025-01

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: conteudo_postado
-- Histórico de posts Instagram e WhatsApp Stories
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conteudo_postado (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tema                  TEXT NOT NULL,
  tipo_conteudo         TEXT,               -- 'dica', 'mito_verdade', 'procedimento', etc.

  -- Conteúdo gerado
  legenda_instagram     TEXT,
  texto_story_whatsapp  TEXT,
  hashtags              TEXT[],             -- array de hashtags
  call_to_action        TEXT,
  ideia_visual          TEXT,

  -- Publicação Instagram
  instagram_post_id     TEXT,
  instagram_permalink   TEXT,
  publicado_instagram   BOOLEAN DEFAULT FALSE,
  publicado_instagram_em TIMESTAMPTZ,

  -- Publicação WhatsApp Stories
  publicado_story       BOOLEAN DEFAULT FALSE,
  publicado_story_em    TIMESTAMPTZ,

  -- Métricas (atualizar manualmente ou via webhook)
  instagram_likes       INTEGER DEFAULT 0,
  instagram_comentarios INTEGER DEFAULT 0,
  instagram_alcance     INTEGER DEFAULT 0,

  data_post             DATE DEFAULT CURRENT_DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: historico_mensagens
-- Log de todas as mensagens WhatsApp (auditoria)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historico_mensagens (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telefone              VARCHAR(20) NOT NULL,
  paciente_id           UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  message_id            TEXT,               -- ID da mensagem no WhatsApp

  -- Conteúdo
  direcao               TEXT NOT NULL CHECK (direcao IN ('recebida', 'enviada')),
  texto                 TEXT,
  tipo_mensagem         TEXT DEFAULT 'texto', -- 'texto', 'audio', 'imagem', 'documento'

  -- Classificação pelo Claude
  intencao_detectada    TEXT,               -- 'agendar', 'confirmar', 'remarcar', 'cancelar', 'duvida'
  workflow_acionado     TEXT,

  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABELA: anamneses
-- Respostas completas dos formulários de anamnese
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anamneses (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paciente_id           UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  paciente_nome         TEXT NOT NULL,

  -- Queixa principal
  motivo_consulta       TEXT,
  tem_dor_atual         BOOLEAN DEFAULT FALSE,
  local_dor             TEXT,
  intensidade_dor       INTEGER CHECK (intensidade_dor BETWEEN 0 AND 10),
  tempo_problema        TEXT,
  ultima_consulta_dentista TEXT,

  -- Saúde geral
  usa_medicamento       BOOLEAN DEFAULT FALSE,
  qual_medicamento      TEXT,
  tem_alergia           BOOLEAN DEFAULT FALSE,
  qual_alergia          TEXT,
  tem_doenca_sistemica  BOOLEAN DEFAULT FALSE,
  qual_doenca           TEXT,

  -- Condições específicas
  hipertensao           BOOLEAN DEFAULT FALSE,
  diabetes              BOOLEAN DEFAULT FALSE,
  problema_cardiaco     BOOLEAN DEFAULT FALSE,
  doenca_renal          BOOLEAN DEFAULT FALSE,
  doenca_hepatica       BOOLEAN DEFAULT FALSE,
  disturbio_coagulacao  BOOLEAN DEFAULT FALSE,
  osteoporose           BOOLEAN DEFAULT FALSE,
  hiv_imunossuprimido   BOOLEAN DEFAULT FALSE,
  gestante              BOOLEAN DEFAULT FALSE,
  periodo_gestacao      TEXT,

  -- Hábitos
  fuma                  BOOLEAN DEFAULT FALSE,
  consome_alcool        BOOLEAN DEFAULT FALSE,
  bruxismo              BOOLEAN DEFAULT FALSE,

  -- Histórico odontológico
  ja_fez_cirurgia       BOOLEAN DEFAULT FALSE,
  sangramento_pos_procedimento BOOLEAN DEFAULT FALSE,
  medo_tratamento       BOOLEAN DEFAULT FALSE,
  usa_protese           BOOLEAN DEFAULT FALSE,

  -- Observações e documento
  observacoes           TEXT,
  html_anamnese         TEXT,               -- HTML gerado pelo Claude
  link_pdf              TEXT,               -- URL do PDF no Drive

  data_preenchimento    TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES para performance
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone  ON pacientes(telefone);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf       ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_nome      ON pacientes(nome);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente  ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data      ON consultas(data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_status    ON consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_telefone  ON consultas(paciente_telefone);
CREATE INDEX IF NOT EXISTS idx_documentos_paciente ON documentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_nf_paciente         ON notas_fiscais(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historico_telefone  ON historico_mensagens(telefone);
CREATE INDEX IF NOT EXISTS idx_anamneses_paciente  ON anamneses(paciente_id);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: atualiza updated_at automaticamente
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_pacientes
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_consultas
  BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ────────────────────────────────────────────────────────────
-- TRIGGER: atualiza contadores no paciente após consulta
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_atualiza_paciente_pos_consulta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Realizado' AND (OLD.status IS NULL OR OLD.status != 'Realizado') THEN
    UPDATE pacientes
    SET
      total_consultas = total_consultas + 1,
      data_ultima_consulta = NEW.data_consulta,
      novo_paciente = FALSE
    WHERE id = NEW.paciente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualiza_paciente_pos_consulta
  AFTER INSERT OR UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION trigger_atualiza_paciente_pos_consulta();

-- ────────────────────────────────────────────────────────────
-- VIEWS úteis para o painel
-- ────────────────────────────────────────────────────────────

-- Consultas da semana atual
CREATE OR REPLACE VIEW vw_consultas_semana AS
SELECT
  c.id,
  c.paciente_nome,
  c.paciente_telefone,
  c.data_consulta,
  c.procedimento,
  c.status,
  c.confirmacao_enviada,
  c.confirmacao_resposta,
  c.valor_cobrado,
  p.email AS paciente_email,
  p.plano_odontologico
FROM consultas c
LEFT JOIN pacientes p ON c.paciente_id = p.id
WHERE DATE_TRUNC('week', c.data_consulta) = DATE_TRUNC('week', NOW())
ORDER BY c.data_consulta;

-- Dashboard: resumo financeiro do mês
CREATE OR REPLACE VIEW vw_financeiro_mes AS
SELECT
  DATE_TRUNC('month', data_emissao) AS mes,
  COUNT(*)                          AS total_nfs,
  SUM(valor_servicos)               AS faturamento_bruto,
  SUM(valor_iss)                    AS total_iss,
  SUM(valor_liquido)                AS faturamento_liquido
FROM notas_fiscais
WHERE status = 'Emitida'
GROUP BY DATE_TRUNC('month', data_emissao)
ORDER BY mes DESC;

-- Pacientes com consulta agendada e sem confirmação
CREATE OR REPLACE VIEW vw_aguardando_confirmacao AS
SELECT
  c.id,
  c.paciente_nome,
  c.paciente_telefone,
  c.data_consulta,
  c.confirmacao_enviada,
  c.confirmacao_enviada_em
FROM consultas c
WHERE c.status = 'Agendado'
  AND c.data_consulta > NOW()
  AND c.confirmacao_enviada = TRUE
  AND c.confirmacao_resposta IS NULL
ORDER BY c.data_consulta;

-- Histórico completo do paciente (para prontuário)
CREATE OR REPLACE VIEW vw_prontuario_paciente AS
SELECT
  p.id,
  p.nome,
  p.telefone,
  p.cpf,
  p.data_nascimento,
  p.total_consultas,
  p.data_ultima_consulta,
  p.tem_alergia,
  p.descricao_alergia,
  p.usa_medicamento,
  p.descricao_medicamento,
  p.observacoes_clinicas,
  COUNT(DISTINCT c.id)  AS consultas_realizadas,
  COUNT(DISTINCT d.id)  AS documentos_emitidos,
  COUNT(DISTINCT nf.id) AS nfs_emitidas,
  COALESCE(SUM(nf.valor_liquido), 0) AS total_gasto
FROM pacientes p
LEFT JOIN consultas c  ON c.paciente_id = p.id AND c.status = 'Realizado'
LEFT JOIN documentos d ON d.paciente_id = p.id
LEFT JOIN notas_fiscais nf ON nf.paciente_id = p.id AND nf.status = 'Emitida'
GROUP BY p.id, p.nome, p.telefone, p.cpf, p.data_nascimento,
         p.total_consultas, p.data_ultima_consulta,
         p.tem_alergia, p.descricao_alergia,
         p.usa_medicamento, p.descricao_medicamento, p.observacoes_clinicas;
