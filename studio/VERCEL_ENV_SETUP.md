# Vercel Environment Variables Setup

## Required: Supabase Credentials

Your demo buttons are failing because Vercel doesn't have the Supabase connection details.

### 1. Get your Supabase credentials

Visit: https://app.supabase.com/project/_/settings/api

You'll see:
- **Project URL** (starts with `https://`)
- **anon public** key (safe to expose)
- **service_role** key (server-only, secret!)

### 2. Set them in Vercel

**Option A: Via Vercel Dashboard**

1. Go to: https://vercel.com/dans-projects-5f474b51/sentastudio/settings/environment-variables
2. Add three variables:

```
NEXT_PUBLIC_SUPABASE_URL = <your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon-key>
SUPABASE_SERVICE_ROLE_KEY = <service-role-key>
```

3. Click "Save" for each
4. Redeploy: `vercel --prod` or trigger a new commit

**Option B: Via Vercel CLI** (faster)

```powershell
# From studio/ directory
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste service role key

# Redeploy
vercel --prod
```

### 3. Test locally first (optional)

Create `studio/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run `npm run dev` and test the demo buttons at http://localhost:3000/auth/signup

---

## After Setting Env Vars

The demo login buttons will work:
- **🎒 Join as Student** → student01@syncsenta.dev
- **📚 Join as Teacher** → teacher01@syncsenta.dev
- **👨‍👩‍👧 Join as Parent** → parent01@syncsenta.dev
- **🏫 Join as Head** → head01@syncsenta.dev

All use the password format: `Demo@<Role>01`
