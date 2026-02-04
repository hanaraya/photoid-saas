#!/usr/bin/env bash
#
# SafePassportPic E2E Test Cleanup
# Removes old screenshots and test artifacts
#
# Retention: 7 days by default
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots"
LOG_FILE="$SCRIPT_DIR/e2e-test.log"
RETENTION_DAYS="${1:-7}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting cleanup (retention: $RETENTION_DAYS days)"

# Clean old screenshot directories
if [[ -d "$SCREENSHOTS_DIR" ]]; then
    log "Cleaning screenshots older than $RETENTION_DAYS days..."
    
    # Find and remove old directories
    old_dirs=$(find "$SCREENSHOTS_DIR" -type d -mindepth 1 -mtime "+$RETENTION_DAYS" 2>/dev/null || echo "")
    
    if [[ -n "$old_dirs" ]]; then
        echo "$old_dirs" | while read -r dir; do
            log "  Removing: $dir"
            rm -rf "$dir"
        done
    else
        log "  No old screenshots to clean"
    fi
    
    # Count remaining
    remaining=$(find "$SCREENSHOTS_DIR" -type d -mindepth 1 2>/dev/null | wc -l | tr -d ' ')
    log "  Remaining screenshot runs: $remaining"
fi

# Rotate log file if too large (>10MB)
if [[ -f "$LOG_FILE" ]]; then
    log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat --format=%s "$LOG_FILE" 2>/dev/null || echo "0")
    if [[ $log_size -gt 10485760 ]]; then
        log "Rotating large log file ($log_size bytes)"
        mv "$LOG_FILE" "$LOG_FILE.old"
        tail -1000 "$LOG_FILE.old" > "$LOG_FILE"
        rm "$LOG_FILE.old"
    fi
fi

log "Cleanup complete ✅"
