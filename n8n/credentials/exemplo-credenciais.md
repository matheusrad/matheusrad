# Guia de Credenciais — n8n

Configure cada credencial em: **n8n → Settings → Credentials → New**

---

## 1. Google OAuth2 (Calendar + Sheets + Drive + Gmail)

**Tipo:** `Google OAuth2 API`

### Criar no Google Cloud Console
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto: "SecretárIA Dental"
3. Ative as APIs (Biblioteca → Buscar e ativar cada uma):
   - Google Calendar API
   - Google Sheets API
   - Google Drive API
   - Gmail API
4. Vá em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth 2.0"
   - Tipo: Aplicativo da Web
   - URIs de redirecionamento autorizados: `http://localhost:5678/rest/oauth2-credential/callback`
5. Copie o **Client ID** e **Client Secret**

### No n8n
```
Credential Name: Google - SecretárIA Dental
Client ID: 000000000000-xxxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxx
```
Clique em "Sign in with Google" para autorizar.

**Use esta MESMA credencial** nos nodes: Google Calendar, Google Sheets, Google Drive, Gmail.

---

## 2. Anthropic (Claude AI)

**Tipo:** `HTTP Header Auth`

```
Credential Name: Anthropic API Key
Header Name: x-api-key
Header Value: sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Obter:** [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

---

## 3. Evolution API (WhatsApp)

**Tipo:** `HTTP Header Auth`

```
Credential Name: Evolution API Key
Header Name: apikey
Header Value: SUA_CHAVE_EVOLUTION_AQUI
```

A chave é definida por você no arquivo `.env` quando sobe o Docker.

---

## 4. Focus NF-e (Nota Fiscal)

**Tipo:** `HTTP Basic Auth`

```
Credential Name: Focus NF-e Produção
User: token_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Password: (deixe em branco)
```

**Obter:** [app.focusnfe.com.br](https://app.focusnfe.com.br) → Configurações → Tokens de Acesso

> ⚠️ Para testes, use o ambiente Sandbox: `https://homologacao.focusnfe.com.br`
> Para produção: `https://api.focusnfe.com.br`

---

## 5. Meta Graph API (Instagram)

**Tipo:** `HTTP Query Auth` (ou Header Auth)

```
Credential Name: Meta Graph API
Query Parameter: access_token
Value: EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Como obter o Access Token
1. Crie uma conta de desenvolvedor em [developers.facebook.com](https://developers.facebook.com)
2. Crie um App → tipo "Business"
3. Adicione o produto "Instagram Graph API"
4. Conecte sua conta Instagram Business
5. Gere um token de longa duração (60 dias)
6. Para renovação automática, use o endpoint de refresh

**ID do usuário Instagram:**
```bash
curl "https://graph.facebook.com/v18.0/me?fields=id,name&access_token=SEU_TOKEN"
```

---

## Checklist de Configuração

- [ ] Google OAuth2 criado e autorizado
- [ ] APIs Google ativadas (Calendar, Sheets, Drive, Gmail)
- [ ] Anthropic API Key adicionada
- [ ] Evolution API Key adicionada
- [ ] Focus NF-e token adicionado
- [ ] Meta Access Token adicionado
- [ ] Todas as variáveis de ambiente configuradas no n8n (Settings → Variables)
- [ ] WhatsApp conectado via QR Code
- [ ] Workflows importados e ativados
- [ ] Teste de agendamento realizado com sucesso
