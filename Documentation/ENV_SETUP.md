# Environment Variables Setup Guide

## Overview
This guide explains how to configure environment variables for both local development and production deployment on Cloudflare Pages.

## Variables Used

### Frontend Variables (Embedded at Build Time)
These variables are prefixed with `VITE_` and are embedded into the JavaScript bundle:

- **`VITE_STRIPE_URL`** - Your Stripe donation/payment link
- **`VITE_GITHUB_REPO`** - Your GitHub repository URL
- **`VITE_TURNSTILE_SITE_KEY`** - Cloudflare Turnstile site key (public)

### Backend Variables (Worker-Only)
These variables are ONLY available to Cloudflare Workers and are never exposed to the client:

- **`BTC_EMAIL`** - Bitcoin donation email address (protected from scrapers)
- **`TURNSTILE_SECRET_KEY`** - Cloudflare Turnstile secret key (private)

## Local Development

### Using `.dev.vars` (Current Setup)

Your `.dev.vars` file should contain:

```bash
# Frontend Variables (will be embedded in bundle)
VITE_STRIPE_URL=https://your-stripe-payment-link.com
VITE_GITHUB_REPO=https://github.com/your-username/your-repo
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key

# Backend Variables (Worker-only, never exposed)
BTC_EMAIL=your-email@proton.me
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

**Important Notes:**
- The `vite.config.ts` reads from `.dev.vars` automatically
- After changing `.dev.vars`, you must restart the dev server (`npm run dev`)
- Variables starting with `VITE_` are exposed to the browser
- Variables WITHOUT `VITE_` prefix are only available to Workers (backend)

### Getting Turnstile Keys

1. **Go to Cloudflare Dashboard**
   - Navigate to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Select **Turnstile** from the left sidebar
   
2. **Create a New Site**
   - Click **Add Site**
   - **Site name**: `BogleConvert Email Protection` (or any name)
   - **Domain**: Add `localhost` for local development
   - **Widget Mode**: Choose "Managed" (recommended - invisible for most users)
   
3. **Copy Your Keys**
   - **Site Key** (Public) → Use for `VITE_TURNSTILE_SITE_KEY`
   - **Secret Key** (Private) → Use for `TURNSTILE_SECRET_KEY`

4. **Add Production Domain Later**
   - After deploying, go back to Turnstile settings
   - Add your production domain (e.g., `bogleconvert.com`)

## Production (Cloudflare Pages)

### Setting Environment Variables in Cloudflare Dashboard

1. **Navigate to your Cloudflare Pages project**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Select "Workers & Pages"
   - Click on your BogleConvert project

2. **Add Environment Variables**
   - Go to "Settings" tab
   - Scroll to "Environment variables" section
   - Click "Add variable" for each of the following:

   | Variable Name | Type | Example Value | Scope |
   |--------------|------|---------------|-------|
   | `VITE_STRIPE_URL` | Plain text | `https://donate.stripe.com/your-link` | Production |
   | `VITE_GITHUB_REPO` | Plain text | `https://github.com/username/BogleConvert` | Production |
   | `VITE_TURNSTILE_SITE_KEY` | Plain text | `0x4AAA...` | Production |
   | `BTC_EMAIL` | Plain text | `donations@proton.me` | Production |
   | `TURNSTILE_SECRET_KEY` | Secret | `0x4BBB...` | Production |

3. **Set Environment Scope**
   - **Production**: Add all variables to "Production" environment
   - **Preview**: Optionally add to "Preview" for testing

4. **Deploy**
   - After adding variables, trigger a new deployment
   - Variables will be available at build time and runtime

### Important Notes for Production

- ✅ `VITE_` variables are **embedded at build time** (safe for public exposure)
- ⚠️ These variables will be visible in your compiled JavaScript bundle
- 🔒 Never put sensitive secrets (API keys, passwords) in `VITE_` variables
- 🔐 `BTC_EMAIL` and `TURNSTILE_SECRET_KEY` are Worker-only (server-side)
- 🔄 After adding/changing variables, redeploy your application

## Verification

### Local Development
1. Start dev server: `npm run dev`
2. Navigate to the Support page
3. For Stripe and GitHub: Values should display immediately
4. For Bitcoin:
   - Should show "Protected by Cloudflare Turnstile"
   - Click "Reveal Email" button
   - Complete Turnstile challenge
   - Email should appear after verification

### Production
1. Deploy to Cloudflare Pages
2. Visit your production site
3. Navigate to Support page
4. Test all three donation options
5. Verify Turnstile challenge works and email is revealed

## Troubleshooting

### Variables showing as "Not configured yet"

**Local Development:**
- Ensure your `.dev.vars` file exists in the project root
- Check that frontend variables start with `VITE_` prefix
- Restart the dev server after any changes
- Check browser console for errors

**Production:**
- Verify variables are set in Cloudflare Dashboard
- Ensure you've redeployed after adding variables
- Check build logs in Cloudflare for issues

### Turnstile not appearing

**Check these:**
- `VITE_TURNSTILE_SITE_KEY` is set correctly
- Domain is added to Turnstile site settings
- Browser console for JavaScript errors
- Network tab for failed API calls

### Email not revealing after challenge

**Check these:**
- `TURNSTILE_SECRET_KEY` is set in Worker environment
- `BTC_EMAIL` is set in Worker environment
- Check Workers logs in Cloudflare Dashboard
- Verify `/api/reveal-email` endpoint is accessible

### Dev server not picking up changes
- Always restart `npm run dev` after editing `.dev.vars`
- The config loads `.dev.vars` on startup only

## Architecture Notes

### Why Protect the Email?

The Bitcoin email is protected with Cloudflare Turnstile to prevent:
- **Web scrapers** from harvesting the email address
- **Spam bots** from collecting contact information
- **Automated abuse** of the donation system

### How It Works

1. User clicks "Reveal Email" on Support page
2. Turnstile widget appears (CAPTCHA challenge)
3. User completes challenge (often invisible)
4. Frontend sends Turnstile token to `/api/reveal-email` Worker endpoint
5. Worker verifies token with Cloudflare's API
6. If valid, Worker returns the protected email
7. Email is displayed and user can copy it

### Build-time vs Runtime Variables

- **Build-time** (`VITE_` prefix): Embedded into JavaScript during build
  - Used for: Public configuration, URLs, feature flags
  - Available in: Browser (client-side)
  - Security: Safe for public information only
  
- **Runtime** (no `VITE_` prefix): Available in Cloudflare Workers at request time
  - Used for: Protected data, API keys, secrets
  - Available in: Workers (server-side only)
  - Security: Never exposed to browser

The BTC email now uses **runtime** variables to keep it hidden from scrapers.
