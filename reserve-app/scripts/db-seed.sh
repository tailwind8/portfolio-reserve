#!/bin/bash

# Database Seed Script
# This script seeds the database with demo data

set -e

echo "🌱 Seeding database with demo data..."

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run seed script (you'll need to create this)
# npx prisma db seed

echo "⚠️  Note: Create prisma/seed.ts to add demo data"
echo "✅ Seed script ready!"
