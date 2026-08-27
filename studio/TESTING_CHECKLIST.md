# Testing Checklist - SQL Migrations

## ✅ SQL Syntax Fixes Complete

All SQL function delimiters have been corrected:
- ✅ `001_core_schema.sql` - All functions use `$$` delimiters
- ✅ `002_teacher_dashboard.sql` - All functions use `$$` delimiters

## 🧪 Required Testing Steps

### Step 1: Test in Supabase SQL Editor

**CRITICAL**: Do NOT deploy to production until these migrations run successfully in Supabase.

#### 1.1 Run Core Schema Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy entire content of `studio/supabase/migrations/001_core_schema.sql`
3. Paste into SQL Editor
4. Click "Run"
5. **Expected Output**: `✅ Created X core tables for SyncSenta`
6. **If Error**: Check error message and fix before proceeding

#### 1.2 Run Teacher Dashboard Migration

1. In Supabase SQL Editor
2. Copy entire content of `studio/supabase/migrations/002_teacher_dashboard.sql`
3. Paste into SQL Editor
4. Click "Run"
5. **Expected Output**: `✅ Created X tables for Teacher Dashboard`
6. **If Error**: Check error message and fix before proceeding

### Step 2: Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
-- Check all tables exist
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Tables**:
- achievements
- chat_messages
- chat_sessions
- class_performance
- daily_activity
- daily_quota
- learning_progress
- profiles
- student_alerts
- teacher_interventions
- teacher_students

### Step 3: Verify RLS Enabled

Run this query:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: All tables should have `rowsecurity = true`

### Step 4: Verify Functions Created

Run this query:

```sql
-- Check all functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected Functions**:
- check_daily_quota
- create_student_alert
- get_class_summary
- get_teacher_alerts
- get_teacher_students
- get_user_stats
- increment_daily_quota
- update_updated_at_column

### Step 5: Test Functions (Optional but Recommended)

Create a test user and verify functions work:

```sql
-- Insert test profile
INSERT INTO profiles (id, email, full_name, role, grade)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'Test Student',
  'student',
  'Grade 4'
);

-- Test get_user_stats
SELECT * FROM get_user_stats('00000000-0000-0000-0000-000000000001');

-- Test check_daily_quota
SELECT check_daily_quota('00000000-0000-0000-0000-000000000001');

-- Clean up test data
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
```

## 🚀 Production Deployment Checklist

Only proceed after ALL tests pass:

- [ ] ✅ 001_core_schema.sql runs without errors
- [ ] ✅ 002_teacher_dashboard.sql runs without errors
- [ ] ✅ All 11 tables created
- [ ] ✅ RLS enabled on all tables
- [ ] ✅ All 8 functions created
- [ ] ✅ Test functions return expected results
- [ ] ✅ Supabase environment variables set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] ✅ Vercel build succeeds
- [ ] ✅ Application connects to Supabase successfully

## 🐛 Troubleshooting

### Error: "relation 'profiles' does not exist"
**Solution**: Run `001_core_schema.sql` before `002_teacher_dashboard.sql`

### Error: "syntax error at or near '$'"
**Solution**: This should be fixed now. If you still see this, check that functions use `$$` not `$` or `$$$`

### Error: "permission denied for table"
**Solution**: Check RLS policies and ensure user is authenticated

### Build fails with "Missing Supabase environment variables"
**Solution**: This is expected and correct behavior. Set the environment variables in Vercel before deploying.

## 📝 Notes

- The build-time check (`scripts/check-env.js`) will prevent deployment without Supabase credentials
- This is intentional - the app requires Supabase to function
- All database tables have RLS policies for security
- Functions use `SECURITY DEFINER` to bypass RLS where appropriate

## ✅ Ready to Deploy

Once all checkboxes above are complete, you can safely deploy to production.
