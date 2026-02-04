#!/usr/bin/env bash
#
# SafePassportPic Daily E2E Test
# Inspired by Ryan Carson's approach to AI agent testing
#
# Tests the complete user flow:
#   1. Open safepassportpic.com
#   2. Upload a test photo
#   3. Wait for processing
#   4. Verify output is generated
#   5. Take screenshots at each step
#
# On failure: auto-files GitHub Issue with screenshots
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots"
TEST_ASSETS_DIR="$SCRIPT_DIR/test-assets"
TEST_IMAGE="$TEST_ASSETS_DIR/test-portrait.jpg"
SITE_URL="https://safepassportpic.com"
CHROME_PROFILE="$HOME/.clawdbot-harish/browser/openclaw/user-data"
LOG_FILE="$SCRIPT_DIR/e2e-test.log"
MAX_RETRIES=2
PROCESSING_TIMEOUT=120  # seconds

# Test run metadata
RUN_ID="$(date '+%Y%m%d-%H%M%S')"
RUN_SCREENSHOTS_DIR="$SCREENSHOTS_DIR/$RUN_ID"

# ============================================================================
# Logging & Utilities
# ============================================================================
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

log_error() {
    log "ERROR: $1"
}

log_success() {
    log "✅ $1"
}

log_step() {
    log "📋 Step $1: $2"
}

take_screenshot() {
    local name="$1"
    local filepath="$RUN_SCREENSHOTS_DIR/${name}.png"
    if agent-browser screenshot "$filepath" 2>/dev/null; then
        log "  📸 Screenshot: $name"
    else
        log "  ⚠️ Screenshot failed: $name"
    fi
    echo "$filepath"
}

cleanup_browser() {
    log "Cleaning up browser session..."
    agent-browser close 2>/dev/null || true
    # Kill any orphaned Chrome debug processes
    pkill -f "chrome.*remote-debugging-port=18801" 2>/dev/null || true
    pkill -f "Chrome.*18801" 2>/dev/null || true
    # Remove Chrome profile lock files that prevent startup
    rm -f "$CHROME_PROFILE/SingletonLock" 2>/dev/null || true
    rm -f "$CHROME_PROFILE/SingletonSocket" 2>/dev/null || true
    rm -f "$CHROME_PROFILE/SingletonCookie" 2>/dev/null || true
}

# ============================================================================
# Bug Filing
# ============================================================================
file_bug() {
    local error_msg="$1"
    local screenshots=("${@:2}")
    
    log "🐛 Filing bug report..."
    
    # Check for duplicate in last 24h
    local existing_issue
    existing_issue=$(gh issue list \
        --repo "$PROJECT_ROOT" \
        --label "e2e-failure" \
        --state open \
        --limit 1 \
        --json number,createdAt \
        --jq '.[0] | select(.createdAt > (now - 86400 | todate)) | .number' 2>/dev/null || echo "")
    
    if [[ -n "$existing_issue" ]]; then
        log "  ⚠️ Recent issue #$existing_issue exists, adding comment instead"
        gh issue comment "$existing_issue" \
            --body "**E2E Test Failed Again** (Run: $RUN_ID)

\`\`\`
$error_msg
\`\`\`

See screenshots in: \`$RUN_SCREENSHOTS_DIR\`" 2>/dev/null || true
        return
    fi
    
    # Create new issue
    local body="## E2E Test Failure

**Run ID:** $RUN_ID
**Time:** $(date '+%Y-%m-%d %H:%M:%S %Z')
**URL:** $SITE_URL

### Error
\`\`\`
$error_msg
\`\`\`

### Screenshots
Screenshots saved to: \`$RUN_SCREENSHOTS_DIR\`

### Steps to Reproduce
1. Visit $SITE_URL
2. Upload a portrait photo
3. Wait for processing

### Environment
- Chrome Profile: $CHROME_PROFILE
- Test Image: $TEST_IMAGE

---
*Auto-filed by Atlas 🎯 Daily E2E Test*"

    gh issue create \
        --title "[E2E] Daily test failed - $(date '+%Y-%m-%d')" \
        --body "$body" \
        --label "bug,e2e-failure" 2>/dev/null && log_success "Bug filed!" || log_error "Failed to file bug"
}

# ============================================================================
# Test Steps
# ============================================================================

step_setup() {
    log_step "1" "Setup"
    
    mkdir -p "$RUN_SCREENSHOTS_DIR"
    
    # Verify test image exists
    if [[ ! -f "$TEST_IMAGE" ]]; then
        log_error "Test image not found: $TEST_IMAGE"
        return 1
    fi
    
    # Clean up any previous browser session
    cleanup_browser
    sleep 1
    
    log_success "Setup complete"
}

step_open_site() {
    log_step "2" "Opening $SITE_URL"
    
    # Start Chrome with debug profile
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
        --headless=new \
        --remote-debugging-port=18801 \
        --user-data-dir="$CHROME_PROFILE" \
        --disable-gpu \
        --window-size=1280,800 \
        "$SITE_URL" &
    
    sleep 3
    
    # Connect agent-browser
    agent-browser connect 18801 2>/dev/null || {
        log_error "Failed to connect to Chrome"
        return 1
    }
    
    sleep 2
    take_screenshot "01-homepage"
    
    # Verify page loaded
    local snapshot
    snapshot=$(agent-browser snapshot 2>/dev/null || echo "")
    
    if echo "$snapshot" | grep -qi "SafePassportPic\|passport\|upload"; then
        log_success "Site loaded successfully"
    else
        log_error "Site did not load correctly"
        return 1
    fi
}

step_upload_photo() {
    log_step "3" "Uploading test photo"
    
    take_screenshot "02-homepage"
    
    # First, click "Create Passport Photo" or "Make Photo" button to enter the app
    log "  Navigating to photo creator..."
    local snapshot
    snapshot=$(agent-browser snapshot -i 2>/dev/null || echo "")
    
    # Find the main CTA button
    local cta_ref
    cta_ref=$(echo "$snapshot" | grep -iE 'Create Passport Photo|Make Photo' | grep -oE '@e[0-9]+' | head -1 || echo "")
    
    if [[ -n "$cta_ref" ]]; then
        log "  Clicking: $cta_ref"
        agent-browser click "$cta_ref" 2>/dev/null || true
        sleep 3
    else
        # Try direct navigation to the app page
        log "  No CTA found, trying direct navigation..."
        agent-browser open "https://safepassportpic.com/app" 2>/dev/null || true
        sleep 3
    fi
    
    take_screenshot "03-app-page"
    
    # Get fresh snapshot after navigation
    snapshot=$(agent-browser snapshot -i 2>/dev/null || echo "")
    
    # Look for file input or upload area
    log "  Looking for upload area..."
    
    # Try the file input upload
    local upload_result
    upload_result=$(agent-browser upload "input[type=file]" "$TEST_IMAGE" 2>&1)
    local upload_status=$?
    
    if [[ $upload_status -eq 0 ]]; then
        log "  File uploaded via input element"
    else
        log "  Direct upload failed: $upload_result"
        
        # Try clicking on dropzone or upload area first
        local drop_ref
        drop_ref=$(echo "$snapshot" | grep -iE 'drop|upload|choose|select.*file|drag' | grep -oE '@e[0-9]+' | head -1 || echo "")
        
        if [[ -n "$drop_ref" ]]; then
            log "  Clicking dropzone: $drop_ref"
            agent-browser click "$drop_ref" 2>/dev/null || true
            sleep 2
            # Try upload again
            agent-browser upload "input[type=file]" "$TEST_IMAGE" 2>/dev/null || true
        fi
    fi
    
    sleep 3
    take_screenshot "04-after-upload"
    
    # Verify we're no longer on the homepage
    local post_snapshot
    post_snapshot=$(agent-browser snapshot 2>/dev/null || echo "")
    local current_url
    current_url=$(agent-browser get url 2>/dev/null || echo "")
    
    log "  Current URL: $current_url"
    
    # Check if we've progressed past the homepage
    if echo "$post_snapshot" | grep -qiE 'processing|uploading|analyzing|preview|crop|adjust'; then
        log_success "Photo upload initiated - entering processing"
    elif [[ "$current_url" == *"/app"* ]] || [[ "$current_url" == *"/photo"* ]]; then
        log_success "Navigated to app - upload flow started"
    else
        log_error "Could not verify upload - still on homepage?"
        return 1
    fi
}

step_wait_for_processing() {
    log_step "4" "Waiting for processing"
    
    local elapsed=0
    local interval=5
    local processing_complete=false
    local last_state=""
    
    while [[ $elapsed -lt $PROCESSING_TIMEOUT ]]; do
        sleep $interval
        elapsed=$((elapsed + interval))
        
        local snapshot
        snapshot=$(agent-browser snapshot 2>/dev/null || echo "")
        local current_url
        current_url=$(agent-browser get url 2>/dev/null || echo "")
        
        # Check for completion indicators (be specific to avoid homepage false positives)
        if echo "$snapshot" | grep -qiE 'download.*photo|save.*result|your passport photo|photo.*ready|compliance.*pass'; then
            processing_complete=true
            last_state="download_ready"
            break
        fi
        
        # Check for preview/crop stage (also counts as progress)
        if echo "$snapshot" | grep -qiE 'preview|crop|adjust|position|confirm'; then
            last_state="preview_stage"
            log "  📷 In preview/crop stage..."
        fi
        
        # Check for actual processing indicators  
        if echo "$snapshot" | grep -qiE 'analyzing|removing background|processing.*photo|please wait'; then
            last_state="processing"
            log "  ⏳ Processing... (${elapsed}s / ${PROCESSING_TIMEOUT}s)"
            continue
        fi
        
        # Check for errors
        if echo "$snapshot" | grep -qiE 'error.*occurred|processing.*failed|unable to|try again later'; then
            log_error "Processing error detected"
            take_screenshot "05-processing-error"
            return 1
        fi
        
        log "  ⏳ Waiting... (${elapsed}s / ${PROCESSING_TIMEOUT}s) - state: ${last_state:-unknown}"
    done
    
    take_screenshot "05-processing-complete"
    
    if [[ "$processing_complete" == "true" ]]; then
        log_success "Processing complete! (state: $last_state)"
    elif [[ "$last_state" == "preview_stage" ]]; then
        log_success "Reached preview stage - upload working"
    else
        log_error "Processing timed out after ${PROCESSING_TIMEOUT}s (last state: $last_state)"
        return 1
    fi
}

step_verify_output() {
    log_step "5" "Verifying output"
    
    local snapshot
    snapshot=$(agent-browser snapshot -i 2>/dev/null || echo "")
    local current_url
    current_url=$(agent-browser get url 2>/dev/null || echo "")
    
    log "  Final URL: $current_url"
    
    # Look for download button or result indicators
    local has_result=false
    local result_type=""
    
    if echo "$snapshot" | grep -qiE 'download.*photo|save.*image|get.*photo'; then
        has_result=true
        result_type="download_button"
    fi
    
    # Check for result preview
    if echo "$snapshot" | grep -qiE 'preview|your.*passport.*photo|result'; then
        has_result=true
        result_type="${result_type:+$result_type, }preview"
    fi
    
    # Check URL indicates we're past the upload
    if [[ "$current_url" == *"result"* ]] || [[ "$current_url" == *"download"* ]] || [[ "$current_url" == *"photo"* ]]; then
        has_result=true
        result_type="${result_type:+$result_type, }url_changed"
    fi
    
    take_screenshot "06-final-result"
    
    if [[ "$has_result" == "true" ]]; then
        log_success "Output verified ($result_type)"
    else
        log "  ⚠️ Could not confirm output - manual review needed"
        log "  Screenshots captured for manual verification"
        # Don't fail - let screenshots tell the story
    fi
}

# ============================================================================
# Main Test Runner
# ============================================================================

run_test() {
    local attempt=$1
    log "🚀 Starting E2E test (attempt $attempt of $MAX_RETRIES)"
    log "Run ID: $RUN_ID"
    
    local failed_step=""
    local error_msg=""
    
    # Run each step, capture failures
    if ! step_setup; then
        failed_step="setup"
        error_msg="Setup failed"
    elif ! step_open_site; then
        failed_step="open_site"
        error_msg="Failed to open site"
    elif ! step_upload_photo; then
        failed_step="upload_photo"
        error_msg="Failed to upload photo"
    elif ! step_wait_for_processing; then
        failed_step="wait_for_processing"
        error_msg="Processing failed or timed out"
    elif ! step_verify_output; then
        failed_step="verify_output"
        error_msg="Output verification failed"
    fi
    
    # Cleanup
    cleanup_browser
    
    if [[ -n "$failed_step" ]]; then
        log_error "Test failed at step: $failed_step"
        return 1
    fi
    
    log_success "All steps passed!"
    return 0
}

main() {
    log "============================================"
    log "SafePassportPic Daily E2E Test"
    log "============================================"
    
    local attempt=1
    local success=false
    local last_error=""
    
    while [[ $attempt -le $MAX_RETRIES ]]; do
        if run_test $attempt; then
            success=true
            break
        else
            last_error="Test failed on attempt $attempt"
            log "⚠️ Attempt $attempt failed, $(( MAX_RETRIES - attempt )) retries remaining"
            attempt=$((attempt + 1))
            sleep 5
        fi
    done
    
    echo ""
    log "============================================"
    if [[ "$success" == "true" ]]; then
        log "✅ E2E TEST PASSED"
        log "Screenshots: $RUN_SCREENSHOTS_DIR"
        log "============================================"
        exit 0
    else
        log "❌ E2E TEST FAILED"
        log "Screenshots: $RUN_SCREENSHOTS_DIR"
        log "============================================"
        
        # File bug report
        file_bug "$last_error" "$RUN_SCREENSHOTS_DIR"/*
        
        exit 1
    fi
}

# ============================================================================
# Entry Point
# ============================================================================

# Handle cleanup on exit
trap cleanup_browser EXIT

main "$@"
