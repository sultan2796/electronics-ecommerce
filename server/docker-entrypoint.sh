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

attempt=1
until npx prisma migrate deploy; do
  if [ "$attempt" -ge 5 ]; then
    echo "Migrasiya 5 cəhddən sonra alınmadı"
    exit 1
  fi
  echo "Migrasiya alınmadı, $((attempt * 5)) saniyə sonra yenidən cəhd ($attempt/5)"
  sleep $((attempt * 5))
  attempt=$((attempt + 1))
done

exec node dist/index.js
