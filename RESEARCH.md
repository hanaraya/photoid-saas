# Passport Photo SaaS — Market Research

## Market Size
- **Passport Photo Software Market:** $3B in 2024 → $6.5B by 2032 (11.8% CAGR)
- **22M+ US passports** issued per year alone
- Global market is much larger (every country needs ID photos)

## Competitor Analysis

### Tier 1: Market Leaders
| App | Pricing | Key Features | Users | Rating |
|-----|---------|-------------|-------|--------|
| **PhotoAiD** | ~$7-17/photo | AI + human expert review, 100% acceptance guarantee, prints delivery | 11M+ users, 18M photos | 4.8/5 (5000+ reviews) |
| **Passport Photo Online** | $16.95 digital / $19.95 prints | AI + human expert 24/7, acceptance guarantee (2x refund), prints shipped | 1M+ annual users | 4.5/5 (5,649 reviews) |
| **PhotoBooth Online** | $2.95 for 6 photos | Simple, cheap, no expert review | Large user base | Good |

### Tier 2: Budget/Free Options
| App | Pricing | Notes |
|-----|---------|-------|
| **Passport Photo: Budget** | $4.99 digital / $6.99 pickup / $9.99 delivery | Newer app, aggressive pricing |
| **PersoFoto** | Free | Very basic, no compliance check, no bg removal |
| **Pic4Pass by BioID** | Free | Limited features |

### Tier 3: AI-First Newcomers
| App | Pricing | Notes |
|-----|---------|-------|
| **AiPassportPhotos** | ~$5-10 | AI background removal + compliance |
| **PhotoGov** | Free basic / Premium | 100% on-device, privacy-first, 100+ countries, 9.6/10 score |
| **Slazzer** | Subscription | Batch processing, general bg removal tool |

## Pricing Sweet Spots
- **$2.95-4.99** → budget segment (high volume, low margin)
- **$7-10** → mid-market (our target)
- **$14-17** → premium with human review + prints
- **CVS/Walgreens** → $15-17 in-person (the baseline we beat)

## Key Differentiators to Win

### What competitors do well:
1. **Acceptance guarantee** (PhotoAiD's "2x money back" is compelling)
2. **Human expert review** (adds trust)
3. **Physical prints + delivery** ($3-6 extra)
4. **100+ country support** (passport, visa, ID, driver's license)
5. **Compliance checking** (ICAO biometric standards)

### What competitors do poorly:
1. **Privacy** — Most upload photos to servers (privacy concern)
2. **Speed** — Many require waiting for human review
3. **Mobile UX** — Most feel like desktop-first apps
4. **Pricing transparency** — Many hide pricing until after upload
5. **Offline capability** — None work offline

### Our Edge: 100% Client-Side
This is our **biggest differentiator**:
- **Zero server costs** for processing (insane margins)
- **100% private** — photos never leave your device
- **Instant results** — no waiting for server processing
- **Works offline** after first load (PWA)
- **No data breach risk** — nothing to breach

## Background Removal Options (Client-Side)

### Best Options for Browser-Based BG Removal:

1. **Transformers.js + RMBG-1.4** (by @Xenova/HuggingFace)
   - ~45MB quantized model
   - Works on mobile
   - WebGPU acceleration (0.5s for 4K on M1)
   - Fully open source
   - Used by Addy Osmani's bg-remove tool
   - **Best option for us**

2. **@imgly/background-removal**
   - ONNX + WASM based
   - Hosted models by IMG.LY
   - MIT license
   - Good quality, easy integration
   - npm package ready

3. **MODNet via Transformers.js**
   - Smaller model, portrait-specific
   - WebGPU accelerated
   - Good for portraits specifically

**Recommendation:** Use **Transformers.js + RMBG-1.4** for quality, or **@imgly/background-removal** for easier integration. Both are 100% client-side.

## Compliance Requirements (ICAO 9303)

Must validate:
- Head size: 70-80% of frame (chin to crown)
- Eye position: 1.25-1.375 inches from bottom
- Background: white/light grey (RGB 240-255)
- Expression: neutral, mouth closed, eyes open
- Lighting: even, no shadows/glare
- File: JPEG/PNG, 300-600 DPI, sRGB, max 5MB
- No filters or retouching of facial features

## Revenue Model Recommendation

### Phase 1: Launch (Month 1-2)
- **Free:** preview with compliance check
- **$4.99:** digital download (single photo)
- **$7.99:** digital download + 4×6 printable sheet
- Position: "The privacy-first passport photo app"

### Phase 2: Growth (Month 3-6)
- Add physical print delivery ($9.99-12.99)
- Add B2B API ($0.10-0.50 per photo)
- Add subscription ($9.99/yr unlimited for families)
- Expand to 50+ countries

### Phase 3: Scale (Month 6+)
- Immigration lawyer / photo studio partnerships
- Enterprise API
- White-label solution
- International expansion with localized marketing

## Tech Stack (Production)

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Auth:** Clerk (or Supabase Auth)
- **Payments:** Stripe (Checkout + Payment Links)
- **ML (client-side):** Transformers.js (RMBG-1.4) + MediaPipe Face Detection
- **Hosting:** Vercel (edge, fast globally)
- **Analytics:** PostHog or Plausible (privacy-friendly)
- **Email:** Resend (transactional)
- **DB:** Supabase (purchases, user accounts — NOT photos)
- **Domain:** Need a good domain name

## Monthly Cost Estimate
| Item | Cost |
|------|------|
| Vercel Pro | $20 |
| Supabase Free → Pro | $0-25 |
| Clerk Free tier | $0 |
| Domain | $1/mo |
| Stripe fees | 2.9% + $0.30/txn |
| **Total** | **~$25-50/mo** |

Break-even: ~6-10 sales per month

## Domain Ideas
- passportpix.com / .app
- snappassport.com
- passportsnap.com
- photoid.app
- idphotopro.com
- passportready.app

## SEO Strategy
Target keywords:
- "passport photo online" (high volume)
- "passport photo app" (high volume)
- "free passport photo maker" (high volume)
- "passport photo at home" (growing)
- "privacy passport photo" (low competition, our niche)
- "[country] passport photo requirements" (50+ pages)

---

*Research compiled: Jan 24, 2026*
