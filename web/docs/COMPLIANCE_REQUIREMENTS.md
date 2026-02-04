# Passport Photo Compliance Requirements

This document captures the official photo requirements for each supported country/document type.

---

## 🇺🇸 United States

### US Passport / Visa / Green Card

**Source:** [U.S. Department of State](https://travel.state.gov/content/travel/en/passports/how-apply/photos.html)

| Requirement        | Specification                                 | We Check                 |
| ------------------ | --------------------------------------------- | ------------------------ |
| **Size**           | 2 × 2 inches (51 × 51 mm)                     | ✅ Yes                   |
| **Head Height**    | 1" to 1⅜" (25-35mm) from chin to top of head  | ✅ Yes                   |
| **Eye Position**   | Eyes between 1⅛" to 1⅜" (28-35mm) from bottom | ✅ Yes                   |
| **Background**     | Plain white or off-white                      | ✅ Yes                   |
| **Color**          | Must be in color                              | ✅ Assumed               |
| **Recency**        | Taken within last 6 months                    | ❌ Cannot verify         |
| **Face View**      | Full face, front view                         | ⚠️ Partial (angle check) |
| **Expression**     | Neutral, mouth closed                         | ❌ Not yet               |
| **Eyes**           | Open and visible                              | ❌ Not yet               |
| **Glasses**        | NOT allowed (since Nov 2016)                  | ✅ Warning shown         |
| **Head Coverings** | Not allowed (religious exceptions)            | ❌ Cannot verify         |
| **Lighting**       | No shadows on face or background              | ❌ Not yet               |
| **Focus**          | Sharp and in focus                            | ✅ Yes (blur detection)  |
| **Head Tilt**      | Face straight, not tilted                     | ✅ Yes (angle check)     |
| **Print Quality**  | 300 DPI minimum                               | ✅ Yes                   |

### US Driver's License

| Requirement    | Specification       | We Check |
| -------------- | ------------------- | -------- |
| **Size**       | 2 × 2 inches        | ✅ Yes   |
| **Background** | White or light      | ✅ Yes   |
| **Other**      | Similar to passport | ✅ Yes   |

---

## 🇬🇧 United Kingdom

### UK Passport / Visa

**Source:** [GOV.UK](https://www.gov.uk/photos-for-passports)

| Requirement     | Specification                    | We Check       |
| --------------- | -------------------------------- | -------------- |
| **Size**        | 35 × 45 mm                       | ✅ Yes         |
| **Head Height** | 29-34mm from chin to crown       | ✅ Yes         |
| **Background**  | Plain cream or light grey        | ✅ Yes (white) |
| **Expression**  | Neutral, mouth closed            | ❌ Not yet     |
| **Eyes**        | Open, visible, looking at camera | ❌ Not yet     |
| **Glasses**     | Allowed (no glare/tinted)        | ℹ️ N/A         |
| **Focus**       | Sharp                            | ✅ Yes         |

---

## 🇪🇺 European Union / Schengen

### EU Passport / Schengen Visa

**Source:** [ICAO Doc 9303](https://www.icao.int/publications/pages/publication.aspx?docnum=9303)

| Requirement     | Specification                    | We Check |
| --------------- | -------------------------------- | -------- |
| **Size**        | 35 × 45 mm                       | ✅ Yes   |
| **Head Height** | 32-36mm                          | ✅ Yes   |
| **Background**  | Light, uniform (white/grey/blue) | ✅ Yes   |
| **Focus**       | Sharp, no blur                   | ✅ Yes   |

---

## 🇨🇦 Canada

### Canada Passport

**Source:** [Government of Canada](https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html)

| Requirement      | Specification       | We Check   |
| ---------------- | ------------------- | ---------- |
| **Size**         | 50 × 70 mm          | ✅ Yes     |
| **Head Height**  | 31-36mm             | ✅ Yes     |
| **Eye Position** | 42mm from bottom    | ✅ Yes     |
| **Background**   | Plain white         | ✅ Yes     |
| **Expression**   | Neutral             | ❌ Not yet |
| **Glasses**      | Allowed if no glare | ℹ️ N/A     |

---

## 🇮🇳 India

### India Passport / Visa

**Source:** [Passport Seva](https://www.passportindia.gov.in/)

| Requirement     | Specification             | We Check   |
| --------------- | ------------------------- | ---------- |
| **Size**        | 2 × 2 inches (51 × 51 mm) | ✅ Yes     |
| **Head Height** | 25-35mm                   | ✅ Yes     |
| **Background**  | Plain white               | ✅ Yes     |
| **Expression**  | Neutral                   | ❌ Not yet |

---

## 🇨🇳 China

### China Passport / Visa

| Requirement     | Specification | We Check |
| --------------- | ------------- | -------- |
| **Size**        | 33 × 48 mm    | ✅ Yes   |
| **Head Height** | 28-33mm       | ✅ Yes   |
| **Background**  | White         | ✅ Yes   |

---

## 🇯🇵 Japan

### Japan Passport

| Requirement     | Specification           | We Check |
| --------------- | ----------------------- | -------- |
| **Size**        | 35 × 45 mm              | ✅ Yes   |
| **Head Height** | 32-36mm                 | ✅ Yes   |
| **Background**  | Plain (white/blue/grey) | ✅ Yes   |

---

## 🇦🇺 Australia

### Australia Passport

**Source:** [Australian Passport Office](https://www.passports.gov.au/getting-passport-how-it-works/photo-guidelines)

| Requirement     | Specification | We Check |
| --------------- | ------------- | -------- |
| **Size**        | 35 × 45 mm    | ✅ Yes   |
| **Head Height** | 32-36mm       | ✅ Yes   |
| **Background**  | Plain light   | ✅ Yes   |

---

## Compliance Checks Implementation

### Currently Implemented ✅

1. **Face Detection** — MediaPipe face detector
2. **Head Size** — Calculated from face bounding box × 1.35
3. **Eye Position** — From face landmarks
4. **Background** — AI background removal + analysis
5. **Resolution** — Minimum pixel dimensions
6. **Blur Detection** — Laplacian variance analysis
7. **Face Angle** — Eye tilt calculation
8. **Glasses Warning** — US-specific reminder

### Planned / Future 🔮

1. **Expression Detection** — Neutral face, mouth closed
2. **Eyes Open Check** — Eye aspect ratio analysis
3. **Shadow Detection** — Contrast analysis on face
4. **Glasses Detection** — ML-based detection (for auto-warning)
5. **Smile Detection** — Reject if smiling

---

## References

- [U.S. Department of State - Photo Requirements](https://travel.state.gov/content/travel/en/passports/how-apply/photos.html)
- [ICAO Doc 9303 - Machine Readable Travel Documents](https://www.icao.int/publications/pages/publication.aspx?docnum=9303)
- [UK Gov - Passport Photos](https://www.gov.uk/photos-for-passports)
- [Canada - Passport Photos](https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html)
- [Australia Passport Office](https://www.passports.gov.au/getting-passport-how-it-works/photo-guidelines)

---

_Last updated: January 2026_
