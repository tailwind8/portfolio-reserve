#!/bin/bash

# Database Reset Script
# This script resets the database and applies all migrations

set -e

echo "🔄 Resetting database..."

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Reset Prisma migrations
echo "📦 Resetting Prisma migrations..."
npx prisma migrate reset --force

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Database reset complete!"
