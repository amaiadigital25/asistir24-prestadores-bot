#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Falta Node.js (recomendado 20 o 22)."; exit 1; }
command -v npm >/dev/null || { echo "Falta npm."; exit 1; }
[ -f .env ] || cp .env.example .env
npm install --omit=dev
echo "Instalado. Revisá .env, ejecutá npm start y escaneá el QR."
