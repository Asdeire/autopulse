#!/bin/sh
set -e

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run seed:demo:prod

echo "Starting backend..."
exec node dist/src/server.js
