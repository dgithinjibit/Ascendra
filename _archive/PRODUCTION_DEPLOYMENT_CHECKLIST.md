# Production Deployment Checklist

## Current Status: ⚠️ Partially Deployed

✅ **Frontend**: Deployed to Vercel
❌ **Backend**: Not deployed (causing 404 errors)
❌ **Database**: SQL migrations not run

## Quick Start - Get Everything Working

### 1. Deploy AI Agents Backend (15 minutes)

**Why**: The frontend needs the backend for AI features (scheme of work, lesson plans, assessments)

**Steps**:
1. Go to https://render.com and sign in
2. Click "New +" → "Blueprint"
3. Connect GitHub repo: `dgithinjibit/Ascendra`
4. Set root directory: `ai-agents`
5. Set environment variables:
   ```
   GROQ_API_KEY=<get from https://console.groq.com>
   SUPABASE_URL=https://khsemyqovhqwrjzlzwo.supabase.co
   SUPABASE_SERVICE_KEY=<get from Supabase Settings → API>
   ```
6. Deploy and wait for completion
7. Copy the Render URL (e.g., `https://syncsenta-ai-backend.onrender.com`)

**Detailed Guide**: See `ai-agents/DEPLOYMENT.md`

### 2. Update Frontend Environment Variable (2 minutes)

**Steps**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_AI_AGENTS_URL=<your-render-url-from-step-1>
   ```
3. Redeploy frontend (Vercel → Deployments → Redeploy)

### 3. Run Database Migrations (5 minutes)

**Why**: Creates all required tables and functions in Supabase

**Steps**:
1. Go to Supabase Dashboard → SQL Editor
2. Run `studio/supabase/migrations/001_core_schema.sql`
   - Copy entire file content
   - Paste in SQL Editor
   - Click "Run"
   - Verify: `✅ Created X core tables for SyncSenta`
3. Run `studio/supabase/migrations/002_teacher_dashboard.sql`
   - Copy entire file content
   - Paste in SQL Editor
   - Click "Run"
   - Verify: `✅ Created X tables for Teacher Dashboard`

**Detailed Guide**: See `studio/TESTING_CHECKLIST.md`

## Complete Deployment Checklist

### Backend Deployment
- [ ] Render.com account created
- [ ] Groq API key obtained
- [ ] Supabase service role key obtained
- [ ] AI agents backend deployed to Render
- [ ] Backend health check passes: `curl https://your-backend.onrender.com/healthz`
- [ ] Backend URL added to Vercel env vars

### Database Setup
- [ ] `001_core_schema.sql` executed successfully
- [ ] `002_teacher_dashboard.sql` executed successfully
- [ ] All 11 tables created
- [ ] All 8 functions created
- [ ] RLS policies enabled on all tables

### Frontend Deployment
- [ ] Vercel environment variables set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_AI_AGENTS_URL`
- [ ] Frontend deployed successfully
- [ ] No build errors
- [ ] No console errors in browser

### Feature Testing
- [ ] User can sign up/sign in
- [ ] Student dashboard loads
- [ ] Teacher dashboard loads
- [ ] Scheme of Work generation works
- [ ] Lesson Plan generation works
- [ ] Assessment generation works
- [ ] Chat with Mwalimu works
- [ ] Real-time monitoring works

## Current Issues

### 1. ❌ Backend Not Deployed
**Error**: `POST http://localhost:8001/agents/chat net::ERR_CONNECTION_REFUSED`
**Impact**: All AI features broken (scheme of work, lesson plans, assessments)
**Fix**: Deploy backend to Render (see Step 1 above)

### 2. ⚠️ Database Migrations Not Run
**Impact**: App may crash when trying to access non-existent tables
**Fix**: Run SQL migrations in Supabase (see Step 3 above)

### 3. ⚠️ Missing Icons
**Error**: `Failed to load resource: icon-192.png 404`
**Impact**: PWA icons missing (minor issue)
**Fix**: Add PWA icons or disable PWA in `next.config.js`

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     PRODUCTION STACK                      │
└──────────────────────────────────────────────────────────┘

┌─────────────────┐
│   Vercel        │  Frontend (Next.js)
│   Frontend      │  - Student dashboard
│                 │  - Teacher dashboard
└────────┬────────┘  - Authentication
         │
         │ API Calls
         │
         ▼
┌─────────────────┐
│   Render.com    │  Backend (Python/FastAPI)
│   AI Agents     │  - AI chat agents
│                 │  - Lesson generation
└────────┬────────┘  - Assessment creation
         │
         ├──────────► Groq API (LLM)
         │            - llama-3.3-70b-versatile
         │
         └──────────► Supabase (Database)
                      - PostgreSQL
                      - Row Level Security
                      - Real-time subscriptions
```

## Environment Variables Summary

### Vercel (Frontend)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://khsemyqovhqwrjzlzwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
NEXT_PUBLIC_AI_AGENTS_URL=<from Render deployment>
```

### Render (Backend)
```bash
GROQ_API_KEY=<from Groq console>
SUPABASE_URL=https://khsemyqovhqwrjzlzwo.supabase.co
SUPABASE_SERVICE_KEY=<from Supabase dashboard>
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8001
FRONTEND_URL=<your Vercel URL>
```

## Cost Breakdown

### Free Tier (Good for Testing)
- ✅ Vercel: Free (Hobby plan)
- ✅ Render: Free (sleeps after 15 min inactivity)
- ✅ Supabase: Free (500MB database)
- ✅ Groq: Free (14,400 requests/day)
- **Total**: $0/month

### Production Tier (Recommended)
- Vercel: $20/month (Pro plan)
- Render: $7/month (Starter plan - always on)
- Supabase: $25/month (Pro plan - 8GB database)
- Groq: Pay-as-you-go (~$10-50/month depending on usage)
- **Total**: ~$62-102/month

## Next Steps After Deployment

1. **Test Everything**
   - Create test student account
   - Create test teacher account
   - Generate scheme of work
   - Generate lesson plan
   - Test chat functionality

2. **Monitor Performance**
   - Check Render logs for errors
   - Monitor Supabase usage
   - Track Groq API usage

3. **Set Up Alerts**
   - Render: Downtime alerts
   - Vercel: Build failure alerts
   - Supabase: Database usage alerts

4. **Optimize**
   - Enable caching
   - Add CDN for static assets
   - Optimize database queries

## Support Resources

- **Frontend Issues**: Check Vercel logs
- **Backend Issues**: Check Render logs
- **Database Issues**: Check Supabase logs
- **AI Issues**: Check Groq console

## Quick Links

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://syncsenta-ai-backend.onrender.com
- **Database**: https://supabase.com/dashboard/project/khsemyqovhqwrjzlzwo
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **Groq Console**: https://console.groq.com

## Emergency Rollback

If something breaks:

1. **Frontend**: Vercel → Deployments → Previous deployment → Promote to Production
2. **Backend**: Render → Manual Deploy → Select previous commit
3. **Database**: Run rollback SQL (see `studio/supabase/migrations/README.md`)

## Status Check Commands

```bash
# Check backend health
curl https://your-backend.onrender.com/healthz

# Check frontend
curl https://your-app.vercel.app

# Check database connection (from backend logs)
# Should see: "Connected to Supabase"
```

---

**Last Updated**: 2024-01-15
**Current Commit**: a8bc61a
