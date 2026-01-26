# Feature Roadmap - Competitive Analysis

## Competitor Research Summary

### Top Competitors Analyzed
1. **PhotoAiD** - Market leader, 11M+ users, AI + human expert verification
2. **PhotoGov** - 1.8M users, 900+ document types, embassy partnerships
3. **Smartphone iD** - Real-time AI guidance, biometric expert verification
4. **VisaFoto** - Automatic processing, head tilt correction
5. **PersoFoto** - Manual cropping with guides, compliance analysis

---

## Feature Gap Analysis

### 🔴 HIGH PRIORITY - Must Have

#### 1. **Visual Compliance Overlay/Guidelines**
- Show measurement lines on the preview photo
- Display head height percentage (50-69%)
- Mark eye line position
- Show crown-to-frame and chin-to-frame spacing
- **Competitors:** PersoFoto, PhotoGov show dimension annotations

#### 2. **Real-Time Camera Guides**
- Face oval positioning guide while taking photo
- Distance indicator (too close/too far)
- Lighting quality indicator (shadows, brightness)
- Head position guide (centered, straight)
- "Hold still" countdown before capture
- **Competitors:** Smartphone iD, PhotoAiD have guided capture

#### 3. **Photo Retake Suggestions**
- When compliance fails, show specific visual guidance for retake
- "Move camera further back"
- "Add more light from front"
- "Center face in frame"
- **Competitors:** PhotoAiD provides instant feedback

---

### 🟡 MEDIUM PRIORITY - Competitive Edge

#### 4. **Expert Verification Option** (Premium)
- Human review for $X extra
- Guarantee badge
- **Competitors:** PhotoAiD, Smartphone iD offer this as premium upsell

#### 5. **Multiple Document Support**
- Add templates for 50+ countries
- Visa photos (different sizes)
- Green card, driver's license
- Baby/infant specific mode
- **Competitors:** PhotoGov supports 900+ document types

#### 6. **Head Tilt Auto-Correction**
- Detect and optionally correct slight head tilt
- Show warning if tilt too extreme
- **Competitors:** VisaFoto has head tilt correction

#### 7. **Print Delivery Integration**
- Partner with CVS/Walgreens for pickup
- Or direct mail prints
- **Competitors:** PhotoAiD, iVisa offer print delivery

#### 8. **Digital Submission Ready**
- Generate ICAO-compliant digital format
- Correct DPI, color space
- Digital signature/hash for authenticity
- **Competitors:** PhotoGov, PhotoAiD offer digital delivery

---

### 🟢 LOWER PRIORITY - Nice to Have

#### 9. **Before/After Preview**
- Side-by-side comparison of original vs processed
- **Competitors:** PhotoGov shows this prominently

#### 10. **Compliance Score**
- Show percentage score (85% compliant, etc.)
- List what's perfect vs needs work
- **Competitors:** Some apps show pass/fail per criterion

#### 11. **Batch Processing**
- Process multiple photos for family
- Discount for bulk orders

#### 12. **Mobile App**
- Native iOS/Android apps
- Better camera control
- Offline processing
- **Competitors:** Most have dedicated apps

#### 13. **Multi-language Support**
- Spanish, Chinese, Hindi, etc.
- **Competitors:** International apps support 10+ languages

---

## Immediate Implementation Plan

### Sprint 1: Visual Compliance Overlay
```
[ ] Add measurement lines to preview canvas
    - Head height percentage indicator
    - Eye line marker
    - Crown margin indicator
    - Chin margin indicator
[ ] Show compliance dimensions in mm/inches
[ ] Color-code: green=pass, red=fail, yellow=warn
```

### Sprint 2: Camera Capture Guides
```
[ ] Face detection oval overlay
[ ] Real-time positioning feedback
[ ] Lighting quality indicator
[ ] Distance estimation
[ ] Countdown timer before capture
```

### Sprint 3: Smart Retake Suggestions
```
[ ] Analyze why photo failed
[ ] Generate specific guidance
[ ] Visual arrows/indicators for correction
```

---

## Technical Notes

### Overlay Implementation
- Draw on canvas after photo render
- Use semi-transparent overlays
- Toggle on/off for clean export
- SVG-based for crisp lines at any zoom

### Camera Guide Implementation
- Use MediaPipe face detection in real-time
- Calculate face position relative to oval guide
- Show live feedback before capture
- Debounce to avoid flickering

### Measurement Calculation
```javascript
// Example: Calculate head height percentage
const headHeightPx = crownY - chinY;
const photoHeightPx = 600; // US passport at 300 DPI
const headPercentage = (headHeightPx / photoHeightPx) * 100;
// Should be 50-69%
```

---

## Competitor Pricing Reference
| Service | Basic | Premium |
|---------|-------|---------|
| PhotoAiD | $7.99 | $12.99 (expert verify) |
| PhotoGov | $6.95 | $9.95 (human review) |
| Smartphone iD | $9.95 | $14.95 |
| VisaFoto | $7.00 | N/A |
| **Us (current)** | $4.99 | - |

---

*Last updated: 2026-01-26*
