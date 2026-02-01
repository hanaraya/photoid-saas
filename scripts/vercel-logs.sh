#!/bin/bash
# View recent Vercel logs for SafePassportPic

cd ~/clawd-harish/passport-photo-app/web

echo "📜 Recent Vercel Deployment Logs"
echo "================================"
echo ""

# Get latest deployment URL
LATEST=$(vercel ls 2>/dev/null | grep -E "https://" | head -1 | awk '{print $2}')

if [ -n "$LATEST" ]; then
    echo "Deployment: $LATEST"
    echo ""
    vercel logs "$LATEST" 2>/dev/null | tail -50
else
    echo "Could not find recent deployment"
fi
