#!/bin/bash
# Check Google Search Console metrics for SafePassportPic
# Uses saved cookies for authentication

set -e

COOKIES_FILE="$HOME/.agent-browser/profiles/google-gsc-cookies.json"
GSC_URL="https://search.google.com/search-console?resource_id=https%3A%2F%2Fsafepassportpic.com%2F"
PERF_URL="https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Fsafepassportpic.com%2F"

echo "📊 Google Search Console Check"
echo "=============================="
echo ""

if [ ! -f "$COOKIES_FILE" ]; then
    echo "❌ Cookies file not found: $COOKIES_FILE"
    echo "   Run cookie export from Chrome with GSC logged in"
    exit 1
fi

echo "🔐 Loading saved cookies..."
agent-browser cookies set < "$COOKIES_FILE"

echo "🌐 Opening Search Console..."
agent-browser open "$GSC_URL"
sleep 2

echo ""
echo "📈 Overview:"
agent-browser snapshot 2>/dev/null | grep -E "(clicks|impressions|indexed|not indexed)" | head -10

echo ""
echo "Done! For detailed metrics, run:"
echo "  agent-browser snapshot -i"
echo ""
