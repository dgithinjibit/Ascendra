# Backend URL Configuration Fix

## Problem
The application was hardcoded to fall back to `localhost:8001` when the environment variable wasn't set, causing failures in production.

## Solution
Created centralized API configuration with proper error handling and environment-aware fallbacks.

## Changes Made

### 1. Created Centralized API Config
**File**: `src/lib/api-config.ts`

**Features**:
- Single source of truth for all API URLs
- Environment-aware (production vs development)
- Throws clear errors in production if URL not configured
- Provides helper functions for building URLs
- Centralized endpoint constants

### 2. Updated Components

All components now import and use the centralized config:

```typescript
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-config'

// Instead of:
const apiUrl = process.env.NEXT_PUBLIC_AI_AGENTS_URL || 'http://localhost:8001'
const response = await fetch(`${apiUrl}/agents/chat`, {...})

// Now use:
const response = await fetch(buildApiUrl(API_ENDPOINTS.AGENTS_CHAT), {...})
```

**Components Updated**:
- ✅ `src/components/teacher/scheme-of-work-generator.tsx`
- ✅ `src/components/teacher/lesson-plan-generator.tsx`
- ✅ `src/components/teacher/assessment-generator.tsx`
- ✅ `src/components/teacher/magic-school-teacher.tsx`
- ⏳ `src/components/teacher/agent-stats.tsx` (pending)
- ⏳ `src/components/teacher/ai-feedback-dashboard.tsx` (pending)
- ⏳ `src/components/teacher/real-time-monitor.tsx` (pending)
- ⏳ `src/components/teacher/student-detail.tsx` (pending)
- ⏳ `src/components/student/interactive-sandbox.tsx` (pending)

## Backend Deployment Status

✅ **Backend is LIVE on Render**

**URL**: `https://ascendra-1.onrender.com`

**Status**:
- Server running on port 10000
- Supabase connected
- All agents registered (assessment, socratic_tutor, lesson_architect)
- Health check: `https://ascendra-1.onrender.com/healthz`

## Required Vercel Configuration

### Environment Variable to Set

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
NEXT_PUBLIC_AI_AGENTS_URL=https://ascendra-1.onrender.com
```

**Important**: 
- No trailing slash
- Must be HTTPS
- Must be set for all environments (Production, Preview, Development)

### After Setting Environment Variable

1. Go to Vercel → Deployments
2. Click on latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache" (faster)
5. Click "Redeploy"

## Testing

After redeployment, test these features:

### Teacher Features
- [ ] Scheme of Work generation
- [ ] Lesson Plan generation
- [ ] Assessment generation
- [ ] Magic School Teacher chat
- [ ] Real-time student monitoring
- [ ] Student progress dashboard

### Student Features
- [ ] Chat with SyncSenta
- [ ] Interactive sandbox
- [ ] Telemetry capture

## Error Handling

### Production Error
If `NEXT_PUBLIC_AI_AGENTS_URL` is not set in production:
```
Error: NEXT_PUBLIC_AI_AGENTS_URL environment variable is not set.
Please configure the backend URL in your deployment settings.
```

### Development Fallback
In development (localhost), automatically falls back to `http://localhost:8001`

## Benefits

✅ **Single Source of Truth**: All API URLs in one place
✅ **Type Safety**: Centralized endpoint constants
✅ **Better Error Messages**: Clear errors when misconfigured
✅ **Environment Aware**: Different behavior for dev vs prod
✅ **Easier Maintenance**: Change URL in one place
✅ **No More Localhost in Production**: Proper error handling

## Migration Guide for Future Components

When creating new components that call the backend:

```typescript
// 1. Import the config
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-config'

// 2. Use buildApiUrl for existing endpoints
const response = await fetch(buildApiUrl(API_ENDPOINTS.AGENTS_CHAT), {
  method: 'POST',
  // ...
})

// 3. For new endpoints, add to API_ENDPOINTS in api-config.ts first
// Then use: buildApiUrl(API_ENDPOINTS.YOUR_NEW_ENDPOINT)
```

## Rollback Plan

If issues occur:

1. Revert to previous deployment in Vercel
2. Or temporarily set `NEXT_PUBLIC_AI_AGENTS_URL=http://localhost:8001` (not recommended)
3. Or remove the production check in `api-config.ts` (emergency only)

## Next Steps

1. ✅ Backend deployed to Render
2. ⏳ Update remaining components
3. ⏳ Set Vercel environment variable
4. ⏳ Redeploy frontend
5. ⏳ Test all AI features
6. ⏳ Monitor Render logs for errors

## Monitoring

### Render Logs
Check: https://dashboard.render.com → Your Service → Logs

Look for:
- Incoming requests
- Agent execution logs
- Error messages

### Vercel Logs
Check: https://vercel.com/dashboard → Your Project → Logs

Look for:
- API call failures
- Environment variable issues
- Build errors

## Support

If scheme of work generation still fails:

1. Check Vercel environment variable is set correctly
2. Check Render service is running (green status)
3. Test backend directly: `curl https://ascendra-1.onrender.com/healthz`
4. Check browser console for exact error message
5. Check Render logs for backend errors
