# Complete Deployment Guide - Vercel + Render

**Last Updated**: 2026-08-30  
**Target Deployment**: Production  
**Frontend**: Vercel | **Backend**: Render

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables gathered
- [ ] Supabase project created + RLS enabled
- [ ] Groq API key obtained (free tier OK)
- [ ] Upstash Redis created + URL & token
- [ ] Database migrations run locally
- [ ] Test accounts created
- [ ] Demo mode flag set appropriately
- [ ] Health checks passing locally

---

## 🎯 Quick Deploy (5 min)

### 1. Frontend (Vercel) - Already Deployed ✅
- Repository: Connected to `main` branch
- URL: https://sentastudio.vercel.app
- Auto-deploys on push to `main`

**Environment Variables** (Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_DEMO_MODE=true (demo) or false (production)
UPSTASH_REDIS_REST_URL=https://[region].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]
```

**Verify Deployment**
1. Go to https://sentastudio.vercel.app
2. Sign in with test account
3. Check chat works (should not rate-limit immediately)
4. Check localStorage is empty (using Supabase + Redis)

### 2. Backend (Render) - Already Deployed ✅
- Service: `ascendra-1` on Render
- URL: https://ascendra-1.onrender.com
- Auto-deploys from GitHub push

**Environment Variables** (Settings → Environment)
```
GROQ_API_KEY=[your-groq-api-key]
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]
ENVIRONMENT=production
```

**Verify Deployment**
```bash
# Test health endpoint
curl https://ascendra-1.onrender.com/health

# Test chat endpoint
curl -X POST https://ascendra-1.onrender.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?", "session_id": "test"}'
```

---

## 🔧 Manual Deployment Steps

### Option A: Vercel (Frontend)

**If not already connected:**

1. **Connect GitHub**
   - Go to vercel.com → New Project
   - Select GitHub repository
   - Select `studio` as root directory
   - Click Deploy

2. **Set Environment Variables**
   - Settings → Environment Variables
   - Add all vars from [Quick Deploy](#1-frontend-vercel---already-deployed-)
   - Redeploy (Deployments → Redeploy)

3. **Configure Domain** (if custom domain)
   - Settings → Domains
   - Add domain (e.g., `syncsenta.ke`)
   - Update DNS records

### Option B: Render (Backend)

**If not already connected:**

1. **Connect GitHub**
   - Go to render.com → New Web Service
   - Select GitHub repository
   - Choose root directory: `ai-agents`
   - Name: `ascendra-api` or similar

2. **Set Environment Variables**
   - Settings → Environment
   - Add all vars from [Quick Deploy](#2-backend-render---already-deployed-)

3. **Configure Build & Start**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -w 4 -b 0.0.0.0:10000 'src.syncsenta_agents.api.api:app'`

4. **Set Plan**
   - Free tier hibernates after 15 min inactivity
   - **Recommended**: Paid tier ($7/month) for production

5. **Deploy**
   - Push to `main` → auto-deploys
   - Or manual: Render Dashboard → Deployments → Deploy commit

---

## 🗄️ Database Setup (Supabase)

### Initial Setup

1. **Create Project**
   - Go to supabase.com
   - Click New Project
   - Choose region (closest to Kenya: US East or EU)
   - Wait for setup (~2 min)

2. **Get Credentials**
   - Settings → API
   - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy Anon Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy Service Role Key → `SUPABASE_SERVICE_KEY` (backend only!)

3. **Run Migrations**
   ```bash
   cd supabase
   supabase db push --db-url "postgresql://postgres:[password]@[host]/postgres"
   ```

4. **Enable RLS**
   - Auth → Policies
   - Verify all tables have RLS enabled
   - Check policies are correct (view docs/ARCHITECTURE.md for policy details)

5. **Set Up Authentication**
   - Auth → Providers
   - Email/Password: Enabled by default
   - Google OAuth:
     - Go to console.cloud.google.com
     - Create OAuth credentials (Web application)
     - Add Callback URL: `https://[project].supabase.co/auth/v1/callback`
     - Copy Client ID & Secret
     - Paste into Supabase

---

## 🔑 Environment Variables Explained

### Frontend (Next.js - Vercel)

| Variable | Where to Get | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API | `https://xxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API | `eyJ...` | Yes |
| `NEXT_PUBLIC_DEMO_MODE` | Set manually | `true` or `false` | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Console | `https://xxx.upstash.io` | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console | `AxxxYyy...` | Yes |

### Backend (Python - Render)

| Variable | Where to Get | Example | Required |
|----------|-------------|---------|----------|
| `GROQ_API_KEY` | console.groq.com/keys | `gsk_xxx` | Yes |
| `SUPABASE_URL` | Supabase Settings → API | `https://xxx.supabase.co` | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase Settings → API | `eyJ...` | Yes |
| `DATABASE_URL` | Auto from Supabase | `postgresql://...` | Optional |
| `REDIS_URL` | Upstash Console | `redis://...` | Optional |
| `ENVIRONMENT` | Set manually | `production` | Yes |

---

## ✅ Deployment Verification

### Frontend Checklist

```bash
# 1. Check domain resolves
curl -I https://sentastudio.vercel.app
# Expected: HTTP 200 or 308 (redirect)

# 2. Check authentication works
# Sign in at https://sentastudio.vercel.app/auth/signin
# Expect: Redirected to dashboard

# 3. Check chat works
# Expect: No rate limit errors (Upstash working)

# 4. Check offline support
# Open DevTools → Network → offline
# Try to send message → should queue
# Go online → should sync

# 5. Check headers
curl -I https://sentastudio.vercel.app
# Expect: CSP, HSTS, X-Frame-Options headers
```

### Backend Checklist

```bash
# 1. Check health
curl https://ascendra-1.onrender.com/health
# Expected: {"status": "ok"}

# 2. Check chat endpoint
curl -X POST https://ascendra-1.onrender.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "session_id": "test123"}'
# Expected: JSON response with message

# 3. Check rate limiting
# Send 60+ requests in 1 second
# Expected: 429 (Too Many Requests) on excess

# 4. Check Supabase connection
# (Backend should log connection)
tail -f render-logs.txt
# Expected: No "Supabase connection failed" errors

# 5. Check Groq API working
curl -X POST https://ascendra-1.onrender.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is CBC curriculum?", "session_id": "test"}'
# Expected: Streaming response with Kiswahili/English content
```

### Database Checklist

```bash
# 1. Connect to database
psql postgresql://postgres:password@host/postgres

# 2. Check tables exist
\dt
# Expected: profiles, chat_sessions, chat_messages, progress_tracking, etc.

# 3. Check RLS is enabled
SELECT tablename FROM pg_tables WHERE tablename = 'profiles';
# Expected: (result shows table)

# 4. Check data is persisting
SELECT COUNT(*) FROM profiles;
# Expected: > 0 after users sign up

# 5. Check real-time subscriptions work
# Sign in to app → other tab should see activity
# Expected: Real-time updates working
```

---

## 🚨 Troubleshooting

### Frontend Not Loading
```
Issue: White screen or 404
Solution: 
1. Check domain DNS (Vercel settings → Domains)
2. Check build logs (Vercel → Deployments)
3. Check env vars (Vercel → Settings → Environment Variables)
4. Trigger rebuild (Deployments → Redeploy)
```

### Backend Returning 502 / 503
```
Issue: API calls fail with 502 Bad Gateway
Solution:
1. Check Render logs (Render → Logs)
2. Verify env vars are set (Render → Environment)
3. Check Groq API quota (console.groq.com/usage)
4. Restart service (Render → More → Restart service)
5. Consider upgrading plan ($7/month) if on free tier
```

### Rate Limiting Not Working
```
Issue: Users getting unlimited messages (rate limit bypass)
Solution:
1. Check Upstash Redis URL is correct
2. Verify token has read/write access
3. Check network request in DevTools:
   - POST /api/chat should have rate limit headers
4. Manually test: curl -H "x-rate-limit-limit: 50" ...
```

### Chat Returning Empty Responses
```
Issue: Groq API working but empty chat responses
Solution:
1. Check Groq API key is valid
2. Test directly: curl -X POST https://api.groq.com/...
3. Check backend logs for errors
4. Verify Supabase connection (backend should log)
5. Try restarting backend service
```

### Offline Sync Not Working
```
Issue: Messages don't sync when going online
Solution:
1. Check Service Worker registered (DevTools → Application → Service Workers)
2. Verify offline queue file (DevTools → Storage → IndexedDB → ascendra)
3. Check browser console for errors
4. Clear cache: DevTools → Application → Clear storage
5. Refresh page and try again
```

---

## 🔒 Security Checklist

- [ ] All API keys are in environment variables (not in code)
- [ ] Service role key is backend-only (never exposed to frontend)
- [ ] CORS is restricted to known origins
- [ ] CSP headers are set (check response headers)
- [ ] HTTPS is enforced (both Vercel + Render)
- [ ] Rate limiting is working (test with rapid requests)
- [ ] RLS policies are enabled (check Supabase)
- [ ] Google OAuth secret is secure
- [ ] Supabase project has backup enabled
- [ ] Monitoring is set up (Sentry / logs)

---

## 📊 Monitoring & Logs

### Vercel Logs
- Deployments → [Recent Deploy] → Logs
- Shows build and runtime errors
- Check for failed environment variable access

### Render Logs
- Service → Logs
- Shows startup errors, API errors, crashes
- Real-time tail available

### Supabase Logs
- Logs Explorer
- Shows database errors, auth issues
- Real-time updates

### Application Monitoring
```bash
# Frontend errors (DevTools)
1. Open DevTools → Console
2. Check for red errors
3. Look for 401 (auth), 429 (rate limit), 502 (backend) errors

# Backend errors (curl)
curl -v https://ascendra-1.onrender.com/health
# Check response status and headers
```

---

## 🔄 Deployment Workflow

### Standard Deploy
1. Push to `main` branch
2. GitHub webhook triggers both Vercel + Render
3. Builds run in parallel
4. Frontend deploys to https://sentastudio.vercel.app
5. Backend deploys to https://ascendra-1.onrender.com
6. Verify both are working (see Verification section)

### Emergency Rollback
```bash
# Vercel: Click Deployments → Previous Deploy → Redeploy
# Render: Click Deployments → Previous Deploy → Redeploy
# Or revert commit and push new fix
```

### Manual Deploy
```bash
# Vercel (via CLI)
npm i -g vercel
vercel --prod

# Render (automatic, but can trigger via API)
curl -X POST https://api.render.com/v1/services/{service-id}/deploys \
  -H "authorization: Bearer $RENDER_API_KEY"
```

---

## 🎯 Production Readiness

**Before going live to real users:**

- [ ] Payment integration is working (M-Pesa + Stripe)
- [ ] GDPR/privacy policy page exists
- [ ] Email notifications are working
- [ ] Backup/restore procedure documented
- [ ] Incident response playbook created
- [ ] Load testing done (simulate 100 concurrent users)
- [ ] Security audit completed
- [ ] Error tracking (Sentry) is enabled
- [ ] Analytics (PostHog) is enabled
- [ ] Support email/contact page live

**Minimum viable for competition:**
- ✅ Frontend + backend deployed
- ✅ Auth working
- ✅ Chat working
- ✅ Test accounts working
- ⚠️ Payment + parent portal (partial/missing)
- ⚠️ Monitoring (not set up)

---

## 📞 Support

**Common Questions**

Q: How do I update environment variables?
A: Vercel: Settings → Environment Variables → Save. Render: Settings → Environment → Save & Redeploy.

Q: Can I use the free tier of Render for production?
A: No - free tier hibernates after 15 min inactivity. Upgrade to paid ($7/month) for production.

Q: How do I increase rate limits?
A: Modify `RATE_LIMIT_WINDOW` in Upstash console or code. Default: 50 msgs/day.

Q: How do I switch between demo and production mode?
A: Set `NEXT_PUBLIC_DEMO_MODE=true` (demo) or `false` (production) in Vercel env vars.

Q: What if Groq API key quota is exceeded?
A: Go to console.groq.com/usage. Free tier has 30 reqs/min. Upgrade plan or wait for reset.

---

**Last Updated**: 2026-08-30  
**Maintained By**: Deployment Team  
**Next Audit**: 2026-09-13
