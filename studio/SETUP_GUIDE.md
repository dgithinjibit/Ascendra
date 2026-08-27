# SyncSenta - Setup Guide

Complete setup guide for getting SyncSenta running locally and deploying to production.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A Groq API key (free tier works)
- Optional: Upstash Redis account (for production rate limiting)

---

## Part 1: Supabase Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `syncsenta` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to Kenya (e.g., `eu-west-1` or `ap-southeast-1`)
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Run Database Migrations

1. Once your project is ready, click **SQL Editor** in the left sidebar
2. Open the file `supabase/migrations/001_core_schema.sql` from this repo
3. Copy the entire contents
4. Paste into the Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
6. You should see: `✅ Created 8 core tables for SyncSenta`

### Step 3: Get API Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy these three values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (keep this secret!)
```

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the Supabase values:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (anon/public key)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key)
   ```

---

## Part 2: Groq API Setup (2 minutes)

### Step 1: Get Groq API Key

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in
3. Click "Create API Key"
4. Copy the key (starts with `gsk_...`)

### Step 2: Add to Environment

Add to your `.env.local`:
```bash
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## Part 3: Install Dependencies & Run

### Step 1: Install Packages

```bash
cd studio
npm install
```

This will install:
- Supabase client libraries (`@supabase/supabase-js`, `@supabase/ssr`)
- Upstash Redis (`@upstash/redis`)
- All existing dependencies

### Step 2: Run Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Step 3: Test the Setup

1. Open [http://localhost:5173](http://localhost:5173)
2. You should see the SyncSenta interface
3. Try asking a question in the Socratic Chat
4. Check Supabase dashboard → **Table Editor** → `chat_sessions` to see data being saved

---

## Part 4: Optional - Upstash Redis (Production Rate Limiting)

For local development, the in-memory rate limiter works fine. For production, use Upstash Redis.

### Step 1: Create Upstash Redis Database

1. Go to [https://console.upstash.com/redis](https://console.upstash.com/redis)
2. Click "Create Database"
3. Choose:
   - **Name**: `mwalimu-rate-limit`
   - **Type**: Regional (cheaper)
   - **Region**: Closest to your users
4. Click "Create"

### Step 2: Get Credentials

1. Click on your database
2. Scroll to **REST API** section
3. Copy:
   ```
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

### Step 3: Add to Environment

Add to `.env.local`:
```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

---

## Part 5: Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Supabase integration"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to `studio`
5. Add Environment Variables (copy from `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
   - `UPSTASH_REDIS_REST_URL` (if using)
   - `UPSTASH_REDIS_REST_TOKEN` (if using)
6. Click "Deploy"

### Step 3: Test Production

1. Once deployed, visit your Vercel URL
2. Test the chat functionality
3. Check Supabase dashboard to verify data is being saved

---

## Part 6: Create First User

### Option A: Manual (via Supabase Dashboard)

1. Go to Supabase → **Authentication** → **Users**
2. Click "Add user"
3. Fill in:
   - **Email**: your email
   - **Password**: choose a password
   - **Auto Confirm User**: ✅ (check this)
4. Click "Create user"
5. Go to **Table Editor** → `profiles`
6. Click "Insert row"
7. Fill in:
   - `id`: Copy the user ID from Authentication → Users
   - `email`: Same email
   - `role`: `student`
   - `grade`: `Grade 4`
   - `full_name`: Your name
   - `language_preference`: `mixed`
8. Click "Save"

### Option B: Via Sign-Up Flow (Coming Soon)

We'll add a proper sign-up flow in the next phase.

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure `.env.local` exists and has all three Supabase variables set.

### Issue: "Failed to fetch" when sending messages

**Solution**: 
1. Check that `GROQ_API_KEY` is set correctly
2. Verify your Groq API key is active at [https://console.groq.com/keys](https://console.groq.com/keys)
3. Check browser console for detailed error messages

### Issue: Messages not saving to database

**Solution**:
1. Check Supabase dashboard → **SQL Editor** → Run: `SELECT * FROM chat_sessions LIMIT 10;`
2. If empty, verify RLS policies are set up correctly (they should be from the migration)
3. Check that you're logged in (have a valid user session)

### Issue: "Row Level Security" errors

**Solution**: The migration script sets up RLS policies automatically. If you see RLS errors:
1. Go to Supabase → **Authentication** → **Policies**
2. Verify policies exist for `profiles`, `chat_sessions`, `chat_messages`
3. If missing, re-run the migration script

---

## Next Steps

Once you have the basic setup working:

1. **Add Authentication UI** - Sign up, login, logout flows
2. **Migrate localStorage history** - Move existing chat history to Supabase
3. **Add progress tracking** - Visualize student learning progress
4. **Implement rate limiting** - Protect against abuse
5. **Add payment integration** - M-Pesa and Stripe for subscriptions

See `TECHDISRUPT_YC_TASKS.md` for the full roadmap.

---

## Support

- **Documentation**: See `docs/` folder
- **Issues**: Open a GitHub issue
- **Questions**: Contact the team

**Happy building! 🚀**
