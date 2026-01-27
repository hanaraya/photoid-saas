# Product Hunt Launch Materials

## SafePassportPic — Privacy-First Passport Photos

---

## Tagline (60 chars max)

**Option A (58 chars):**
> Passport photos that never leave your device. $4.99, done.

**Option B (56 chars):**
> Privacy-first passport photos — 100% processed locally

**Option C (52 chars):**
> Your face data stays yours. Passport photos, $4.99

**Recommended: Option A** — Clear value prop + price anchor

---

## Description (260 chars max)

**260 chars:**
> Create compliant passport & visa photos in 60 seconds. Unlike other services, we process everything in your browser — your biometric face data never touches our servers. AI background removal, 20+ countries, real-time compliance checking. $4.99 one-time.

**Shorter alt (200 chars):**
> Passport photos processed 100% in your browser. Your face data never leaves your device. AI background removal, compliance checking, 20+ countries supported. $4.99, instant download.

---

## Maker Comment

```
Hey Product Hunt! 👋

I built SafePassportPic because I was frustrated with the privacy implications of existing passport photo apps.

Think about it: you're uploading a high-res photo of your face — biometric data — to random servers. That data could be breached, sold, or used to train AI without your consent.

So I built the opposite:

🔒 **100% client-side** — Your photos never leave your browser. We literally cannot see them.

🤖 **AI-powered** — MediaPipe + WebAssembly run locally for face detection & background removal

✅ **Compliant** — Real-time overlay shows you exactly how your photo measures against official specs

💰 **$4.99** — Way cheaper than CVS ($16.99) or Walgreens ($14.99)

The tech challenge was getting performant AI to run entirely in the browser without server calls. WebAssembly made it possible.

Don't trust us? Open DevTools → Network tab while using the app. Zero photo uploads.

Would love your feedback!
```

---

## First Comment to Post

```
Some technical details for the curious:

**How the privacy actually works:**

1. MediaPipe (Google's ML framework) compiled to WebAssembly
2. Face detection, segmentation, and background removal all run in browser memory
3. No API calls for image processing — just local computation
4. Only network request is Stripe checkout (and that's just payment data)

**Why this matters:**
- Face data is forever. You can't change it like a password.
- Many "free" photo apps monetize through data — your face becomes the product
- GDPR/CCPA compliance is easier when you never collect the data in the first place

Happy to answer any technical questions! 🙋‍♂️
```

---

## Gallery Image Suggestions

### Image 1: Hero Shot
- Mockup of phone showing the app interface
- Text overlay: "Passport photos that never leave your device"
- Dark mode aesthetic matching the site

### Image 2: Privacy Comparison
- Split screen: "Others" vs "SafePassportPic"
- Left: Cloud icon with "Your photo → Their servers → ???"
- Right: Device icon with "Your photo → Your browser → Your download"
- Headline: "The difference is where your face goes"

### Image 3: How It Works
- 3-step visual: Upload → AI processes locally → Download
- Highlight "100% in your browser" with lock icon
- Show actual UI screenshots

### Image 4: Compliance Overlay
- Screenshot of the compliance checker in action
- Arrows pointing to head size, eye position, margins
- Text: "Real-time validation against official specs"

### Image 5: Price Comparison
- Simple comparison table:
  - CVS: $16.99
  - Walgreens: $14.99
  - SafePassportPic: $4.99
- Subtext: "Plus, we don't store your face"

### Image 6: DevTools Proof
- Screenshot of Network tab showing zero image uploads
- Headline: "Don't trust us. Verify it yourself."
- Shows credibility through transparency

---

## Launch Day Checklist

### Pre-Launch (T-7 days)
- [ ] Schedule launch date/time (best: Tuesday 12:01 AM PT)
- [ ] Prepare all gallery images (1200×630px or 1200×900px)
- [ ] Write and proof all copy
- [ ] Test the entire user flow end-to-end
- [ ] Set up analytics tracking for PH referrals (`?ref=producthunt`)
- [ ] Prepare a special offer? (Optional: discount code `PRODUCTHUNT`)

### Launch Day (T-0)
- [ ] Submit at exactly 12:01 AM PT
- [ ] Post maker comment immediately after live
- [ ] Post first comment within 5 minutes
- [ ] Share on Twitter/X with PH link
- [ ] Share on LinkedIn
- [ ] Email list announcement (if applicable)
- [ ] Respond to EVERY comment within 1 hour
- [ ] Thank early upvoters personally

### Post-Launch (T+1 to T+7)
- [ ] Continue monitoring and responding to comments
- [ ] Share results on social media
- [ ] Write a "lessons learned" post
- [ ] Follow up with interested parties
- [ ] Update landing page with "Featured on Product Hunt" badge

---

## Social Media Copy

### Twitter/X Launch Tweet
```
🚀 Just launched on @ProductHunt!

SafePassportPic — passport photos that never leave your device.

Unlike other apps, we process everything in your browser. Your biometric face data stays yours.

✅ 60 seconds
✅ 20+ countries
✅ $4.99

Check it out: [PH LINK]
```

### LinkedIn Post
```
I just launched SafePassportPic on Product Hunt! 🎉

The problem: Most passport photo apps upload your face to their servers. That's biometric data sitting on someone else's infrastructure.

The solution: 100% client-side processing. Your photos never leave your browser.

How?
• MediaPipe + WebAssembly for AI that runs locally
• No server calls for image processing
• Only payment goes through Stripe

Would love your support: [PH LINK]

#ProductHunt #Privacy #WebDev #Startup
```

---

## Potential Hunter Outreach

If not self-hunting, target hunters interested in:
- Privacy tools
- Developer tools
- Photography apps
- Consumer SaaS
- One-person startups

Pitch angle: "Privacy-first passport photos — unique technical approach (100% client-side AI)"

---

## FAQ for Comments

**Q: Why should I trust this is actually private?**
> You don't have to trust us — verify it yourself. Open DevTools → Network tab and watch. You'll see zero image uploads. The AI runs entirely in your browser via WebAssembly.

**Q: How do you make money if you don't collect data?**
> Simple business model: $4.99 per photo download. That's it. No ads, no data sales, no subscriptions.

**Q: What if my photo gets rejected?**
> 30-day money-back guarantee. Contact us and we'll refund you, no questions asked.

**Q: Why is this cheaper than CVS/Walgreens?**
> No physical infrastructure, no staff, no printers. Our only cost is hosting static files. We pass the savings to you.

**Q: Does this work on mobile?**
> Yes! Works on any modern browser — iOS Safari, Chrome, Android. No app install needed.

---

## Success Metrics

**Goals:**
- [ ] Top 10 Product of the Day
- [ ] 300+ upvotes
- [ ] 50+ comments
- [ ] 500+ website visits from PH
- [ ] 20+ paying customers from launch

**Tracking:**
- UTM: `?ref=producthunt&utm_source=producthunt&utm_medium=launch`
- GA4 event: `ph_launch_click`
- Stripe metadata: `source: producthunt`
