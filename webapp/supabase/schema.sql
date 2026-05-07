-- ============================================================
-- SecretárIA Dental — Schema completo do banco de dados
-- Cole este SQL no Supabase: SQL Editor → New Query → Run
-- ============================================================

-- Habilitar extensão de UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: pacientes
-- ============================================================
create table if not exists pacientes (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,
  data_nascimento       date,
  cpf                   text,
  rg                    text,
  telefone              text not null,
  email                 text,
  endereco              text,
  profissao             text,
  responsavel           text,
  plano_odontologico    text,
  numero_carteirinha    text,
  tem_alergia           boolean not null default false,
  descricao_alergia     text,
  usa_medicamento       boolean not null default false,
  descricao_medicamento text,
  tem_doenca_sistemica  boolean not null default false,
  descricao_doenca      text,
  observacoes_clinicas  text,
  link_anamnese_pdf     text,
  status                text not null default 'Ativo' check (status in ('Ativo', 'Inativo', 'Bloqueado')),
  novo_paciente         boolean not null default true,
  data_cadastro         date not null default current_date,
  data_ultima_consulta  timestamptz,
  total_consultas       integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- TABELA: consultas
-- ============================================================
create table if not exists consultas (
  id                   uuid primary key default gen_random_uuid(),
  paciente_id          uuid references pacientes(id) on delete set null,
  paciente_nome        text not null,
  paciente_telefone    text,
  data_consulta        timestamptz not null,
  data_fim_consulta    timestamptz,
  procedimento         text,
  observacoes          text,
  evento_google_id     text,
  canal_agendamento    text not null default 'Manual',
  data_agendamento     timestamptz not null default now(),
  status               text not null default 'Agendado' check (status in ('Agendado', 'Confirmado', 'Remarcado', 'Cancelado', 'Realizado', 'Faltou')),
  confirmacao_enviada  boolean not null default false,
  confirmacao_resposta text,
  valor_cobrado        numeric(10,2),
  forma_pagamento      text,
  nota_fiscal_emitida  boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- TABELA: notas_fiscais
-- ============================================================
create table if not exists notas_fiscais (
  id                uuid primary key default gen_random_uuid(),
  numero_nf         text,
  numero_rps        text,
  paciente_id       uuid references pacientes(id) on delete set null,
  paciente_nome     text not null,
  paciente_cpf      text,
  consulta_id       uuid references consultas(id) on delete set null,
  descricao_servico text not null default 'Serviços odontológicos',
  codigo_servico    text not null default '04.09',
  valor_servicos    numeric(10,2) not null,
  valor_deducoes    numeric(10,2) default 0,
  valor_iss         numeric(10,2),
  aliquota_iss      numeric(5,4) not null default 0.05,
  valor_liquido     numeric(10,2),
  link_pdf          text,
  enviado_whatsapp  boolean not null default false,
  enviado_email     boolean not null default false,
  status            text not null default 'Pendente' check (status in ('Pendente', 'Emitida', 'Cancelada', 'Erro')),
  data_emissao      date not null default current_date,
  mes_competencia   text,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- TABELA: historico_mensagens
-- ============================================================
create table if not exists historico_mensagens (
  id                  uuid primary key default gen_random_uuid(),
  telefone            text not null,
  paciente_id         uuid references pacientes(id) on delete set null,
  message_id          text,
  direcao             text not null check (direcao in ('recebida', 'enviada')),
  texto               text,
  tipo_mensagem       text not null default 'text',
  intencao_detectada  text,
  workflow_acionado   text,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- TABELA: conteudo_postado (Instagram/Stories)
-- ============================================================
create table if not exists conteudo_postado (
  id                    uuid primary key default gen_random_uuid(),
  tema                  text not null,
  tipo_conteudo         text,
  legenda_instagram     text,
  texto_story_whatsapp  text,
  hashtags              text[],
  call_to_action        text,
  instagram_post_id     text,
  publicado_instagram   boolean not null default false,
  publicado_instagram_em timestamptz,
  publicado_story       boolean not null default false,
  instagram_likes       integer not null default 0,
  instagram_comentarios integer not null default 0,
  link_midia            text,
  legenda               text,
  curtidas              integer default 0,
  comentarios           integer default 0,
  data_postagem         timestamptz,
  data_post             date not null default current_date,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- TABELA: documentos (prescrições, laudos, anamneses)
-- ============================================================
create table if not exists documentos (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null check (tipo in ('prescricao', 'laudo', 'anamnese')),
  numero_documento text,
  paciente_id      uuid references pacientes(id) on delete set null,
  paciente_nome    text,
  paciente_cpf     text,
  consulta_id      uuid references consultas(id) on delete set null,
  html_gerado      text,
  conteudo_texto   text,
  link_pdf         text,
  enviado_whatsapp boolean not null default false,
  status           text not null default 'Gerado' check (status in ('Gerado', 'Enviado', 'Erro')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TABELA: orcamentos
-- ============================================================
create table if not exists orcamentos (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid references pacientes(id) on delete set null,
  numero_orcamento text,
  descricao        text,
  valor_total      numeric(10,2) not null default 0,
  status           text not null default 'Aberto' check (status in ('Aberto', 'Aprovado', 'Rejeitado', 'Cancelado', 'Concluido')),
  validade         date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TABELA: tratamentos
-- ============================================================
create table if not exists tratamentos (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid references pacientes(id) on delete set null,
  orcamento_id    uuid references orcamentos(id) on delete set null,
  numero_dente    integer,
  face            text,
  procedimento    text not null,
  status          text not null default 'Em aberto' check (status in ('Em aberto', 'Finalizado', 'Cancelado')),
  valor           numeric(10,2),
  data_realizacao date,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: pagamentos
-- ============================================================
create table if not exists pagamentos (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid references pacientes(id) on delete set null,
  orcamento_id    uuid references orcamentos(id) on delete set null,
  valor           numeric(10,2) not null,
  forma_pagamento text not null,
  data_pagamento  date not null default current_date,
  status          text not null default 'Pago' check (status in ('Pago', 'Pendente', 'Cancelado')),
  descricao       text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: evolucoes (evoluções clínicas)
-- ============================================================
create table if not exists evolucoes (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid references pacientes(id) on delete set null,
  consulta_id  uuid references consultas(id) on delete set null,
  numero_dente integer,
  descricao    text not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- TABELA: arquivos
-- ============================================================
create table if not exists arquivos (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid references pacientes(id) on delete set null,
  nome_arquivo   text not null,
  tipo_arquivo   text,
  url_arquivo    text,
  tamanho_bytes  bigint,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TABELA: anamneses
-- ============================================================
create table if not exists anamneses (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid references pacientes(id) on delete set null,
  link_pdf         text,
  html_gerado      text,
  dados_formulario jsonb,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_pacientes_updated_at
  before update on pacientes
  for each row execute function set_updated_at();

create trigger trg_consultas_updated_at
  before update on consultas
  for each row execute function set_updated_at();

create trigger trg_documentos_updated_at
  before update on documentos
  for each row execute function set_updated_at();

create trigger trg_orcamentos_updated_at
  before update on orcamentos
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: atualiza total_consultas e data_ultima_consulta
-- ============================================================
create or replace function atualiza_stats_paciente()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') and new.paciente_id is not null then
    update pacientes set
      total_consultas      = (select count(*) from consultas where paciente_id = new.paciente_id and status = 'Realizado'),
      data_ultima_consulta = (select max(data_consulta) from consultas where paciente_id = new.paciente_id and status = 'Realizado')
    where id = new.paciente_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_consultas_stats
  after insert or update on consultas
  for each row execute function atualiza_stats_paciente();

-- ============================================================
-- VIEW: vw_consultas_semana
-- ============================================================
create or replace view vw_consultas_semana as
select
  c.id,
  c.paciente_nome,
  c.paciente_telefone,
  c.data_consulta,
  c.procedimento,
  c.status,
  c.confirmacao_enviada,
  c.confirmacao_resposta,
  c.valor_cobrado,
  p.email  as paciente_email,
  p.plano_odontologico
from consultas c
left join pacientes p on p.id = c.paciente_id
where c.data_consulta >= date_trunc('week', now())
  and c.data_consulta <  date_trunc('week', now()) + interval '7 days';

-- ============================================================
-- VIEW: vw_financeiro_mes
-- ============================================================
create or replace view vw_financeiro_mes as
select
  to_char(data_emissao, 'YYYY-MM')  as mes,
  count(*)                           as total_nfs,
  sum(valor_servicos)                as faturamento_bruto,
  sum(coalesce(valor_iss, 0))        as total_iss,
  sum(coalesce(valor_liquido, valor_servicos)) as faturamento_liquido
from notas_fiscais
where status = 'Emitida'
group by to_char(data_emissao, 'YYYY-MM')
order by mes desc;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — desabilitado para dev local
-- Em produção: habilite e configure policies por usuário
-- ============================================================
alter table pacientes          disable row level security;
alter table consultas          disable row level security;
alter table notas_fiscais      disable row level security;
alter table historico_mensagens disable row level security;
alter table conteudo_postado   disable row level security;
alter table documentos         disable row level security;
alter table orcamentos         disable row level security;
alter table tratamentos        disable row level security;
alter table pagamentos         disable row level security;
alter table evolucoes          disable row level security;
alter table arquivos           disable row level security;
alter table anamneses          disable row level security;

-- ============================================================
-- DADOS DE EXEMPLO (opcional — remova se não quiser)
-- ============================================================
insert into pacientes (nome, telefone, cpf, data_nascimento, status, tem_alergia, descricao_alergia, usa_medicamento, tem_doenca_sistemica, novo_paciente)
values
  ('Maria Silva Santos',    '11999990001', '111.111.111-11', '1985-03-15', 'Ativo', true,  'Dipirona',  false, false, false),
  ('João Pedro Oliveira',   '11999990002', '222.222.222-22', '1990-07-22', 'Ativo', false, null,        true,  false, false),
  ('Ana Carolina Ferreira', '11999990003', '333.333.333-33', '1978-11-05', 'Ativo', false, null,        false, true,  false),
  ('Carlos Eduardo Lima',   '11999990004', '444.444.444-44', '2000-01-30', 'Ativo', false, null,        false, false, true),
  ('Fernanda Costa Souza',  '11999990005', '555.555.555-55', '1995-09-18', 'Ativo', false, null,        false, false, false)
on conflict do nothing;
