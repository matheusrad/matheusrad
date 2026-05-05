# Guia de Setup — n8n + Stack Completa

## 1. Pré-requisitos

- VPS com Ubuntu 22.04 (mínimo 1GB RAM, 20GB disco)
- Docker e Docker Compose instalados
- Domínio ou IP público (para webhooks do WhatsApp)

### Instalar Docker (Ubuntu)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Clonar o Repositório e Configurar

```bash
git clone https://github.com/matheusrad/matheusrad.git
cd matheusrad/scripts

# Copiar e editar as variáveis
cp .env.exemplo .env
nano .env   # Preencha todos os valores
```

---

## 3. Subir a Stack

```bash
cd scripts
docker-compose up -d

# Verificar se todos os serviços subiram
docker-compose ps
```

Serviços disponíveis:
| Serviço | URL | Descrição |
|---------|-----|-----------|
| n8n | http://localhost:5678 | Orquestrador |
| Evolution API | http://localhost:8080 | WhatsApp Gateway |
| Gotenberg | http://localhost:3000 | Conversor PDF |

---

## 4. Configurar WhatsApp (Evolution API)

### 4.1 Criar instância
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "consultorio",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 4.2 Conectar WhatsApp
1. Acesse `http://localhost:8080/instance/qrcode/consultorio?image=true`
2. Abra o WhatsApp no celular → Dispositivos Conectados → Conectar dispositivo
3. Escaneie o QR Code
4. Aguarde "connected" no status

### 4.3 Verificar conexão
```bash
curl http://localhost:8080/instance/connectionState/consultorio \
  -H "apikey: SUA_EVOLUTION_API_KEY"
```

---

## 5. Importar Workflows no n8n

1. Acesse `http://localhost:5678`
2. Faça login (admin / senha que configurou)
3. Clique em **"+"** → **"Import from file"**
4. Importe cada arquivo da pasta `n8n/workflows/` na ordem:
   - `01-agendamento-whatsapp.json`
   - `02-confirmacao-semanal.json`
   - `03-anamnese-formulario.json`
   - `04-prescricao-laudo.json`
   - `05-nota-fiscal.json`
   - `06-instagram-stories.json`

---

## 6. Configurar Credenciais no n8n

Vá em **Settings → Credentials** e adicione:

### Google (Calendar, Sheets, Drive, Gmail)
1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Ative as APIs: Calendar, Sheets, Drive, Gmail
3. Crie uma **OAuth 2.0 Client ID**
4. No n8n: adicione credencial **Google OAuth2 API**
5. Use o mesmo credential em todos os nodes Google

### Anthropic (Claude)
1. Crie uma conta em [console.anthropic.com](https://console.anthropic.com)
2. Gere uma API Key
3. No n8n: adicione credencial **HTTP Header Auth**
   - Name: `Anthropic API Key`
   - Header Name: `x-api-key`
   - Header Value: `sk-ant-XXXXXXXXX`

### Focus NF-e
1. Cadastre em [focusnfe.com.br](https://focusnfe.com.br)
2. Obtenha o token de produção
3. No n8n: adicione credencial **HTTP Basic Auth**
   - User: `token_XXXXXXXX`
   - Password: (deixe em branco)

---

## 7. Configurar Variáveis de Ambiente no n8n

Vá em **Settings → Variables** e adicione cada variável do arquivo `.env`:

```
ANTHROPIC_API_KEY = sk-ant-XXXXX
GOOGLE_CALENDAR_ID = seuemail@gmail.com
GOOGLE_SHEETS_PACIENTES_ID = 1BxiM...
EVOLUTION_API_URL = http://evolution:8080
EVOLUTION_API_KEY = CHAVE_AQUI
EVOLUTION_INSTANCE = consultorio
GOTENBERG_URL = http://gotenberg:3000
NOME_FANTASIA = Consultório Dra. [NOME]
TELEFONE_CONSULTORIO = (11) 99999-9999
CNPJ_CONSULTORIO = 00.000.000/0001-00
... (todas as variáveis do .env.exemplo)
```

Para as variáveis de prompt (`PROMPT_SECRETARIA`, etc.), copie o conteúdo dos arquivos em `prompts/` (apenas o texto entre `---PROMPT---`).

---

## 8. Ativar os Workflows

1. Abra cada workflow importado
2. Clique no toggle para **Ativo**
3. O webhook URL será exibido — anote para configuração externa

### URLs dos Webhooks (exemplo com localhost)
```
Agendamento WhatsApp:   http://localhost:5678/webhook/whatsapp-webhook
Novo Paciente:          http://localhost:5678/webhook/novo-paciente
Anamnese Preenchida:    http://localhost:5678/webhook/anamnese-resposta
Gerar Documento:        http://localhost:5678/webhook/gerar-documento
Emitir Nota Fiscal:     http://localhost:5678/webhook/emitir-nf
```

---

## 9. Teste Completo

### Testar agendamento
```bash
# Simula mensagem WhatsApp de um paciente
curl -X POST http://localhost:5678/webhook/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "event": "messages.upsert",
      "data": {
        "key": { "remoteJid": "5511999999999@s.whatsapp.net", "id": "TEST001" },
        "message": { "conversation": "Olá, gostaria de agendar uma consulta" },
        "pushName": "Maria Silva"
      }
    }
  }'
```

### Testar geração de prescrição
```bash
curl -X POST http://localhost:5678/webhook/gerar-documento \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "prescricao",
    "paciente": {
      "nome": "João Silva",
      "dataNascimento": "15/03/1985",
      "telefone": "5511999999999"
    },
    "info_clinica": "Amoxicilina 500mg, 1 cápsula a cada 8 horas por 7 dias. Ibuprofeno 600mg a cada 8 horas por 3 dias com alimentos."
  }'
```

---

## 10. Configurar Domínio (Produção)

Para receber webhooks em produção, você precisa de uma URL pública:

### Opção A — Cloudflare Tunnel (Grátis)
```bash
# Instalar cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:5678
```

### Opção B — ngrok (Grátis para testes)
```bash
ngrok http 5678
# Use a URL gerada para os webhooks
```

### Opção C — VPS com Nginx + SSL
```nginx
server {
    server_name n8n.seudominio.com.br;
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
