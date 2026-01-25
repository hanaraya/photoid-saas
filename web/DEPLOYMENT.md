# PhotoID App Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Domain Setup
- [ ] Purchase domain: `photoid.app` (suggested) or similar
- [ ] Configure DNS to point to Vercel
- [ ] Set up SSL certificate (automatic with Vercel)

### 2. Vercel Deployment
- [ ] Create Vercel account at https://vercel.com
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Run `vercel login` and authenticate
- [ ] Deploy: `vercel --prod`
- [ ] Configure custom domain in Vercel dashboard

### 3. Environment Variables (Vercel Dashboard)
Set these in your Vercel project settings:
```
NEXT_PUBLIC_BASE_URL=https://photoid.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX (optional)
```

### 4. Stripe Setup
- [ ] Create Stripe account: https://stripe.com
- [ ] Get live API keys from Stripe Dashboard
- [ ] Set up webhook endpoint: `https://photoid.app/api/webhook`
- [ ] Configure webhook events: `checkout.session.completed`
- [ ] Update environment variables with live keys

### 5. Testing Checklist
- [ ] Build succeeds: `npm run build`
- [ ] Background removal works in production
- [ ] Payment flow works end-to-end
- [ ] Mobile responsiveness
- [ ] COOP/COEP headers working
- [ ] All country photo standards load
- [ ] Download functionality works

### 6. SEO & Analytics
- [ ] Verify sitemap: `https://photoid.app/sitemap.xml`
- [ ] Submit to Google Search Console
- [ ] Set up Google Analytics (optional)
- [ ] Create social media images (og-image.png)
- [ ] Add favicon files

### 7. Icons & Images Needed
Create these files in `/public/`:
- [ ] `favicon.ico` (32x32)
- [ ] `favicon-16x16.png`
- [ ] `favicon-32x32.png`
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `android-chrome-192x192.png`
- [ ] `android-chrome-512x512.png`
- [ ] `og-image.png` (1200x630)

### 8. Launch Monitoring
- [ ] Set up error monitoring (Vercel Analytics)
- [ ] Monitor performance metrics
- [ ] Track conversion rates
- [ ] Monitor Stripe webhook deliveries

## 🚨 Security Check
- [ ] All environment variables are secure
- [ ] No sensitive data in git repository
- [ ] Stripe webhook signatures verified
- [ ] HTTPS enforced
- [ ] Rate limiting on API routes (future enhancement)

## 🔗 Quick Deploy Commands

```bash
# 1. Build and test locally
npm run build
npm start

# 2. Deploy to Vercel
vercel --prod

# 3. Set environment variables (via Vercel Dashboard)
# 4. Configure custom domain
# 5. Test all functionality
```

## 📞 Support Domains
Suggested domain alternatives if photoid.app is unavailable:
- passportpic.app
- quickid.app
- photopass.app
- instantid.app
- govphoto.app