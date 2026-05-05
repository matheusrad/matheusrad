-- ============================================================
-- Row Level Security (RLS) — SecretárIA Dental
-- Protege os dados para que apenas usuários autorizados acessem
-- Execute APÓS o schema.sql
-- ============================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE pacientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudo_postado  ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses         ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- ESTRATÉGIA DE ACESSO
--
-- O n8n usa a SERVICE_ROLE KEY (acesso total, sem restrição RLS)
-- para operações automatizadas dos workflows.
--
-- A ANON KEY é usada apenas para leitura pública limitada
-- (se você tiver um painel web futuro).
--
-- A service_role bypassa o RLS automaticamente no Supabase.
-- ────────────────────────────────────────────────────────────

-- Política: service_role tem acesso total (automático no Supabase)
-- Não precisa criar policy para service_role

-- Política: usuários autenticados (dentista logada no painel) veem tudo
CREATE POLICY "Dentista autenticada acessa tudo — pacientes"
  ON pacientes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dentista autenticada acessa tudo — consultas"
  ON consultas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dentista autenticada acessa tudo — documentos"
  ON documentos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dentista autenticada acessa tudo — notas_fiscais"
  ON notas_fiscais FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dentista autenticada acessa tudo — conteudo_postado"
  ON conteudo_postado FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dentista autenticada acessa tudo — historico_mensagens"
  ON historico_mensagens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dentista autenticada acessa tudo — anamneses"
  ON anamneses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: anon NÃO acessa nada (proteção total de dados)
-- (sem policy anon = acesso negado por padrão quando RLS está ativo)

-- ────────────────────────────────────────────────────────────
-- NOTA IMPORTANTE para o n8n:
-- Use SEMPRE a SUPABASE_SERVICE_ROLE_KEY nos workflows do n8n.
-- Nunca use a anon key para operações automáticas.
-- A service_role bypassa o RLS e tem acesso irrestrito.
-- ────────────────────────────────────────────────────────────
