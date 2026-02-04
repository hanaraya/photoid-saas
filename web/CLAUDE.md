# CLAUDE.md - Passport Photo App

## Project Overview

A Next.js 14 web app for creating compliant passport photos. Users capture or upload a photo, the app detects the face, validates compliance, and produces correctly sized/cropped passport photos.

**Stack:** Next.js 14 + TypeScript + Tailwind + Stripe + MediaPipe Face Detection

## Quick Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm test             # Run all tests (1111 tests, ~92% coverage)
npm run test:e2e     # Playwright E2E tests
vercel --yes         # Deploy preview
vercel --prod        # Deploy production
```

## Key Mathematical Relationships

### ⚠️ CRITICAL: Camera Oval Sizing

The camera oval must be **mathematically derived**, not guessed. Three constants work together:

```typescript
FACE_TO_HEAD_RATIO = 1 / 1.4; // Face bbox is ~71.4% of full head
HEAD_TO_FACE_RATIO = 1.4; // Full head = face × 1.4 (includes hair)
CAPTURE_BUFFER = 1.15; // 15% extra for crop flexibility
```

**Complete formula:**

```
Camera_Face_% = Output_Head_% × 0.714 / 1.15
```

Example for US (head 50-69%):

- Face in output: 35.7-49.3%
- Face in camera: **31-42.8%** (with buffer)
- Oval target: **~37%** of viewport

### Files That Must Stay In Sync

| File                         | What It Uses                           |
| ---------------------------- | -------------------------------------- |
| `src/lib/camera-analysis.ts` | `FACE_TO_HEAD_RATIO`, `CAPTURE_BUFFER` |
| `src/lib/crop.ts`            | `HEAD_TO_FACE_RATIO` (must be 1.4)     |
| `src/lib/compliance.ts`      | Head height validation                 |
| `docs/CAMERA_OVAL_MATH.md`   | Documentation                          |

**If you change one constant, update ALL files.**

### Viewport vs Video Dimensions

```typescript
// Video source dimensions (raw pixels from camera)
(video.videoWidth, video.videoHeight); // e.g., 1920×1920

// Rendered dimensions (what user sees, accounting for CSS)
video.getBoundingClientRect(); // e.g., 400×400 on mobile

// The oval must use RENDERED dimensions, not source dimensions!
```

## Gotchas & Learnings

### 1. Camera Aspect Ratio

**Problem:** Mobile cameras often ignore aspect ratio requests.
**Solution:** Request square (1:1) with fallback, capture at high resolution (1920×1920), handle any ratio in crop logic.

```typescript
// Don't assume camera gives you what you ask for
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1920, min: 1080 },
    height: { ideal: 1920, min: 1080 },
    aspectRatio: { ideal: 1, min: 0.7, max: 1.4 },
  },
});
```

### 2. Object-Fit Letterboxing

**Problem:** Video uses `object-fit: contain`, creating letterbox/pillarbox areas where oval doesn't align.
**Solution:** Calculate actual rendered area and position overlay precisely.

```typescript
// Calculate letterbox offset
const videoAspect = video.videoWidth / video.videoHeight;
const containerAspect = rect.width / rect.height;

if (videoAspect > containerAspect) {
  // Letterboxed (black bars top/bottom)
  renderHeight = rect.width / videoAspect;
  offsetY = (rect.height - renderHeight) / 2;
}
```

### 3. Face Detection Coordinates

**Problem:** MediaPipe returns coordinates in video pixel space, but UI is in CSS pixel space.
**Solution:** Keep analysis in video space (percentages are scale-invariant), convert only for display.

### 4. Crop Scale Direction

**Problem:** Confusing whether scale > 1 means zoom in or out.
**Clarification:**

- `scale = output_size / crop_size`
- `scale > 1` = zooming IN (crop smaller than output)
- `scale < 1` = zooming OUT (crop larger than output)

### 5. Head vs Face

**NEVER confuse these:**

- **Face bbox:** What MediaPipe detects (chin to eyebrows)
- **Full head:** Face + forehead + hair (face × 1.4)
- **Passport specs use HEAD**, detection gives **FACE**

### 6. SSL Deployment Errors

Vercel uploads sometimes fail with SSL errors. Just retry:

```bash
sleep 5 && vercel --yes  # Wait and retry
```

## Testing Conventions

### Mock Video Elements

Always include `getBoundingClientRect`:

```typescript
function createMockVideoElement(overrides = {}) {
  return {
    videoWidth: 640,
    videoHeight: 480,
    readyState: 4,
    getBoundingClientRect: () => ({
      width: 640,
      height: 480,
      top: 0,
      left: 0,
      right: 640,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
    ...overrides,
  } as HTMLVideoElement;
}
```

### Test File Locations

- Unit tests: `__tests__/unit/`
- Integration tests: `__tests__/integration/`
- E2E tests: `__tests__/e2e/`

### Coverage Requirements

- Minimum: 80% (enforced in CI)
- Current: ~92%

## Country-Specific Specs

| Country | Output Size | Head %   | Face in Camera |
| ------- | ----------- | -------- | -------------- |
| US      | 2×2 in      | 50-69%   | 31-42.8%       |
| UK      | 35×45 mm    | 64-75.5% | 39.7-46.9%     |
| EU      | 35×45 mm    | 71-80%   | 44.1-49.7%     |
| Canada  | 50×70 mm    | 44-51%   | 27.3-31.7%     |

Specs defined in: `src/lib/photo-standards.ts`

## Architecture Decisions

### Why MediaPipe (not server-side)?

- Runs entirely in browser (privacy)
- No API costs for face detection
- Real-time feedback during capture

### Why Stripe for payments?

- Webhook-based verification
- No sensitive card data on our servers
- Easy refund handling

### Why Vercel?

- Next.js native support
- Edge functions for API routes
- Easy preview deployments

## File Structure

```
src/
├── app/                 # Next.js app router pages
├── components/
│   ├── camera-guides.tsx    # Live camera overlay
│   ├── photo-editor.tsx     # Crop/adjust interface
│   └── photo-upload.tsx     # Upload/capture entry
├── hooks/
│   └── useLiveFaceDetection.ts  # MediaPipe integration
├── lib/
│   ├── camera-analysis.ts   # Oval sizing, distance check
│   ├── crop.ts              # Smart cropping algorithm
│   ├── compliance.ts        # Passport spec validation
│   ├── face-detection.ts    # MediaPipe wrapper
│   └── photo-standards.ts   # Country specs
```

## Common Tasks

### Adding a New Country

1. Add spec to `src/lib/photo-standards.ts`
2. Add head range to `src/lib/camera-analysis.ts` (COUNTRY_HEAD_HEIGHTS)
3. Camera thresholds auto-derive via `deriveCameraThresholds()`
4. Add tests

### Changing Capture Buffer

1. Update `CAPTURE_BUFFER` in `src/lib/camera-analysis.ts`
2. Update tests with new expected values
3. Update `docs/CAMERA_OVAL_MATH.md`

### Debugging Crop Issues

Enable crop logging:

```typescript
console.log('[CROP]', { source, face, scale, crop });
```

Check: Is head in output within spec range? Is scale reasonable (0.5-2.0)?

---

_Last updated: 2025-01-26_
