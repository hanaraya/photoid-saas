#!/bin/bash
# Check available metrics for SafePassportPic

echo "📊 SafePassportPic Metrics Check"
echo "================================"
echo ""

# Production health
echo "🌐 Production Health:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://safepassportpic.com/)
echo "   Status: $HTTP_STATUS"
echo ""

# Recent git activity
echo "📝 Recent Commits (last 7 days):"
cd ~/clawd-harish/passport-photo-app/web
git log --oneline --since="7 days ago" | head -10
echo ""

# Test status
echo "🧪 Test Suite:"
npm test -- --coverage --silent 2>&1 | grep -E "Tests:|Test Suites:|Coverage" | head -5
echo ""

# Build size (if available)
if [ -d ".next" ]; then
    echo "📦 Build Size:"
    du -sh .next 2>/dev/null || echo "   N/A"
fi

echo ""
echo "📈 For detailed analytics:"
echo "   - Vercel Dashboard: https://vercel.com/hanarayas-projects/web/analytics"
echo "   - Google Search Console: https://search.google.com/search-console"
echo ""
echo "Note: Real-time traffic metrics require dashboard access."
