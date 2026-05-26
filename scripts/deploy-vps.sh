#!/bin/bash
# Deploy para VPS — build + reinicia PM2
# Uso: bash scripts/deploy-vps.sh
#
# Pré-requisitos na VPS:
#   npm install -g pm2
#   cp webapp/.env.production.exemplo webapp/.env.production
#   # preencher .env.production com os valores reais

set -e
cd "$(dirname "$0")/.."

echo "▶ Build SecretárIA Dental (VPS)..."

# 1. Instala dependências
cd webapp
npm ci --omit=dev

# 2. Build de produção (lê .env.production automaticamente)
npm run build

echo ""
echo "▶ Reiniciando PM2..."
cd ..

# Se já existe, reinicia. Se não, inicia pela primeira vez.
if pm2 list | grep -q "secretaria-dental"; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

echo ""
echo "✓ Deploy concluído!"
echo "  Acesse: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "  Logs: pm2 logs secretaria-dental"
echo "  Status: pm2 status"
