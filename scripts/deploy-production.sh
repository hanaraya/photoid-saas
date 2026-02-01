#!/bin/bash
# Deploy to Vercel production (SafePassportPic)
# REQUIRES: Quality gate must pass first!

set -e

echo "🚀 SafePassportPic Production Deployment"
echo "========================================"
echo ""

cd ~/clawd-harish/passport-photo-app

# Check quality gate first
echo "🔒 Running quality gate..."
if ! ./scripts/quality-gate.sh; then
    echo ""
    echo "❌ DEPLOYMENT BLOCKED: Quality gate failed!"
    echo "   Fix the issues above before deploying."
    exit 1
fi

echo ""
echo "✅ Quality gate passed!"
echo ""

# Deploy to production
echo "📦 Deploying to Vercel..."
cd web
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🔍 Verifying production..."
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://safepassportpic.com/)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Production is live: https://safepassportpic.com"
else
    echo "⚠️  Production returned: $HTTP_STATUS (may still be propagating)"
fi
