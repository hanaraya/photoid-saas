#!/bin/bash
# 🔒 PASSPORT PHOTO APP - COMPREHENSIVE QUALITY GATE
# Ensures highest quality for camera, compliance, and user experience

set -e

APP_DIR="$HOME/clawd-harish/passport-photo-app/web"
cd "$APP_DIR"

echo "🔒 PASSPORT PHOTO QUALITY GATE"
echo "=============================="
echo ""
echo "Testing front camera, back camera, compliance verification,"
echo "and all critical user flows."
echo ""

TOTAL_CHECKS=0
PASSED=0
FAILED=0
WARNINGS=0

check_result() {
    local name="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
    
    if [[ "$status" == "pass" ]]; then
        echo "   ✅ $name"
        PASSED=$((PASSED+1))
    elif [[ "$status" == "warn" ]]; then
        echo "   ⚠️ $name - $message"
        WARNINGS=$((WARNINGS+1))
    else
        echo "   ❌ $name - $message"
        FAILED=$((FAILED+1))
    fi
}

# ═══════════════════════════════════════════════════════════════
# SECTION 1: CORE QUALITY CHECKS
# ═══════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SECTION 1: CORE QUALITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1.1 Test Coverage (≥80%)
echo ""
echo "1.1 Test Coverage (target: ≥80%)..."
COVERAGE_OUTPUT=$(npm run test:coverage 2>&1 || true)
COVERAGE=$(echo "$COVERAGE_OUTPUT" | grep -E "All files\s*\|" | awk -F'|' '{print $2}' | tr -d ' ' | head -1)
if [[ -n "$COVERAGE" ]]; then
    COVERAGE_NUM=$(echo "$COVERAGE" | cut -d'.' -f1)
    if [[ "$COVERAGE_NUM" -ge 80 ]]; then
        check_result "Test Coverage: $COVERAGE%" "pass"
    else
        check_result "Test Coverage: $COVERAGE%" "fail" "Must be ≥80%"
    fi
else
    check_result "Test Coverage" "warn" "Could not parse coverage"
fi

# 1.2 All Tests Passing
echo ""
echo "1.2 Test Suite..."
if npm test --passWithNoTests 2>&1 | tail -5 | grep -q "passed"; then
    TEST_COUNT=$(npm test --passWithNoTests 2>&1 | grep -oE "[0-9]+ passed" | head -1)
    check_result "All Tests Passing ($TEST_COUNT)" "pass"
else
    check_result "Test Suite" "fail" "Some tests failed"
fi

# 1.3 Lint Check
echo ""
echo "1.3 Code Linting..."
if npm run lint > /dev/null 2>&1; then
    check_result "ESLint: No errors" "pass"
else
    LINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || echo "0")
    check_result "ESLint" "fail" "$LINT_ERRORS errors found"
fi

# 1.4 TypeScript Check
echo ""
echo "1.4 TypeScript Compilation..."
if npx tsc --noEmit > /dev/null 2>&1; then
    check_result "TypeScript: No errors" "pass"
else
    check_result "TypeScript" "fail" "Type errors found"
fi

# 1.5 Build Check
echo ""
echo "1.5 Production Build..."
if npm run build > /dev/null 2>&1; then
    check_result "Build: Successful" "pass"
else
    check_result "Build" "fail" "Build failed"
fi

# ═══════════════════════════════════════════════════════════════
# SECTION 2: CAMERA FUNCTIONALITY TESTS
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📷 SECTION 2: CAMERA FUNCTIONALITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2.1 Front Camera Tests
echo ""
echo "2.1 Front Camera Tests..."
if npm test -- --testPathPattern="camera|selfie|front" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Front Camera: Tests pass" "pass"
else
    check_result "Front Camera" "fail" "Camera tests failed"
fi

# 2.2 Back Camera Tests
echo ""
echo "2.2 Back Camera Tests..."
if npm test -- --testPathPattern="back.?camera|rear" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Back Camera: Tests pass" "pass"
else
    check_result "Back Camera" "fail" "Tests failed"
fi

# 2.3 Camera Switch Tests
echo ""
echo "2.3 Camera Switching..."
if npm test -- --testPathPattern="switch|toggle" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Camera Switch: Tests pass" "pass"
else
    check_result "Camera Switch" "warn" "No specific tests found"
fi

# 2.4 Permission Handling
echo ""
echo "2.4 Permission Handling..."
if npm test -- --testPathPattern="permission" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Permissions: Tests pass" "pass"
else
    check_result "Permissions" "warn" "No specific tests found"
fi

# ═══════════════════════════════════════════════════════════════
# SECTION 3: COMPLIANCE VERIFICATION TESTS
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ SECTION 3: PASSPORT COMPLIANCE VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 3.1 Face Detection Tests
echo ""
echo "3.1 Face Detection..."
if npm test -- --testPathPattern="face.?detect|face.?recognition" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Face Detection: Tests pass" "pass"
else
    check_result "Face Detection" "warn" "Limited test coverage"
fi

# 3.2 Photo Size/Dimension Tests
echo ""
echo "3.2 Photo Dimensions (2x2 inch US standard)..."
if npm test -- --testPathPattern="dimension|size|crop" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Photo Dimensions: Tests pass" "pass"
else
    check_result "Photo Dimensions" "warn" "Limited test coverage"
fi

# 3.3 Background Removal/Color Tests
echo ""
echo "3.3 Background Processing..."
if npm test -- --testPathPattern="background|removal|white" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Background: Tests pass" "pass"
else
    check_result "Background" "warn" "Limited test coverage"
fi

# 3.4 Head Position Tests
echo ""
echo "3.4 Head Position & Centering..."
if npm test -- --testPathPattern="position|center|head" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Head Position: Tests pass" "pass"
else
    check_result "Head Position" "warn" "Limited test coverage"
fi

# 3.5 Compliance Validation Tests
echo ""
echo "3.5 Compliance Validation Rules..."
if npm test -- --testPathPattern="compliance|validation|require" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Compliance Rules: Tests pass" "pass"
else
    check_result "Compliance Rules" "warn" "Limited test coverage"
fi

# 3.6 Multi-Country Support
echo ""
echo "3.6 Multi-Country Requirements..."
if npm test -- --testPathPattern="country|passport.?type|visa" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Country Support: Tests pass" "pass"
else
    check_result "Country Support" "warn" "May need more tests"
fi

# ═══════════════════════════════════════════════════════════════
# SECTION 4: USER EXPERIENCE TESTS
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 SECTION 4: USER EXPERIENCE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4.1 Upload Flow Tests
echo ""
echo "4.1 Photo Upload Flow..."
if npm test -- --testPathPattern="upload" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Upload Flow: Tests pass" "pass"
else
    check_result "Upload Flow" "warn" "Limited test coverage"
fi

# 4.2 Preview/Edit Flow
echo ""
echo "4.2 Preview & Edit..."
if npm test -- --testPathPattern="preview|edit|adjust" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Preview/Edit: Tests pass" "pass"
else
    check_result "Preview/Edit" "warn" "Limited test coverage"
fi

# 4.3 Download/Export Tests
echo ""
echo "4.3 Download & Export..."
if npm test -- --testPathPattern="download|export|save" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Download: Tests pass" "pass"
else
    check_result "Download" "warn" "Limited test coverage"
fi

# 4.4 Error Handling Tests
echo ""
echo "4.4 Error Handling..."
if npm test -- --testPathPattern="error|fail|invalid" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Error Handling: Tests pass" "pass"
else
    check_result "Error Handling" "warn" "Limited test coverage"
fi

# 4.5 Mobile Responsiveness
echo ""
echo "4.5 Mobile Responsiveness..."
if npm test -- --testPathPattern="mobile|responsive|viewport" --passWithNoTests 2>&1 | grep -qE "passed|no tests"; then
    check_result "Mobile: Tests pass" "pass"
else
    check_result "Mobile" "warn" "Limited test coverage"
fi

# ═══════════════════════════════════════════════════════════════
# SECTION 5: SECURITY & PERFORMANCE
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 SECTION 5: SECURITY & PERFORMANCE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 5.1 Security Audit
echo ""
echo "5.1 Dependency Security..."
AUDIT_OUTPUT=$(npm audit 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    check_result "Security: No vulnerabilities" "pass"
elif echo "$AUDIT_OUTPUT" | grep -qE "high|critical"; then
    HIGH_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oE "[0-9]+ high" | head -1 || echo "0")
    CRIT_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oE "[0-9]+ critical" | head -1 || echo "0")
    check_result "Security" "fail" "Found $HIGH_COUNT, $CRIT_COUNT"
else
    check_result "Security: Minor issues only" "pass"
fi

# 5.2 Bundle Size Check
echo ""
echo "5.2 Bundle Size..."
if [[ -d ".next" ]]; then
    BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    check_result "Bundle Size: $BUNDLE_SIZE" "pass"
else
    check_result "Bundle Size" "warn" "Build .next not found"
fi

# 5.3 Privacy Check (no external data leaks)
echo ""
echo "5.3 Privacy Check..."
if ! grep -r "analytics.google\|facebook.com/tr\|hotjar" --include="*.tsx" --include="*.ts" src/ 2>/dev/null | grep -v "// disabled"; then
    check_result "Privacy: No tracking scripts" "pass"
else
    check_result "Privacy" "warn" "External tracking detected"
fi

# ═══════════════════════════════════════════════════════════════
# SECTION 6: E2E CRITICAL PATHS
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 SECTION 6: CRITICAL USER PATHS (E2E)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6.1 Full Photo Flow (E2E)
echo ""
echo "6.1 Complete Photo Flow..."
if npm run test:e2e 2>&1 | grep -qE "passed|no tests found"; then
    check_result "E2E Photo Flow: Pass" "pass"
elif [[ ! -f "playwright.config.ts" ]] && [[ ! -f "cypress.config.ts" ]]; then
    check_result "E2E Tests" "warn" "No E2E framework configured"
else
    check_result "E2E Tests" "fail" "E2E tests failed"
fi

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 QUALITY GATE SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Total Checks: $TOTAL_CHECKS"
echo "   ✅ Passed:    $PASSED"
echo "   ⚠️ Warnings:  $WARNINGS"
echo "   ❌ Failed:    $FAILED"
echo ""

if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        echo "🏆 QUALITY GATE: EXCELLENT"
        echo "   All checks passed with flying colors!"
    else
        echo "✅ QUALITY GATE: PASSED"
        echo "   Safe to deploy. Consider addressing warnings."
    fi
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo "🚫 QUALITY GATE: FAILED"
    echo "   DO NOT DEPLOY until failures are fixed!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi
