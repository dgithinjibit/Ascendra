# AI Agents Backend Deployment Guide

## Overview
This guide walks you through deploying the Syncsenta AI Agents backend to Render.com.

## Prerequisites

Before deploying, you need:

1. **Render.com Account** - Sign up at https://render.com
2. **Groq API Key** - Get from https://console.groq.com
3. **Supabase Service Role Key** - From your Supabase project settings

## Step-by-Step Deployment

### 1. Get Required API Keys

#### Groq API Key
1. Go to https://console.groq.com
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

#### Supabase Service Role Key
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `khsemyqovhqwrjzlzwo`
3. Go to Settings → API
4. Find "Project API keys" section
5. Copy the `service_role` key (⚠️ This is secret - never expose in frontend)

### 2. Deploy to Render

#### Option A: Deploy via Blueprint (Recommended)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select repository: `dgithinjibit/Ascendra`
5. Render will detect `ai-agents/render.yaml`
6. Click **"Apply"**

#### Option B: Deploy Manually

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `syncsenta-ai-backend`
   - **Root Directory**: `ai-agents`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -e .`
   - **Start Command**: `python -m syncsenta_agents.main`

### 3. Set Environment Variables in Render

In your Render service dashboard, go to **Environment** tab and add:

```bash
# Required
GROQ_API_KEY=configure-this-in-the-secret-manager
SUPABASE_URL=https://khsemyqovhqwrjzlzwo.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# Optional (already set in render.yaml)
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8001
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important**: Replace the placeholder values with your actual keys!

### 4. Deploy

1. Click **"Create Web Service"** or **"Apply"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start the service
3. Wait for deployment to complete (usually 2-5 minutes)

### 5. Get Your Backend URL

Once deployed, Render will provide a URL like:
```
https://syncsenta-ai-backend.onrender.com
```

Copy this URL - you'll need it for the frontend.

### 6. Update Frontend Environment Variables

Go to your Vercel project:

1. Open Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   ```
   NEXT_PUBLIC_AI_AGENTS_URL=https://syncsenta-ai-backend.onrender.com
   ```
3. Click **"Save"**
4. Redeploy your frontend (Vercel → Deployments → Redeploy)

### 7. Verify Deployment

Test the backend health endpoint:
```bash
curl https://syncsenta-ai-backend.onrender.com/healthz
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Architecture

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
│  Next.js App    │
└────────┬────────┘
         │
         │ NEXT_PUBLIC_AI_AGENTS_URL
         │
         ▼
┌─────────────────┐
│  Render.com     │
│  (Backend)      │
│  Python/FastAPI │
└────────┬────────┘
         │
         ├──► Groq API (LLM)
         │
         └──► Supabase (Database)
```

## Features Enabled

Once deployed, these features will work:

✅ **Scheme of Work Generator** - AI-powered curriculum planning
✅ **Lesson Plan Generator** - Detailed lesson plans
✅ **Assessment Generator** - Quizzes and tests
✅ **Magic School Teacher** - AI teaching assistant
✅ **Real-time Student Monitoring** - Live student activity
✅ **AI Feedback Dashboard** - Teacher feedback analysis

## Troubleshooting

### Build Fails

**Error**: `ModuleNotFoundError: No module named 'syncsenta_agents'`
**Solution**: Ensure `pyproject.toml` exists and build command is `pip install -e .`

### Service Crashes on Start

**Error**: `Missing environment variable: GROQ_API_KEY`
**Solution**: Check all required environment variables are set in Render dashboard

### Connection Refused from Frontend

**Error**: `Failed to fetch` or `ERR_CONNECTION_REFUSED`
**Solution**: 
1. Verify backend is running (check Render logs)
2. Verify `NEXT_PUBLIC_AI_AGENTS_URL` is set in Vercel
3. Redeploy frontend after setting env var

### CORS Errors

**Error**: `Access-Control-Allow-Origin` error
**Solution**: Update `FRONTEND_URL` in Render to match your Vercel domain

## Cost Estimate

### Render.com
- **Free Tier**: Available (service sleeps after 15 min inactivity)
- **Starter Plan**: $7/month (always on, better performance)

### Groq API
- **Free Tier**: 14,400 requests/day
- **Pay-as-you-go**: $0.10 per 1M tokens

### Supabase
- **Free Tier**: 500MB database, 2GB bandwidth
- **Pro Plan**: $25/month (8GB database, 250GB bandwidth)

## Monitoring

### Render Dashboard
- View logs: Render Dashboard → Your Service → Logs
- Monitor metrics: CPU, Memory, Response times
- Set up alerts for downtime

### Health Check
Render automatically monitors `/healthz` endpoint and restarts if unhealthy.

## Scaling

### Horizontal Scaling
Render supports auto-scaling based on:
- CPU usage
- Memory usage
- Request rate

Configure in: Render Dashboard → Your Service → Settings → Scaling

### Vertical Scaling
Upgrade instance type for more resources:
- Starter: 512MB RAM, 0.5 CPU
- Standard: 2GB RAM, 1 CPU
- Pro: 4GB RAM, 2 CPU

## Security

### Environment Variables
- ✅ Never commit API keys to git
- ✅ Use Render's environment variable encryption
- ✅ Rotate keys regularly

### API Keys
- ✅ `SUPABASE_SERVICE_KEY` - Backend only (never expose to frontend)
- ✅ `GROQ_API_KEY` - Backend only
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Frontend (public, RLS protected)

### CORS
Backend is configured to only accept requests from your frontend domain.

## Next Steps

After successful deployment:

1. ✅ Test all AI features in production
2. ✅ Monitor Render logs for errors
3. ✅ Set up Render alerts for downtime
4. ✅ Configure custom domain (optional)
5. ✅ Enable auto-scaling if needed

## Support

- **Render Docs**: https://render.com/docs
- **Groq Docs**: https://console.groq.com/docs
- **Supabase Docs**: https://supabase.com/docs

## Checklist

Before going live:

- [ ] Groq API key obtained and set in Render
- [ ] Supabase service role key set in Render
- [ ] Backend deployed successfully on Render
- [ ] Backend health check passes
- [ ] `NEXT_PUBLIC_AI_AGENTS_URL` set in Vercel
- [ ] Frontend redeployed with new env var
- [ ] Scheme of Work generation tested
- [ ] Lesson Plan generation tested
- [ ] Assessment generation tested
- [ ] No console errors in browser
