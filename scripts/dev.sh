#!/bin/bash
# Modo LOCAL — desenvolvimento com hot reload
# Uso: bash scripts/dev.sh

set -e
cd "$(dirname "$0")/../webapp"

echo "▶ Iniciando SecretárIA Dental (LOCAL)..."
echo "  URL: http://localhost:3000"
echo ""

npm run dev
