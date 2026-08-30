# Test Accounts Setup Guide

## Overview

Test accounts allow you and your team to quickly test different user roles without creating accounts each time.

**Test Account Pattern:** `{role}01@ascendra.test` with password `TestPassword123!`

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student01@ascendra.test | TestPassword123! |
| Teacher | teacher01@ascendra.test | TestPassword123! |
| Parent | parent01@ascendra.test | TestPassword123! |
| Admin | admin01@ascendra.test | TestPassword123! |

## Setup (One Time)

### 1. Set Environment Variables

Make sure these are set in your `.env.local` or `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fwlpvcwubiwaeagfcipe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service role key is needed to create accounts. Get it from:
- Supabase Dashboard → Settings → API → Service Role Key

### 2. Create Test Accounts

Run the seed script to create all test accounts in Supabase:

```bash
cd studio
npx ts-node scripts/seed-test-accounts.ts
```

**Output:**
```
🌱 Seeding test accounts...

✅ STUDENT: student01@ascendra.test
   Password: TestPassword123!

✅ TEACHER: teacher01@ascendra.test
   Password: TestPassword123!

✅ PARENT: parent01@ascendra.test
   Password: TestPassword123!

✅ ADMIN: admin01@ascendra.test
   Password: TestPassword123!

✨ Done! Test accounts are ready.
```

## Using Test Accounts

### Quick Login (Recommended)

1. Go to `/auth/signin`
2. Scroll down to **"🧪 Quick Test Login"** section
3. Click any button:
   - "Continue as student01"
   - "Continue as teacher01"
   - "Continue as parent01"
   - "Continue as admin01"

This automatically logs you in without entering credentials.

### Manual Login

1. Go to `/auth/signin`
2. Enter email: `student01@ascendra.test` (or any test role)
3. Enter password: `TestPassword123!`
4. Click "Sign In"

## Testing Each Role

After logging in with a test account, you'll be directed to the appropriate dashboard:

- **Student** → `/student` (learner dashboard)
- **Teacher** → `/dashboard` (teacher dashboard)
- **Parent** → `/parent` (parent dashboard)
- **Admin** → `/head` or `/dashboard` (admin dashboard)

## Development Notes

- ✅ Quick login buttons only appear on the signin page
- ✅ All test accounts have `.test` domain suffix for easy identification
- ✅ Safe to share with team members since they're just test data
- ✅ Can be deleted/reset anytime by running the seed script again
- ⚠️ Do NOT use for production accounts

## Resetting Test Accounts

If you want to reset a test account's data:

1. Delete the account from Supabase Dashboard
2. Run the seed script again: `npx ts-node scripts/seed-test-accounts.ts`

## Troubleshooting

**"Test accounts don't appear on signin page"**
- Make sure the quick login component is rendering in `/src/components/auth/sign-in-form.tsx`
- Check browser console for errors

**"Seed script fails with 'Missing environment variables'"**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure both URL and key are from the same Supabase project

**"Can't sign in with test account"**
- Verify the email/password match the table above
- Check if Supabase auth is configured correctly
- Try creating the account manually via seed script again
