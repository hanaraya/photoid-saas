#!/bin/bash
# Check Google Search Console metrics for SafePassportPic
# Uses agent-browser for dashboard access

echo "📊 Google Search Console Check"
echo "=============================="
echo ""
echo "Dashboard: https://search.google.com/search-console?resource_id=sc-domain:safepassportpic.com"
echo "Account: harish.narayanappa@gmail.com"
echo ""
echo "To check metrics programmatically, use agent-browser:"
echo ""
echo "  agent-browser open 'https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:safepassportpic.com'"
echo "  agent-browser snapshot -i"
echo "  # Look for impressions, clicks, CTR, position"
echo ""
echo "Key pages to monitor:"
echo "  - / (homepage)"
echo "  - /app (main conversion page)"
echo "  - /us-passport-photo"
echo "  - /uk-passport-photo"
echo "  - /indian-passport-photo"
echo ""
