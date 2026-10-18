#!/usr/bin/env bash
# Pull latest code and restart on the server. Usage: ./deploy/deploy.sh [docker|pm2]
set -euo pipefail
MODE="${1:-docker}"
cd "$(dirname "$0")/.."
git pull --ff-only
if [ "$MODE" = "docker" ]; then
  docker compose up -d --build
else
  npm ci
  npm run build
  cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
  pm2 startOrReload ecosystem.config.js && pm2 save
fi
echo "Deployed."
