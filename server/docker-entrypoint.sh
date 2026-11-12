#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  for file in /etc/secrets/DATABASE_URL /etc/secrets/.env /app/DATABASE_URL /app/.env; do
    if [ -f "$file" ]; then
      found="$(grep -o 'postgres[a-z]*://[^"'"'"' ]*' "$file" | head -n 1 || true)"
      if [ -n "$found" ]; then
        export DATABASE_URL="$found"
        break
      fi
    fi
  done
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL tapılmadı"
  exit 1
fi

npx prisma migrate deploy
exec node dist/index.js
