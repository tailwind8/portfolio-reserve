#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment from scratch

set -e

echo "🚀 Setting up development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📋 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "⚠️  Please edit .env.local and add your Supabase credentials"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Verify your .env.local has correct Supabase credentials"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Visit http://localhost:3000"
