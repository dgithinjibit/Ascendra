# Supabase Migrations

## Overview
This directory contains SQL migration files for the SyncSenta platform.

## Migration Files

### 001_core_schema.sql
**Purpose**: Core database schema for student learning platform
**Tables Created**:
- `profiles` - User profiles (students, teachers, admins)
- `chat_sessions` - Learning conversation sessions
- `chat_messages` - Individual messages in sessions
- `learning_progress` - Student progress tracking by competency
- `daily_activity` - Daily engagement and streak tracking
- `achievements` - Student achievements and badges
- `daily_quota` - Message quota management

**Functions**:
- `update_updated_at_column()` - Trigger function for timestamp updates
- `check_daily_quota()` - Verify user hasn't exceeded daily message limit
- `increment_daily_quota()` - Track message usage
- `get_user_stats()` - Retrieve comprehensive user statistics

### 002_teacher_dashboard.sql
**Purpose**: Teacher dashboard for real-time student monitoring
**Tables Created**:
- `teacher_students` - Teacher-student class assignments
- `teacher_interventions` - Teacher actions and messages to students
- `student_alerts` - Automated alerts for struggling/excelling students
- `class_performance` - Daily class performance snapshots

**Functions**:
- `get_teacher_students()` - Retrieve all students for a teacher with activity stats
- `get_teacher_alerts()` - Get active alerts for teacher's students
- `get_class_summary()` - Class-level performance metrics
- `create_student_alert()` - Generate new student alert

## Testing Instructions

### Before Running Migrations

1. **Backup your database** (if running on existing data)
2. **Verify environment**: Ensure you're connected to the correct Supabase project

### Running Migrations

Execute migrations in order in the Supabase SQL Editor:

1. **Run 001_core_schema.sql**
   - Copy entire file content
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Verify success message: "✅ Created X core tables for SyncSenta"

2. **Run 002_teacher_dashboard.sql**
   - Copy entire file content
   - Paste into Supabase SQL Editor
   - Click "Run"
   - Verify success message: "✅ Created X tables for Teacher Dashboard"

### Verification Queries

After running migrations, verify tables were created:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION';
```

### Testing Functions

```sql
-- Test get_user_stats (replace with actual user_id)
SELECT * FROM get_user_stats('00000000-0000-0000-0000-000000000000');

-- Test check_daily_quota (replace with actual user_id)
SELECT check_daily_quota('00000000-0000-0000-0000-000000000000');
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

### Core Tables
- **profiles**: Users can view/update their own profile
- **chat_sessions**: Users can manage their own sessions
- **chat_messages**: Users can view/create messages in their sessions
- **learning_progress**: Users can view their own progress
- **daily_activity**: Users can view their own activity
- **achievements**: Users can view their own achievements
- **daily_quota**: Users can view their own quota

### Teacher Tables
- **teacher_students**: Teachers can manage their assigned students
- **teacher_interventions**: Teachers can create interventions; students can view theirs
- **student_alerts**: Teachers can view/acknowledge alerts for their students
- **class_performance**: Teachers can view their class performance data

## Troubleshooting

### Common Errors

**Error: `relation "profiles" does not exist`**
- **Cause**: Running 002 before 001
- **Solution**: Run 001_core_schema.sql first

**Error: `syntax error at or near "$"`**
- **Cause**: Function delimiter syntax error
- **Solution**: Ensure all functions use `$$` (double dollar signs) as delimiters, not single `$`

**Error: `permission denied for table`**
- **Cause**: RLS policy blocking access
- **Solution**: Verify user authentication and RLS policies

### Rollback

To rollback migrations (⚠️ **DESTRUCTIVE** - will delete all data):

```sql
-- Drop teacher dashboard tables
DROP TABLE IF EXISTS class_performance CASCADE;
DROP TABLE IF EXISTS student_alerts CASCADE;
DROP TABLE IF EXISTS teacher_interventions CASCADE;
DROP TABLE IF EXISTS teacher_students CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS daily_quota CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS daily_activity CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_student_alert CASCADE;
DROP FUNCTION IF EXISTS get_class_summary CASCADE;
DROP FUNCTION IF EXISTS get_teacher_alerts CASCADE;
DROP FUNCTION IF EXISTS get_teacher_students CASCADE;
DROP FUNCTION IF EXISTS get_user_stats CASCADE;
DROP FUNCTION IF EXISTS increment_daily_quota CASCADE;
DROP FUNCTION IF EXISTS check_daily_quota CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## Next Steps

After successful migration:

1. ✅ Verify all tables created
2. ✅ Verify RLS policies active
3. ✅ Test functions with sample data
4. ✅ Update application environment variables
5. ✅ Deploy application to production

## Support

For issues or questions:
- Check Supabase logs in Dashboard → Database → Logs
- Review RLS policies in Dashboard → Authentication → Policies
- Test queries in SQL Editor with different user contexts
