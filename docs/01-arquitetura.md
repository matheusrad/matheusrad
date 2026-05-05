# Arquitetura do Sistema — SecretárIA Dental

## Visão Macro

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PACIENTE                                     │
│              WhatsApp ◄──────────► Instagram                        │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ Mensagens
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EVOLUTION API (WhatsApp Gateway)                  │
│                    • Recebe e envia mensagens                        │
│                    • Dispara webhooks para o n8n                     │
│                    • Gerencia sessão WhatsApp Web                    │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ Webhooks (HTTP POST)
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         N8N (Orquestrador)                           │
│                                                                      │
│  Workflow 01: Agendamento ──────────────────────┐                   │
│  Workflow 02: Confirmação Semanal               │                   │
│  Workflow 03: Anamnese                          ▼                   │
│  Workflow 04: Prescrição/Laudo          ┌──────────────┐            │
│  Workflow 05: Nota Fiscal               │  Claude AI   │            │
│  Workflow 06: Instagram/Stories         │  (Secretária │            │
│                                         │   Virtual)   │            │
└──────────────────┬──────────────────────└──────────────┘────────────┘
                   │
      ┌────────────┼────────────────────────────────┐
      ▼            ▼                                ▼
┌──────────┐ ┌──────────┐                  ┌──────────────┐
│ Google   │ │ Gotenberg│                  │  Focus NF-e  │
│ Calendar │ │ (PDF)    │                  │  (NFS-e)     │
│ Sheets   │ │          │                  │              │
│ Drive    │ └──────────┘                  └──────────────┘
│ Gmail    │
│ Forms    │
└──────────┘
```

---

## Fluxo de Dados por Módulo

### Módulo 1 — Agendamento via WhatsApp

```
Paciente envia mensagem
         │
         ▼ (webhook)
Evolution API → n8n Workflow 01
         │
         ├─► Google Sheets (busca paciente cadastrado?)
         │
         ├─► Google Calendar (busca horários livres 14 dias)
         │
         ├─► Claude AI Secretária (interpreta intenção + gera resposta natural)
         │
         ├─► [Se horário confirmado]
         │       ├─► Google Calendar (cria evento)
         │       └─► Google Sheets (registra consulta)
         │
         └─► Evolution API (envia resposta ao paciente)
```

### Módulo 2 — Confirmação Semanal

```
Cron: Todo Segunda às 8h
         │
         ▼
Google Calendar (busca consultas da semana)
         │
         ▼ (para cada consulta)
Evolution API → Envia mensagem de confirmação
         │
         ▼ (quando paciente responde)
         ├─► SIM → Atualiza status "Confirmado"
         ├─► REMARCAR → Inicia fluxo de remarcação
         └─► CANCELAR → Remove evento + notifica dentista
```

### Módulo 3 — Anamnese Novo Paciente

```
Workflow 01 detecta NOVO paciente
         │
         ▼
Evolution API → Envia link Google Forms
         │
         ▼ (paciente preenche)
Google Forms → Webhook n8n Workflow 03
         │
         ▼
Claude AI → Gera HTML de anamnese estruturada
         │
         ▼
Gotenberg → Converte HTML para PDF
         │
         ├─► Google Drive (salva PDF)
         ├─► Google Sheets (cadastra paciente)
         └─► Evolution API (confirma recebimento)
```

### Módulo 4 — Prescrição / Laudo

```
Dentista aciona (formulário celular / voz / painel)
         │
         ▼ (dados: tipo, paciente, info clínica)
n8n Workflow 04
         │
         ├─► Claude AI Prescrição ─► HTML Receita
         │   ou
         └─► Claude AI Laudo ──────► HTML Laudo
                   │
                   ▼
             Gotenberg → PDF
                   │
                   ├─► Google Drive
                   ├─► Evolution API (envia ao paciente)
                   └─► Google Sheets (registra)
```

### Módulo 5 — Nota Fiscal

```
Dentista informa: paciente, serviço, valor
         │
         ▼
n8n Workflow 05
         │
         ▼
Focus NF-e API → Emite NFS-e
         │
         ▼ (aguarda processamento)
Focus NF-e API → Busca NF emitida + PDF
         │
         ├─► Evolution API (envia PDF ao paciente)
         ├─► Gmail (envia por email)
         └─► Google Sheets (registra NF)
```

### Módulo 6 — Instagram + WhatsApp Stories

```
Cron: Seg/Qua/Sex às 9h
         │
         ▼
Seleciona tema rotativo
         │
         ▼
Claude AI → Cria legenda IG + texto Story
         │
         ├─► Meta Graph API → Publica no Instagram
         └─► Evolution API → Publica Story WhatsApp
                   │
                   └─► Google Sheets (registra conteúdo)
```

---

## Decisões de Arquitetura

### Por que n8n e não Make/Zapier?
- **Self-hosted**: seus dados ficam no seu servidor
- **Sem limite de execuções** na versão self-hosted
- **Código JavaScript** nos nodes — flexibilidade total
- **Custo zero** de plataforma
- **Workflows exportáveis** em JSON (como neste repositório)

### Por que Evolution API para WhatsApp?
- Open source e gratuito
- Não depende da API oficial (que tem custo por mensagem)
- Suporta múltiplas instâncias
- Webhook nativo para n8n
- **Atenção**: uso da API não oficial pode violar ToS do WhatsApp para uso comercial intensivo. Para volume alto, considere a API oficial via Meta Business.

### Por que Claude para IA?
- Melhor compreensão do português brasileiro
- Contexto longo (ideal para anamneses complexas)
- Geração de HTML e documentos estruturados
- Pay-per-use (sem assinatura mensal)
- Model Sonnet 4.6: equilíbrio custo/qualidade para este caso de uso

### Por que Google (Calendar, Sheets, Drive)?
- Todos grátis no nível individual
- Integração nativa no n8n
- Familiar para a maioria dos usuários
- Backup automático na nuvem
- Acessível de qualquer dispositivo

---

## Segurança e Privacidade

### Dados sensíveis protegidos
- Todos os dados de pacientes ficam nos seus serviços Google (não em terceiros)
- Credenciais de API nunca no código — apenas em variáveis de ambiente
- `.env` nunca commitado no git (está no `.gitignore`)

### LGPD
- Anamnese inclui campo de consentimento
- Dados de pacientes armazenados apenas no Google Workspace do consultório
- Logs do n8n armazenados localmente na VPS

### Recomendações
- Use HTTPS (Cloudflare Tunnel ou SSL próprio) em produção
- Faça backup regular do volume n8n_data
- Rotacione API keys periodicamente (especialmente Meta Access Token — expira em 60 dias)
