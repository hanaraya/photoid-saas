# Passport Photo App - TODO

## 🎯 Current Task: None (Backlog Ready)

**Status:** ✅ Smart Retake Suggestions Complete

---

## 📋 Backlog

### High Priority
- [x] **Smart retake suggestions** ✨
  - Analyzes compliance check failures/warnings
  - Provides specific, actionable tips for each issue
  - Prioritizes by severity (retake required vs. adjustable)
  - Expandable cards with detailed how-to-fix instructions
  - Inline compact version for quick status
  - 53 tests, 100% coverage on logic, 96% on component

### Medium Priority
- [ ] Multi-country expansion (50+ templates)
- [ ] Head tilt auto-detection warning
- [ ] Before/after comparison view
- [ ] Compliance score percentage
- [ ] Baby/infant photo mode

### Lower Priority
- [ ] Expert verification (premium upsell)
- [ ] Print delivery integration
- [ ] Native mobile apps
- [ ] Multi-language support
- [ ] Batch processing

---

## ✅ Completed

### 2026-01-26
- [x] US passport compliance rules documented
- [x] Head cropping fix - crown/chin protection
- [x] Head centering compliance check
- [x] Grayscale photo detection
- [x] Face lighting/shadow detection  
- [x] Source headroom warning
- [x] Automated visual testing setup
- [x] Competitor research & roadmap
- [x] **Measurement overlay on preview** ✨
  - Head height % indicator (59.3% shown correctly)
  - Eye line position marker
  - Color-coded compliance (green/yellow/red)
  - Toggle button to show/hide
  - Works for all 20 country standards
  - 71 tests, 96% coverage
- [x] **Camera capture guides** ✨
  - Face positioning oval (country-specific sizing)
  - Distance indicator (too close/far/good)
  - Lighting quality feedback (☀️/🌑/💡)
  - Head tilt detection
  - Capture countdown (optional)
  - 102 tests, 95% coverage on camera-analysis

---

## 🔧 Process

### For Each Feature:
```
1. SPEC    → Define requirements, check all country standards
2. TEST    → Write failing tests first (TDD red phase)
3. CODE    → Implement to pass tests (TDD green phase)
4. REFACTOR → Clean up code (TDD refactor phase)
5. REVIEW  → Sub-agent verifies compliance for all countries
6. COMMIT  → Conventional commit (feat:/fix:/test:)
```

### 🎯 Priority Countries (Phase 1):
| Country | Documents | Size | Head % |
|---------|-----------|------|--------|
| 🇺🇸 US | passport, visa, drivers, green_card | 2×2" | 50-69% |
| 🇬🇧 UK | passport, visa | 35×45mm | 64-80% |
| 🇪🇺 EU | schengen, visa | 35×45mm | 70-80% |
| 🇨🇦 Canada | passport | 50×70mm | 44-51% |
| 🇮🇳 India | passport, visa | 2×2" | 50-69% |

### ⏸️ Disabled for Now (Phase 2):
- Australia, China, Japan, South Korea, Germany, France, Brazil, Mexico

---

*Updated: 2026-01-26*
