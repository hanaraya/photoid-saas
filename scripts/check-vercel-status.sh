#!/bin/bash
# Check Vercel deployment status for SafePassportPic

set -e

echo "🚀 Vercel Deployment Status"
echo "=========================="
echo ""

cd ~/clawd-harish/passport-photo-app/web

# Check who we're logged in as
echo "📋 Account: $(vercel whoami 2>/dev/null)"
echo ""

# Get recent deployments
echo "📦 Recent Deployments:"
vercel ls 2>/dev/null | head -10
echo ""

# Check production URL
echo "🌐 Production Status:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://safepassportpic.com/)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ safepassportpic.com → $HTTP_STATUS OK"
else
    echo "   ❌ safepassportpic.com → $HTTP_STATUS"
fi

# Quick health check on key endpoints
echo ""
echo "🔍 Endpoint Health:"
for endpoint in "/" "/app" "/us-passport-photo" "/api/health"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://safepassportpic.com${endpoint}" 2>/dev/null || echo "ERR")
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ ${endpoint} → ${STATUS}"
    elif [ "$STATUS" = "404" ]; then
        echo "   ⚠️  ${endpoint} → ${STATUS}"
    else
        echo "   ❌ ${endpoint} → ${STATUS}"
    fi
done

echo ""
echo "Done!"
