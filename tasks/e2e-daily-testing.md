# Task: Implement Daily E2E Testing

**Created by:** Chanakya
**Date:** 2026-02-02
**Priority:** HIGH
**Effort:** 1 day
**Source:** https://x.com/ryancarson/status/2018354837918732297

## Overview

Implement Ryan Carson's agent-driven E2E testing approach for SafePassportPic. Daily automated testing that catches regressions before users do.

## Why This Matters

- Catch bugs before customers hit them
- Test real user journeys (not mocked)
- Auto-file GitHub issues on failures
- Works well with AI/adaptive UIs
- 955 developers bookmarked this (validated approach)

## What to Test

### Critical Flows
1. **Signup/Login** (if we add auth)
2. **Photo Upload** → Processing → Preview
3. **Compliance Validation** (all 6 countries)
4. **Payment Flow** (Stripe test cards)
5. **Download Delivered**

### Per Country (6 paths)
- US Passport
- UK Passport  
- Canada Passport
- India Passport
- Australia Passport
- Schengen Visa

## Implementation Steps

### 1. Setup (~30 min)
- [ ] Create `scripts/e2e/` directory
- [ ] Set up test environment variables
- [ ] Create Chrome debug profile for testing

### 2. Core Scripts (~2 hours)
- [ ] `daily-e2e-test.sh` - Main runner
- [ ] Test user cleanup (if we add accounts)
- [ ] Screenshot capture on failures
- [ ] Error collection

### 3. Test Cases (~2 hours)
- [ ] Photo upload happy path
- [ ] Each compliance type validation
- [ ] Payment flow with test cards
- [ ] Error handling (bad photos, network issues)

### 4. Auto Bug Filing (~1 hour)
- [ ] GitHub Issues integration (use `gh` CLI)
- [ ] Include screenshots + logs
- [ ] Deduplication (don't spam)

### 5. Scheduling (~30 min)
- [ ] Create launchd plist for 9 AM daily
- [ ] Log retention (7 days)
- [ ] Alert thresholds (2+ consecutive failures)

## Reference

Full implementation guide saved at:
`~/clawd-harish/knowledge/twitter/2026-02-02-ryancarson-e2e-testing.md`

## Security Notes

- Use dedicated test Stripe account
- Don't store real PII in test data
- Sanitize screenshots before GitHub upload

## Success Criteria

- [ ] Runs daily at 9 AM automatically
- [ ] Tests all 6 country compliance paths
- [ ] Auto-creates GitHub issue on failure
- [ ] Logs retained for debugging
- [ ] Zero false positives after 1 week tuning

---

*Chanakya says: "I created this task. I'm accountable for it. 😄 Atlas — make it happen!"*
