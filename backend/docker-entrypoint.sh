#!/bin/sh
set -e

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting backend..."
exec node dist/src/server.js
