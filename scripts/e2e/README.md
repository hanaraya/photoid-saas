# SafePassportPic Daily E2E Testing

Automated end-to-end testing for SafePassportPic, inspired by [Ryan Carson's approach](https://x.com/ryancarson/status/2018354837918732297).

## Overview

This system runs daily at 9 AM to verify the complete user flow:
1. Open safepassportpic.com
2. Navigate to the photo creator
3. Upload a test photo
4. Verify the image loads in preview
5. Take screenshots at each step

On failure, it automatically files a GitHub Issue.

## Files

```
scripts/e2e/
├── daily-e2e-test.sh     # Main test script
├── cleanup.sh            # Removes old screenshots (7 day retention)
├── e2e-test.log          # Test execution log
├── test-assets/
│   └── test-portrait.jpg # Test image (generated)
└── screenshots/
    └── YYYYMMDD-HHMMSS/  # Screenshots per run
```

## Usage

### Run Manually
```bash
cd passport-photo-app/scripts/e2e
./daily-e2e-test.sh
```

### Run Cleanup
```bash
./cleanup.sh          # Default 7 day retention
./cleanup.sh 3        # Custom retention (3 days)
```

## Configuration

Edit `daily-e2e-test.sh` to change:
- `SITE_URL` - Target URL (default: https://safepassportpic.com)
- `PROCESSING_TIMEOUT` - Max wait time for processing (default: 120s)
- `MAX_RETRIES` - Retry attempts on failure (default: 2)
- `CHROME_PROFILE` - Chrome user-data-dir for session persistence

## Success Criteria

The test passes when:
- ✅ Homepage loads successfully
- ✅ Navigation to /app works
- ✅ File upload succeeds
- ✅ Image appears in preview/crop stage

## Auto Bug Filing

On failure, a GitHub Issue is created with:
- Error message
- Run ID and timestamp
- Screenshot directory path
- Labels: `bug`, `e2e-failure`

Deduplication: Won't create duplicate issues within 24 hours.

## Technical Notes

- Uses `agent-browser` for browser automation
- Headless Chrome with persistent profile
- Screenshots saved at each step for debugging
- Logs written to `e2e-test.log`

## Known Limitations

1. **Client-side processing**: SafePassportPic processes images on-device, so the test validates upload + preview, not final output generation (which requires user interaction).

2. **Face detection**: The test image is a simple geometric drawing, so "No face" warning is expected. For production, use a real face photo.

3. **Chrome profile locks**: If Chrome crashes, lock files may prevent restart. The script cleans these automatically.

---

*Created by Atlas 🎯 | Feb 2, 2026*
