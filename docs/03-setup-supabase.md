# Guia de Setup — Supabase (PostgreSQL)

## Por que Supabase?

| Recurso | Google Sheets | Supabase (PostgreSQL) |
|---------|--------------|----------------------|
| Capacidade | ~500 pacientes confortável | Milhões de registros |
| Consultas complexas | Limitado | SQL completo (JOIN, GROUP BY, etc.) |
| Relacionamentos | Manual | Chaves estrangeiras nativas |
| Índices de busca | Não | Sim (busca rápida por telefone, CPF) |
| Auditoria/histórico | Difícil | Triggers automáticos |
| Segurança | Básica (Google) | Row Level Security (RLS) |
| Backup automático | Google Drive | Diário + Point-in-time recovery |
| API REST automática | Não | Sim (PostgREST — já incluso) |
| Custo | Grátis | **Grátis até 500MB** (~50.000 pacientes) |

---

## 1. Criar Conta e Projeto

1. Acesse [supabase.com](https://supabase.com) → **Start your project**
2. Faça login com GitHub (recomendado)
3. Clique em **New project**:
   - **Organization**: sua organização (crie uma se não tiver)
   - **Name**: `secretaria-dental`
   - **Database Password**: crie uma senha forte e **anote** — você precisará dela
   - **Region**: South America (São Paulo) — para menor latência
4. Aguarde ~2 minutos para o projeto ser criado

---

## 2. Obter as Credenciais

Após criar o projeto, vá em **Settings → API**:

```
# Anote estes valores para o .env e n8n
Project URL:      https://XXXXXXXXXXXXXXXX.supabase.co
anon key:         eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

> ⚠️ **IMPORTANTE**: A `service_role key` tem acesso total sem restrição RLS.
> Use ela **apenas** no n8n (servidor). **Nunca** exponha no frontend ou app.

---

## 3. Criar as Tabelas (Schema)

1. No Supabase, clique em **SQL Editor** (ícone de banco de dados no menu lateral)
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `database/schema.sql` deste repositório
4. Cole no editor e clique em **Run** (ou Ctrl+Enter)
5. Você verá: `Success. No rows returned`

### Verificar se as tabelas foram criadas
Clique em **Table Editor** — você deve ver:
- ✅ pacientes
- ✅ consultas
- ✅ documentos
- ✅ notas_fiscais
- ✅ conteudo_postado
- ✅ historico_mensagens
- ✅ anamneses

---

## 4. Configurar Row Level Security (RLS)

1. No **SQL Editor**, crie uma nova query
2. Copie o conteúdo de `database/rls-policies.sql`
3. Execute

---

## 5. Configurar no n8n

### Variáveis de ambiente no n8n
Vá em **Settings → Variables** e adicione:

```
SUPABASE_URL             = https://XXXXXXXXXXXXXXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Como os workflows fazem chamadas ao Supabase
Os workflows usam a **API REST do Supabase (PostgREST)** via HTTP Request nodes:

```
# Buscar paciente por telefone
GET  {SUPABASE_URL}/rest/v1/pacientes?telefone=eq.5511999999999
     Headers: apikey: SERVICE_ROLE_KEY
              Authorization: Bearer SERVICE_ROLE_KEY

# Inserir nova consulta
POST {SUPABASE_URL}/rest/v1/consultas
     Headers: apikey: SERVICE_ROLE_KEY
              Content-Type: application/json
              Prefer: return=representation

# Atualizar status da consulta
PATCH {SUPABASE_URL}/rest/v1/consultas?id=eq.UUID
      Body: { "status": "Confirmado" }

# Buscar consultas desta semana
GET {SUPABASE_URL}/rest/v1/consultas
    ?data_consulta=gte.2025-01-06T00:00:00
    &data_consulta=lte.2025-01-12T23:59:59
    &status=in.(Agendado,Confirmado)
```

---

## 6. Operadores de Filtro da API REST

| Operador | Significado | Exemplo |
|----------|-------------|---------|
| `eq`     | Igual       | `?telefone=eq.5511999999999` |
| `neq`    | Diferente   | `?status=neq.Cancelado` |
| `gt`     | Maior que   | `?valor=gt.100` |
| `gte`    | Maior ou igual | `?data=gte.2025-01-01` |
| `lt`     | Menor que   | `?data=lt.2025-12-31` |
| `lte`    | Menor ou igual | `?data=lte.2025-12-31` |
| `in`     | Em lista    | `?status=in.(Agendado,Confirmado)` |
| `is`     | Nulo/vazio  | `?paciente_id=is.null` |
| `ilike`  | Like case-insensitive | `?nome=ilike.*silva*` |

---

## 7. Painel de Administração — Supabase Studio

O Supabase inclui um painel visual completo:

### Table Editor
- Visualize, filtre e edite dados diretamente
- Exporte para CSV

### SQL Editor
- Execute queries SQL
- Salve queries frequentes
- Exemplos úteis:

```sql
-- Todos os pacientes com consulta esta semana
SELECT * FROM vw_consultas_semana;

-- Faturamento por mês
SELECT * FROM vw_financeiro_mes;

-- Prontuário de um paciente
SELECT * FROM vw_prontuario_paciente WHERE nome ILIKE '%silva%';

-- Pacientes com alergia cadastrada (alerta clínico)
SELECT nome, telefone, descricao_alergia
FROM pacientes
WHERE tem_alergia = true;

-- Consultas de hoje
SELECT paciente_nome, data_consulta, procedimento, status
FROM consultas
WHERE DATE(data_consulta) = CURRENT_DATE
ORDER BY data_consulta;

-- NFs do mês atual
SELECT paciente_nome, descricao_servico, valor_servicos, status
FROM notas_fiscais
WHERE mes_competencia = TO_CHAR(NOW(), 'YYYY-MM');
```

---

## 8. Alertas e Notificações (opcional, avançado)

O Supabase tem **Realtime** — você pode criar alertas quando novos registros chegam:

```sql
-- Habilitar realtime na tabela consultas
ALTER PUBLICATION supabase_realtime ADD TABLE consultas;
```

Com isso, você pode criar um painel web que atualiza em tempo real quando uma nova consulta é agendada.

---

## 9. Backup

O plano gratuito do Supabase inclui:
- **Backup diário automático** (últimos 7 dias)
- Point-in-time recovery no plano pago

Para exportar manualmente:
```bash
# Via pg_dump (precisa da Database Password criada no passo 1)
pg_dump "postgresql://postgres:[SENHA]@db.[PROJECT_ID].supabase.co:5432/postgres" > backup.sql
```

---

## Estrutura Final das Tabelas

```sql
pacientes           -- Cadastro de pacientes
  ├── anamneses     -- Fichas de anamnese (N para 1 com pacientes)
  ├── consultas     -- Histórico de agendamentos
  │   └── notas_fiscais  -- NF por consulta
  └── documentos    -- Prescrições e laudos

historico_mensagens -- Log de todas as mensagens WhatsApp
conteudo_postado    -- Histórico de posts Instagram/Stories
```
