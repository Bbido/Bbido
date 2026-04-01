# LinkedAI – AI Writing Assistant for LinkedIn

A complete Chrome extension + backend SaaS that generates LinkedIn posts, comments, messages and more using Claude AI.

## Revenue Model
- **Free tier**: 5 generations/day
- **Pro tier**: $9/month — unlimited generations
- **Target**: 500 users × $9 = **$4,500/month passive income**

---

## Project Structure

```
linkedin-ai/
├── extension/          # Chrome extension (load unpacked to test)
├── backend/            # Node.js API (deploy to Vercel/Railway)
└── landing/            # Landing page (deploy to Vercel)
```

---

## Launch Steps

### 1. Set up Supabase (free)
1. Create account at supabase.com
2. Create new project
3. Go to SQL Editor and run `backend/supabase-schema.sql`
4. Copy your Project URL and service_role key

### 2. Set up Stripe
1. Create account at stripe.com
2. Create a product: "LinkedAI Pro" — $9/month recurring
3. Copy the Price ID (price_xxx)
4. Get your Secret Key and Webhook Secret

### 3. Deploy the Backend
1. Push to GitHub
2. Deploy to Vercel (free): `vercel --prod`
3. Add environment variables from `.env.example`
4. Set Stripe webhook URL to: `https://your-api.vercel.app/api/webhook`

### 4. Deploy the Landing Page
1. Deploy `landing/` to Vercel
2. Update the Chrome Store URL in `landing/index.html`

### 5. Update Extension Config
- In `extension/background/service-worker.js` update `API_BASE` to your Vercel URL
- In `extension/popup/popup.js` update `API_BASE`

### 6. Generate Extension Icons
Run this to create placeholder icons (replace with real ones later):
```bash
# Use any image editor or online tool to create:
# icons/icon16.png (16x16)
# icons/icon48.png (48x48)  
# icons/icon128.png (128x128)
```

### 7. Load Extension in Chrome (Testing)
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Go to LinkedIn and look for the ✦ button in text fields

### 8. Submit to Chrome Web Store
1. Create developer account ($5 one-time fee)
2. Zip the `extension/` folder
3. Submit at chrome.google.com/webstore/developer/dashboard
4. Review takes 3-7 days

---

## Environment Variables

```
ANTHROPIC_API_KEY=      # Claude API key
SUPABASE_URL=           # Supabase project URL
SUPABASE_SERVICE_KEY=   # Supabase service role key
STRIPE_SECRET_KEY=      # Stripe secret key
STRIPE_WEBHOOK_SECRET=  # Stripe webhook secret
STRIPE_PRICE_ID=        # Stripe price ID for $9/mo plan
JWT_SECRET=             # Random secret string (min 32 chars)
APP_URL=                # Your landing page URL
FREE_DAILY_LIMIT=5      # Free tier daily limit
```

---

## Marketing (Zero Budget)

1. **Post on LinkedIn** — "I built a Chrome extension that writes LinkedIn posts with AI" — ironic but works
2. **Product Hunt launch** — schedule for a Tuesday/Wednesday
3. **Reddit** — r/linkedin, r/entrepreneur, r/SideProject
4. **Twitter/X** — Build in public, show before/after posts
5. **Cold outreach** — LinkedIn coaches, content creators

---

## Cost to Run (Monthly)

| Service | Cost |
|---------|------|
| Vercel (backend + landing) | Free |
| Supabase (up to 50K users) | Free |
| Claude API (Haiku, ~1000 users) | ~$5 |
| Stripe fees (500 users × $9) | ~$130 |
| **Total** | **~$135/mo** |
| **Revenue at 500 users** | **$4,500/mo** |
| **Profit margin** | **97%** |
