# 🦷 SecretárIA Dental — Sistema de Secretaria Virtual Odontológica

Sistema completo de automação para consultório odontológico, integrando **n8n**, **Claude AI**, **WhatsApp**, **Google Calendar**, **Instagram** e emissão de **Nota Fiscal**, sem custo de licença.

---

## Visão Geral

```
Paciente (WhatsApp)
       │
       ▼
  Evolution API (WhatsApp Gateway)
       │
       ▼
    n8n (Orquestrador)
       │
   ┌───┴────────────────────────────────────┐
   │                                        │
   ▼                                        ▼
Claude AI (Secretária)            Google Calendar
   │                                (Agenda)
   ├─► Agendamento / Remarcação
   ├─► Confirmação de consultas
   ├─► Anamnese (1º atendimento)
   ├─► Prescrição / Laudo (PDF)
   ├─► Nota Fiscal (NF-e)
   └─► Instagram / Stories WhatsApp
```

---

## Módulos do Sistema

| # | Módulo | Ferramenta | Descrição |
|---|--------|-----------|-----------|
| 1 | **Agendamento Inteligente** | n8n + Claude + Google Calendar | Recebe mensagem WhatsApp, entende intenção, verifica horários livres, confirma agendamento |
| 2 | **Confirmação Semanal** | n8n + WhatsApp | Toda segunda-feira envia confirmação para pacientes da semana |
| 3 | **Anamnese Digital** | n8n + Claude + Google Forms | Envia formulário para novos pacientes, gera PDF de anamnese |
| 4 | **Prescrição e Laudo** | n8n + Claude + PDF | Gera prescrições e laudos médicos em PDF com assinatura |
| 5 | **Nota Fiscal Automática** | n8n + Focus NF-e API | Emite NF de serviço após conclusão do atendimento |
| 6 | **Instagram + Stories** | n8n + Claude + Meta API | Cria e publica conteúdo odontológico automaticamente |

---

## Stack Tecnológica (100% Gratuita ou Open Source)

| Ferramenta | Função | Custo |
|-----------|--------|-------|
| [n8n](https://n8n.io) | Orquestrador de automações | Grátis (self-hosted) |
| [Evolution API](https://github.com/EvolutionAPI/evolution-api) | Gateway WhatsApp | Grátis (self-hosted) |
| [Claude API](https://console.anthropic.com) | IA Secretária | Pay-per-use (~$0.003/mensagem) |
| [Google Calendar API](https://calendar.google.com) | Gerenciamento de agenda | Grátis |
| [Google Drive API](https://drive.google.com) | Armazenamento de documentos | Grátis (15GB) |
| [Google Sheets API](https://sheets.google.com) | Base de dados pacientes | Grátis |
| [Meta Graph API](https://developers.facebook.com) | Instagram automation | Grátis |
| [Focus NF-e](https://focusnfe.com.br) | Emissão de Nota Fiscal | Grátis até 50 NF/mês |
| [Gotenberg](https://gotenberg.dev) | Conversão HTML→PDF | Grátis (self-hosted) |

---

## Estrutura do Repositório

```
.
├── README.md
├── docs/
│   ├── 01-arquitetura.md          # Arquitetura detalhada do sistema
│   ├── 02-setup-n8n.md            # Instalação e configuração do n8n
│   ├── 03-setup-whatsapp.md       # Configuração Evolution API + WhatsApp
│   ├── 04-setup-google.md         # Google Calendar, Drive, Sheets API
│   ├── 05-setup-instagram.md      # Meta Graph API para Instagram
│   └── 06-setup-nfe.md            # Configuração Nota Fiscal Eletrônica
├── n8n/
│   ├── workflows/
│   │   ├── 01-agendamento-whatsapp.json      # Agendamento via WhatsApp
│   │   ├── 02-confirmacao-semanal.json       # Confirmação semanal
│   │   ├── 03-anamnese-formulario.json       # Anamnese 1º atendimento
│   │   ├── 04-prescricao-laudo.json          # Prescrição e Laudo
│   │   ├── 05-nota-fiscal.json               # Emissão de NF-e
│   │   └── 06-instagram-stories.json         # Conteúdo redes sociais
│   └── credentials/
│       └── exemplo-credenciais.md            # Guia de credenciais
├── templates/
│   ├── anamnese.html              # Template HTML anamnese
│   ├── prescricao.html            # Template HTML prescrição
│   ├── laudo.html                 # Template HTML laudo
│   └── nota-fiscal.html           # Template HTML nota fiscal
├── prompts/
│   ├── secretaria-sistema.md      # System prompt da secretária
│   ├── anamnese-claude.md         # Prompt para gerar anamnese
│   ├── prescricao-claude.md       # Prompt para gerar prescrição
│   ├── laudo-claude.md            # Prompt para gerar laudo
│   └── instagram-claude.md        # Prompt para gerar conteúdo IG
└── scripts/
    ├── setup.sh                   # Script de instalação completa
    └── docker-compose.yml         # Stack completa com Docker
```

---

## Início Rápido

### 1. Clonar o repositório
```bash
git clone https://github.com/matheusrad/matheusrad.git
cd matheusrad
```

### 2. Subir a stack com Docker
```bash
cd scripts
docker-compose up -d
```

### 3. Importar workflows no n8n
1. Acesse `http://localhost:5678`
2. Vá em **Settings → Import Workflow**
3. Importe cada arquivo da pasta `n8n/workflows/`

### 4. Configurar credenciais
Siga o guia em `n8n/credentials/exemplo-credenciais.md`

### 5. Conectar WhatsApp
Escaneie o QR Code em `http://localhost:8080` (Evolution API)

---

## Fluxo de uma Consulta Completa

```
1. Paciente manda mensagem no WhatsApp
        ↓
2. Claude AI entende a intenção (marcar, remarcar, cancelar, dúvida)
        ↓
3. Verifica disponibilidade no Google Calendar
        ↓
4. Confirma agendamento e envia lembrete
        ↓
5. 24h antes: confirmação automática via WhatsApp
        ↓
6. Para paciente novo: envia link de Anamnese (Google Forms)
        ↓
7. Claude processa anamnese → gera PDF → salva no Google Drive
        ↓
8. Após consulta: dentista dita prescrição/laudo → Claude gera PDF
        ↓
9. NF-e emitida automaticamente → enviada por WhatsApp/email
        ↓
10. Post no Instagram gerado automaticamente sobre o procedimento
```

---

## Custos Estimados Mensais

| Item | Custo |
|------|-------|
| VPS para n8n + Evolution API (mínimo) | R$ 20-50/mês |
| Claude API (≈500 interações/mês) | ~R$ 8-15/mês |
| Focus NF-e (até 50 NF gratuitas) | R$ 0 |
| Google (Calendar, Drive, Sheets) | R$ 0 |
| Meta Graph API (Instagram) | R$ 0 |
| **Total estimado** | **R$ 28-65/mês** |

---

## Suporte e Customização

Para dúvidas ou customizações, consulte a documentação em `docs/` ou abra uma issue neste repositório.
