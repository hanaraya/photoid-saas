#!/bin/bash

# PhotoID App Deployment Script
set -e

echo "🚀 PhotoID App Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the web directory"
    exit 1
fi

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo "❌ Error: Vercel CLI not found. Run: npm install -g vercel" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Error: npm not found" >&2; exit 1; }

echo "✅ Tools check passed"

# Check if environment variables are set
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found"
    echo "   Create it with your production environment variables"
    exit 1
fi

echo "✅ Environment config found"

# Run build to make sure everything compiles
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo "🔐 Logging into Vercel..."
    vercel login
fi

echo "✅ Vercel authentication verified"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Configure custom domain in Vercel dashboard"
    echo "2. Set environment variables in Vercel dashboard"
    echo "3. Test all functionality"
    echo "4. Set up Stripe webhook: https://your-domain.com/api/webhook"
    echo ""
    echo "📋 See DEPLOYMENT.md for complete checklist"
else
    echo "❌ Deployment failed"
    exit 1
fi