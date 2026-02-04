# Quality Detection Implementation Tasks

**Created:** 2026-01-27 22:48 PST
**Goal:** Fix all quality detection gaps so bad photos get rejected

---

## Phase 1: Quick Wins (Blur + Exposure)

### Task 1.1: Blur Detection

- [ ] Add Laplacian variance calculation to `lib/image-analysis.ts`
- [ ] Threshold: blurScore < 100 = blurry (adjust based on testing)
- [ ] Add "Photo Sharpness" check to compliance checker
- [ ] Fail/warn blurry photos with message "Photo is too blurry - please retake with steady hands"
- [ ] Test with `bad-blurry.jpg` fixture

### Task 1.2: Exposure Detection

- [ ] Add brightness histogram analysis to `lib/image-analysis.ts`
- [ ] Calculate mean brightness (0-255 scale)
- [ ] Thresholds: < 60 = underexposed, > 200 = overexposed
- [ ] Add "Lighting" check to compliance checker
- [ ] Fail overexposed: "Photo is too bright - avoid direct sunlight"
- [ ] Fail underexposed: "Photo is too dark - use better lighting"
- [ ] Test with `bad-overexposed.jpg` and `bad-underexposed.jpg` fixtures

---

## Phase 2: Background Quality

### Task 2.1: Halo/Edge Artifact Detection

- [ ] After background removal, analyze edge pixels around face
- [ ] Detect white halos or rough edges (color variance at boundary)
- [ ] Add "Background Quality" check
- [ ] Warn if halo detected: "Background edges need cleanup"
- [ ] Test with `bad-halo-artifact.jpg` fixture

### Task 2.2: Background Purity Check

- [ ] Ensure removed background is pure white (#FFFFFF), not gray
- [ ] Sample background regions (corners + edges avoiding face)
- [ ] Threshold: all RGB channels > 250 = white
- [ ] Existing check may cover this - verify and enhance if needed

---

## Phase 3: Advanced Detection

### Task 3.1: Shadow Detection

- [ ] Analyze face region for uneven lighting
- [ ] Detect shadows on one side of face (asymmetric brightness)
- [ ] Calculate left/right face brightness ratio
- [ ] Threshold: ratio > 1.3 = shadowed
- [ ] Add "Even Lighting" check
- [ ] Warn: "Shadows detected on face - use front-facing light"
- [ ] Test with `bad-shadows.jpg` fixture

### Task 3.2: Color Balance / Skin Tone Check

- [ ] Analyze skin tone regions for unnatural colors
- [ ] Check if skin tones fall within natural human range (HSV analysis)
- [ ] Flag extreme color casts (too yellow, too pink, etc.)
- [ ] Add "Natural Colors" check
- [ ] Warn: "Unnatural color detected - check white balance"

---

## Phase 4: Manipulation Detection (Stretch Goal)

### Task 4.1: Basic Manipulation Indicators

- [ ] Check for JPEG compression artifacts inconsistencies
- [ ] Detect unnaturally smooth skin (over-processed)
- [ ] Look for edge discontinuities (copy-paste artifacts)
- [ ] Add "Photo Authenticity" check (warning only, not blocking)

---

## Verification Checklist

After implementation, ALL of these must pass:

### Unit Tests

- [ ] `npm test` - all 1,130+ tests pass
- [ ] Coverage stays above 80%

### E2E Visual Tests

- [ ] `npx playwright test __tests__/e2e/visual-quality/` - all pass
- [ ] Blur detection catches `bad-blurry.jpg`
- [ ] Exposure detection catches `bad-overexposed.jpg` and `bad-underexposed.jpg`
- [ ] Halo detection catches `bad-halo-artifact.jpg`
- [ ] Shadow detection catches `bad-shadows.jpg`

### Manual Visual Verification

- [ ] Upload a blurry photo → gets rejected
- [ ] Upload overexposed photo → gets rejected
- [ ] Upload photo with shadows → gets warning
- [ ] Upload good photo → passes all checks
- [ ] Take screenshots of each test case

### Gap Report

- [ ] Run comprehensive report test
- [ ] Total detection gaps should be < 5 (down from 15)
- [ ] No critical gaps remaining (blur, exposure, halo)

---

## Files to Modify

1. `src/lib/image-analysis.ts` - Add detection algorithms
2. `src/lib/compliance.ts` - Add new checks
3. `src/components/photo-editor/` - Display new warnings
4. `__tests__/unit/lib/image-analysis.test.ts` - Unit tests for new functions
5. `__tests__/e2e/visual-quality/*.spec.ts` - Update gap tests to expect detection

---

## Success Criteria

✅ Blur detection working (Laplacian variance)
✅ Exposure detection working (brightness histogram)
✅ Halo detection working (edge analysis)
✅ Shadow detection working (face brightness asymmetry)
✅ All existing tests still pass
✅ E2E visual tests confirm bad photos rejected
✅ Screenshots proving each detection works
