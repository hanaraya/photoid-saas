# 📋 Passport Photo Compliance Requirements

> All these requirements must be tested and verified before deployment

---

## 🇺🇸 US Passport Photo Requirements (Primary)

### Dimensions
- [ ] **Size:** 2x2 inches (51x51 mm)
- [ ] **Head Size:** 1-1⅜ inches (25-35 mm) from chin to top of head
- [ ] **Eye Position:** Between 1⅛ to 1⅜ inches (28-35 mm) from bottom
- [ ] **Resolution:** Minimum 600x600 pixels, max 1200x1200

### Background
- [ ] **Color:** White or off-white
- [ ] **Uniformity:** No patterns, shadows, or objects
- [ ] **Background removal:** Clean edges, no halos

### Face Requirements
- [ ] **Expression:** Neutral, mouth closed
- [ ] **Eyes:** Open, clearly visible
- [ ] **Glasses:** None (removed or not worn)
- [ ] **Head Position:** Facing forward, not tilted
- [ ] **Hair:** Not covering face
- [ ] **Headwear:** None (except religious)

### Image Quality
- [ ] **Lighting:** Even, no harsh shadows
- [ ] **Focus:** Sharp, not blurry
- [ ] **Exposure:** Proper, not over/under exposed
- [ ] **Color:** Natural skin tones
- [ ] **Compression:** High quality, no artifacts

---

## 📷 Camera Testing Matrix

### Front Camera (Selfie Mode)
| Test Case | Expected Result | Automated? |
|-----------|-----------------|------------|
| Camera permission request | Shows permission dialog | ✅ |
| Permission granted | Camera preview shows | ✅ |
| Permission denied | Shows helpful message | ✅ |
| Face detection active | Face box overlay shown | ✅ |
| Capture button works | Photo captured | ✅ |
| Flash/lighting hint | Shows if too dark | ✅ |
| Countdown timer | Optional 3-2-1 | ✅ |
| Mirror preview | Shows mirrored (selfie) | ✅ |
| Final photo | NOT mirrored | ✅ |

### Back Camera
| Test Case | Expected Result | Automated? |
|-----------|-----------------|------------|
| Camera switch works | Switches to rear | ✅ |
| Preview orientation | Correct orientation | ✅ |
| Higher resolution | Uses best available | ✅ |
| Capture works | Photo captured | ✅ |
| Zoom controls | Available if supported | ⚠️ |

### Camera Switching
| Test Case | Expected Result | Automated? |
|-----------|-----------------|------------|
| Switch button visible | Shows toggle icon | ✅ |
| Switch front→back | Smooth transition | ✅ |
| Switch back→front | Smooth transition | ✅ |
| Settings preserved | Flash/timer kept | ✅ |
| Quick consecutive | No crash | ✅ |

---

## ✓ Compliance Verification Tests

### Face Detection
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Single face detected | ✅ Accept | P0 |
| No face detected | ❌ Reject with message | P0 |
| Multiple faces | ❌ Reject with message | P0 |
| Face too small | ⚠️ Warn, suggest closer | P0 |
| Face too large | ⚠️ Warn, suggest farther | P0 |
| Face off-center | ⚠️ Warn, show guide | P1 |
| Face tilted | ⚠️ Warn, show level | P1 |
| Eyes closed | ❌ Reject | P1 |
| Glasses detected | ⚠️ Warn to remove | P1 |
| Smile detected | ⚠️ Warn neutral | P2 |

### Background
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| White background | ✅ Accept | P0 |
| Off-white/cream | ✅ Accept | P0 |
| Colored background | 🔄 Auto-remove | P0 |
| Complex background | 🔄 Auto-remove | P0 |
| Shadows on background | ⚠️ Warn | P1 |
| Background removal quality | Clean edges | P0 |

### Photo Quality
| Test Case | Expected Result | Priority |
|-----------|-----------------|----------|
| Sharp/in focus | ✅ Accept | P0 |
| Blurry | ❌ Reject | P0 |
| Too dark | ⚠️ Warn/enhance | P0 |
| Too bright | ⚠️ Warn/enhance | P0 |
| Red-eye | 🔄 Auto-fix | P2 |
| Low resolution | ❌ Reject | P0 |

---

## 🧪 Test Coverage Requirements

### Unit Tests (Must Have)
```
□ Face detection accuracy
□ Background removal quality  
□ Image cropping/sizing
□ Compliance rule validation
□ Error message display
```

### Integration Tests (Must Have)
```
□ Camera → Face Detection → Compliance Check
□ Upload → Process → Download flow
□ Multi-step wizard navigation
□ Settings persistence
```

### E2E Tests (Must Have)
```
□ Complete selfie → passport photo flow
□ Upload photo → process → download
□ Mobile browser full flow
□ Error recovery scenarios
```

### Visual Regression Tests (Should Have)
```
□ All page layouts
□ Component states (loading, error, success)
□ Mobile vs desktop
□ Dark mode (if supported)
```

---

## 🌍 Multi-Country Support

### Priority Countries
| Country | Size | Background | Special Rules |
|---------|------|------------|---------------|
| 🇺🇸 USA | 2x2 in | White | Primary target |
| 🇬🇧 UK | 35x45 mm | Light grey | Different size |
| 🇨🇦 Canada | 50x70 mm | White | Larger format |
| 🇮🇳 India | 2x2 in | White | Similar to US |
| 🇪🇺 Schengen | 35x45 mm | Light grey | EU standard |
| 🇦🇺 Australia | 35x45 mm | White | Similar to UK |

### Country-Specific Tests
- [ ] Size selection works for each country
- [ ] Correct dimensions applied
- [ ] Background color matches requirements
- [ ] Output meets official specifications

---

## 📱 Device Testing Matrix

### iOS
| Device | Camera | Priority |
|--------|--------|----------|
| iPhone 15 Pro | Front + Back | P0 |
| iPhone 13 | Front + Back | P0 |
| iPhone SE | Front + Back | P1 |
| iPad | Front + Back | P2 |

### Android
| Device | Camera | Priority |
|--------|--------|----------|
| Pixel 8 | Front + Back | P0 |
| Samsung S24 | Front + Back | P0 |
| OnePlus | Front + Back | P1 |
| Budget Android | Front + Back | P1 |

### Desktop
| Browser | Priority |
|---------|----------|
| Chrome | P0 |
| Safari | P0 |
| Firefox | P1 |
| Edge | P2 |

---

## ✅ Pre-Deployment Checklist

Before ANY deployment, verify:

### Critical (Blocks Deploy)
- [ ] All unit tests pass
- [ ] 80%+ code coverage
- [ ] Front camera flow works
- [ ] Back camera flow works  
- [ ] Face detection accurate
- [ ] Background removal clean
- [ ] Correct output dimensions
- [ ] No security vulnerabilities

### Important (Should Fix)
- [ ] All E2E tests pass
- [ ] Mobile experience smooth
- [ ] Error messages helpful
- [ ] Performance acceptable (<3s processing)

### Nice to Have
- [ ] Visual regression clean
- [ ] All country formats tested
- [ ] Edge cases documented

---

*Last updated: 2026-01-31*
