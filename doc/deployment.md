# Deployment Guide

## Vercel Deployment

Voyager is designed to deploy on Vercel with zero configuration for the Next.js build.

### 1. Push to GitHub

```bash
git remote add origin git@github.com:your-username/Voyager.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js -- no build settings needed
4. Click Deploy (it will fail until you add env vars)

### 3. Provision Services via Vercel Marketplace

```bash
# Clerk (auth) -- auto-provisions CLERK_SECRET_KEY + publishable key
vercel integration add clerk

# Neon (database) -- auto-provisions DATABASE_URL
vercel integration add neon
```

### 4. Add Remaining Environment Variables

Via CLI:
```bash
vercel env add AI_GATEWAY_API_KEY
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
vercel env add FOURSQUARE_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PREMIUM_PRICE_ID
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add CLERK_WEBHOOK_SECRET
```

Or via the Vercel dashboard: Project Settings > Environment Variables.

### 5. Push Database Schema

```bash
# Pull env vars locally
vercel env pull .env.local

# Push Drizzle schema to Neon
npx drizzle-kit push
```

### 6. Configure Webhooks

**Clerk Webhook:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com) > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/clerk/webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret to `CLERK_WEBHOOK_SECRET`

**Stripe Webhook:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > Developers > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 7. Redeploy

After adding all env vars, trigger a redeploy:

```bash
vercel --prod
```

## Environment-Specific Configuration

| Variable | Development | Preview | Production |
|----------|------------|---------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Auto (Vercel URL) | Your domain |
| `DATABASE_URL` | Dev branch | Preview branch | Main branch |
| Stripe keys | Test keys | Test keys | Live keys |

## Build Configuration

Vercel auto-detects these settings:
- **Framework:** Next.js
- **Build Command:** `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

No `vercel.json` or `vercel.ts` configuration file is needed for basic deployment.

## Monitoring

- **Vercel Dashboard:** deployment logs, function logs, analytics
- **Drizzle Studio:** database inspection (`npx drizzle-kit studio`)
- **Stripe Dashboard:** payment and subscription monitoring
- **Clerk Dashboard:** user management and auth logs
