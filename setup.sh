#!/bin/bash

# Book Generation Worker Setup Script
# This script helps you set up the Cloudflare Worker

set -e

echo "🚀 Setting up Book Generation Worker..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please install Node.js first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed!"
echo ""

# Check if .dev.vars exists
if [ ! -f .dev.vars ]; then
    echo "📝 Creating .dev.vars from template..."
    cp .dev.vars.example .dev.vars
    echo "⚠️  Please edit .dev.vars and add your API keys before running the worker!"
    echo ""
fi

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .dev.vars and add your GEMINI_API_KEY"
echo "  2. Set ALLOWED_ORIGINS for your WordPress domain"
echo "  3. (Optional) Set API_KEY for extra security"
echo "  4. Test locally: npm run dev"
echo "  5. Deploy: npm run deploy"
echo ""
echo "📚 Read README.md for detailed instructions."

