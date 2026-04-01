#!/bin/bash
# LinkedAI Setup Script
set -e

echo "🚀 LinkedAI Setup"
echo "================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "📦 Installing Vercel CLI..."
  npm install -g vercel
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy backend/.env.example to backend/.env and fill in your credentials"
echo "2. Run: cd backend && vercel --prod"
echo "3. Run: cd landing && vercel --prod"
echo "4. Load extension/  in Chrome (chrome://extensions → Developer mode → Load unpacked)"
