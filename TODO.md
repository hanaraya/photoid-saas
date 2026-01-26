# Passport Photo App - TODO

## 🎯 Current Task: Measurement Overlay on Preview

**Status:** 🔄 In Progress (Sub-agent spawned)

### Task Breakdown
1. [ ] **Spec** - Define overlay requirements for all supported countries
2. [ ] **TDD** - Write tests first (unit + integration)
3. [ ] **Implement** - Build the overlay component
4. [ ] **Review** - Verify all country standards work
5. [ ] **Commit** - Clean commit with conventional message

---

## 📋 Backlog

### High Priority
- [ ] **Measurement overlay on preview photo**
  - [ ] Head height percentage indicator (varies by country)
  - [ ] Eye line position marker
  - [ ] Crown-to-top margin indicator
  - [ ] Chin-to-bottom margin indicator
  - [ ] Toggle overlay on/off
  - [ ] Support all 20 country standards
  
- [ ] **Camera capture guides**
  - [ ] Face positioning oval overlay
  - [ ] Real-time distance indicator
  - [ ] Lighting quality feedback
  - [ ] "Hold still" countdown
  
- [ ] **Smart retake suggestions**
  - [ ] Analyze failure reasons
  - [ ] Show visual correction tips

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
