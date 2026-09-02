# Google OAuth Setup Guide for SyncSenta
**Step-by-Step Instructions**

## Overview
Google Cloud Console is a web platform (like Vercel) where you configure OAuth credentials. You'll access it through your browser at https://console.cloud.google.com

---

## Step 1: Access Google Cloud Console

### Option A: If You Already Have a Google Cloud Project
1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Check the project dropdown (top left, next to "Google Cloud")
4. Look for an existing project related to "Ascendra" or "SyncSenta"

### Option B: If You Need to Create a New Project
1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Click the project dropdown (top left)
4. Click **"NEW PROJECT"**
5. Enter details:
   - **Project name**: `SyncSenta-OAuth` or `Ascendra-Production`
   - **Organization**: (optional) Select if you have one
6. Click **"CREATE"**
7. Wait for the project to be created (takes ~30 seconds)

---

## Step 2: Enable Required APIs

1. In Google Cloud Console, make sure your project is selected
2. Go to **APIs & Services → Library** (left sidebar)
3. Search for "Google+ API" or "People API"
4. Click on it and click **"ENABLE"**
5. Wait for it to enable (~10 seconds)

---

## Step 3: Configure OAuth Consent Screen

This is what users see when they click "Sign in with Google"

### 3.1: Start Configuration
1. Go to **APIs & Services → OAuth consent screen** (left sidebar)
2. Choose **External** (for public access)
3. Click **"CREATE"**

### 3.2: Fill App Information
**Page 1: OAuth consent screen**

| Field | Value |
|-------|-------|
| App name | `SyncSenta` |
| User support email | Your email (e.g., `support@syncsenta.com`) |
| App logo | (Optional) Upload your logo |
| Application home page | `https://sentastudio.vercel.app` |
| Application privacy policy | `https://sentastudio.vercel.app/privacy` |
| Application terms of service | `https://sentastudio.vercel.app/terms` |
| Authorized domains | Add: `vercel.app` and `supabase.co` |
| Developer contact email | Your email |

Click **"SAVE AND CONTINUE"**

**Page 2: Scopes**
1. Click **"ADD OR REMOVE SCOPES"**
2. Select these scopes:
   - ✅ `.../auth/userinfo.email` (See your email address)
   - ✅ `.../auth/userinfo.profile` (See your personal info)
   - ✅ `openid` (Associate you with your personal info)
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

**Page 3: Test users** (if app is in Testing mode)
- Add your email and any test users' emails
- Click **"SAVE AND CONTINUE"**

**Page 4: Summary**
- Review everything
- Click **"BACK TO DASHBOARD"**

### 3.3: Publish App (Important!)
1. Click **"PUBLISH APP"** button
2. Confirm the dialog
3. Status should change from "Testing" to "In Production"

**Why this matters**: In Testing mode, only listed test users can sign in. In Production mode, anyone with a Google account can sign in.

---

## Step 4: Create OAuth Client ID

### 4.1: Start Creation
1. Go to **APIs & Services → Credentials** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** (top)
3. Select **"OAuth client ID"**

### 4.2: Configure Client
**Application type**: Select **Web application**

**Name**: `SyncSenta Web Client`

**Authorized JavaScript origins** - Add ALL of these:
```
https://sentastudio.vercel.app
https://ascendra-u1eu.vercel.app
http://localhost:3000
```

**Authorized redirect URIs** - Add ALL of these (VERY IMPORTANT):
```
https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback
https://sentastudio.vercel.app/auth/callback
https://ascendra-u1eu.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

⚠️ **IMPORTANT**: Replace `[YOUR-SUPABASE-PROJECT-ID]` with your actual Supabase project reference (e.g., `abcdefghijk.supabase.co`)

Click **"CREATE"**

### 4.3: Save Credentials
A popup will appear with your credentials:

**Client ID**: Something like `123456789-abc123def456.apps.googleusercontent.com`
**Client Secret**: Something like `GOCSPX-abc123def456ghi789`

📋 **COPY BOTH** - You'll need them in the next step!

❌ **DO NOT COMMIT THESE TO GIT**

---

## Step 5: Configure Supabase

Now we connect Google OAuth to your Supabase project.

### 5.1: Find Your Supabase Project ID
You need this for the redirect URI in step 4.2 above.

**Check these files for the Supabase URL**:
```bash
# Look in your .env file or Vercel environment variables
# It looks like: https://abcdefghijk.supabase.co
```

Or run:
```bash
cat studio/.env.local | grep SUPABASE_URL
```

### 5.2: Configure in Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your **Ascendra/SyncSenta** project
3. Go to **Authentication → Providers** (left sidebar)
4. Find **Google** in the list
5. Click to expand it
6. Toggle **"Enable Sign in with Google"** to ON
7. Fill in the credentials:
   - **Client ID**: Paste from Step 4.3
   - **Client Secret**: Paste from Step 4.3
8. Scroll down and review **"Redirect URL"**:
   - It should show: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
   - 📋 **COPY THIS URL** - You need it for Google Console (see Step 4.2)
9. Click **"SAVE"**

---

## Step 6: Update Google Console with Supabase Redirect URL

**Why**: You need to add the Supabase callback URL to Google Console

1. Go back to https://console.cloud.google.com
2. Go to **APIs & Services → Credentials**
3. Click on your OAuth client (created in Step 4)
4. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
5. Paste the Supabase redirect URL from Step 5.2:
   ```
   https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
   ```
6. Click **"SAVE"**

---

## Step 7: Test the Setup

### 7.1: Local Testing
1. Make sure your `.env.local` has Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

2. Start the dev server:
   ```bash
   cd studio
   npm run dev
   ```

3. Open http://localhost:3000/auth/signup
4. Click "Continue with Google"
5. You should see Google's consent screen
6. Sign in and authorize
7. You should be redirected to the onboarding page

### 7.2: Production Testing
1. Go to https://sentastudio.vercel.app/auth/signup
2. Click "Continue with Google"
3. Verify the flow works end-to-end

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Problem**: The redirect URI in your request doesn't match what's in Google Console

**Solution**:
1. Check the error message for the actual redirect URI being used
2. Go to Google Console → Credentials → Your OAuth Client
3. Add that exact URI to "Authorized redirect URIs"
4. Wait 5 minutes for changes to propagate

### Error: "Access blocked: This app's request is invalid"
**Problem**: OAuth consent screen not configured properly

**Solution**:
1. Go to Google Console → OAuth consent screen
2. Make sure status is "In Production" (not "Testing")
3. Make sure all required fields are filled
4. Make sure scopes are added (email, profile, openid)

### Error: "This app isn't verified"
**Warning**: This appears for apps in Testing mode or newly published apps

**Solution**:
1. For testing: Click "Advanced" → "Go to [App Name] (unsafe)"
2. For production: Submit app for verification (takes 1-2 weeks) OR keep using the warning screen (it's safe for your own app)

### Google Sign-in Button Doesn't Work
**Problem**: Environment variables not set or Supabase credentials wrong

**Solution**:
```bash
# Check your environment variables
cd studio
cat .env.local

# Verify these are set:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# Check browser console (F12) for errors
# Look for messages about Supabase or OAuth
```

### Users Stuck on Onboarding Page
**Problem**: Profile creation failing

**Solution**:
1. Check Supabase logs for errors
2. Verify service role key is correct in Vercel
3. Check that `profiles` and `students` tables exist
4. Verify RLS policies allow service role to insert

---

## Verification Checklist

After setup, verify each step:

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured and published
- [ ] OAuth client ID created
- [ ] All redirect URIs added (Supabase + Vercel + localhost)
- [ ] Client ID and Secret copied
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret pasted in Supabase
- [ ] Supabase redirect URL added to Google Console
- [ ] Local test successful (http://localhost:3000/auth/signup)
- [ ] Production test successful (https://sentastudio.vercel.app/auth/signup)
- [ ] New user appears in Supabase Authentication → Users
- [ ] Profile record created in `profiles` table
- [ ] Student record created in `students` table (for student role)

---

## Quick Reference

### Important URLs
- **Google Cloud Console**: https://console.cloud.google.com
- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Production Sign-up**: https://sentastudio.vercel.app/auth/signup

### Redirect URI Format
```
Supabase: https://[PROJECT-ID].supabase.co/auth/v1/callback
Vercel 1: https://sentastudio.vercel.app/auth/callback
Vercel 2: https://ascendra-u1eu.vercel.app/auth/callback
Local:    http://localhost:3000/auth/callback
```

### Required Scopes
- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

---

## Security Best Practices

1. ✅ **Never commit secrets to Git**
   - Client Secret should be in `.env.local` (in `.gitignore`)
   - Service role key only in Vercel environment variables

2. ✅ **Use different OAuth clients for environments**
   - Development: One OAuth client (includes localhost)
   - Production: Separate OAuth client (only production domains)

3. ✅ **Rotate secrets periodically**
   - Every 90 days, create new Client Secret
   - Update in Supabase
   - Delete old secret after verifying new one works

4. ✅ **Monitor usage**
   - Check Google Cloud Console → APIs & Services → Dashboard
   - Look for unusual spikes in OAuth requests
   - Set up billing alerts

---

## Next Steps After Setup

Once Google OAuth is working:

1. **Add More Providers** (Optional)
   - GitHub OAuth (popular with developers)
   - Microsoft OAuth (for school accounts)
   - Apple Sign In (for iOS users)

2. **Improve Onboarding**
   - Add progress indicators
   - Allow skipping optional fields
   - Save draft progress

3. **Add Email Verification**
   - Send confirmation emails
   - Verify email before full access
   - Add email change flow

4. **Implement Password for Google Users**
   - Create `/auth/set-password` page
   - Allow Google users to set a password
   - Enable email/password sign-in as backup

---

**Setup Guide Version**: 1.0  
**Last Updated**: September 2, 2026  
**Maintained By**: SyncSenta Development Team
