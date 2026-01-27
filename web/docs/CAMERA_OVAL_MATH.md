# Camera Oval Sizing - Complete Mathematical Derivation

## Overview

The camera oval guides users to position their face correctly. It must account for:

1. **Output Requirements** - Head size as % of final photo
2. **Face-to-Head Ratio** - Face bbox vs full head with hair
3. **Capture Buffer** - Extra content for crop flexibility
4. **Camera Viewport** - Actual rendered dimensions

## Constants

```typescript
FACE_TO_HEAD_RATIO = 1/1.4 = 0.714
// Face bbox (chin to eyebrows) is ~71.4% of full head height

CAPTURE_BUFFER = 1.15
// 15% extra margin on each side for crop flexibility
```

## Complete Derivation

### Step 1: Output Specification

For US Passport:
- Output size: 600×600 px (2×2 inch at 300 DPI)
- Head height: 50-69% of photo = 300-414 px
- Target head: 59.5% = 357 px

### Step 2: Face in Output

```
Face_in_output = Head_in_output × FACE_TO_HEAD_RATIO
Face_in_output = 59.5% × 0.714 = 42.5%
```

### Step 3: Face in Camera (with buffer)

We want extra content for crop flexibility:

```
Face_in_camera = Face_in_output / CAPTURE_BUFFER
Face_in_camera = 42.5% / 1.15 = 37%
```

### Step 4: Apply to Viewport

```
Oval_height = Viewport_height × Face_in_camera
Oval_height = Viewport_height × 0.37
```

## Country-Specific Thresholds

| Country | Head Required | Face in Output | Face in Camera (with buffer) |
|---------|--------------|----------------|------------------------------|
| US | 50-69% | 35.7-49.3% | **31-42.8%** |
| UK | 64-75.5% | 45.7-53.9% | **39.7-46.9%** |
| EU | 71-80% | 50.7-57.1% | **44.1-49.7%** |
| Canada | 44-51% | 31.4-36.4% | **27.3-31.7%** |

## Why Capture Buffer?

Without buffer (1.0):
- Face fills exactly what's needed
- No room for error
- Cropping has no flexibility

With buffer (1.15):
- Face is smaller in frame (more visible content)
- User can adjust crop position after capture
- Zoom in/out works in editor
- Slight misalignment is tolerable

## Viewport Adaptation

The oval scales with the actual rendered viewport:

```typescript
// Get actual rendered dimensions (accounting for CSS object-fit)
const videoRect = video.getBoundingClientRect();
const aspect = video.videoWidth / video.videoHeight;

// Calculate letterbox/pillarbox offsets
if (aspect > containerAspect) {
  renderHeight = containerWidth / aspect;
  offsetY = (containerHeight - renderHeight) / 2;
} else {
  renderWidth = containerHeight * aspect;
  offsetX = (containerWidth - renderWidth) / 2;
}

// Oval is calculated from RENDERED dimensions
ovalHeight = renderHeight × targetFacePercent;
```

## Vertical Positioning

Face center at 40% from top:

```
|------ 40% ------| Face center
|                 |
|  [====FACE====] | Face oval
|                 |
|------ 60% ------| Room for shoulders + buffer
```

This ensures:
- Hair and margin above face visible
- Shoulders visible below chin
- Eye line lands at correct position after crop

## Summary Formula

```
Oval_height = Viewport_height × (Head_required × 0.714 / 1.15)
Oval_center_Y = Viewport_height × 0.40
Oval_width = Oval_height × 0.75
```

For US: `Oval_height = Viewport_height × 0.37` (approximately)
