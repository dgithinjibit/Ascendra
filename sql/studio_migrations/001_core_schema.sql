-- ═══════════════════════════════════════════════════════════════════════════
-- SYNCSENTA - CORE PRODUCTION SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: User authentication, student data, conversation history, progress tracking
-- Run in Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- USERS & AUTHENTICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  
  -- Role
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
  
  -- Student-specific
  grade TEXT, -- 'Grade 1', 'Grade 2', ..., 'Grade 9'
  school_name TEXT,
  student_id TEXT, -- School-assigned ID
  date_of_birth DATE,
  
  -- Teacher-specific
  subjects TEXT[], -- ['Mathematics', 'Science']
  classes TEXT[], -- ['Grade 4A', 'Grade 5B']
  
  -- Parent-specific
  children_ids UUID[], -- Array of student profile IDs
  
  -- Preferences
  language_preference TEXT DEFAULT 'mixed' CHECK (language_preference IN ('english', 'kiswahili', 'mixed')),
  region TEXT, -- 'nairobi', 'mombasa', 'kisumu', 'rural'
  timezone TEXT DEFAULT 'Africa/Nairobi',
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'school')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON profiles(grade);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Teachers can view their students' profiles
CREATE POLICY "Teachers can view student profiles"
  ON profiles FOR SELECT
  USING (
    role = 'student' AND
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
        AND teacher.role = 'teacher'
        AND profiles.grade = ANY(teacher.classes)
    )
  );

-- Parents can view their children's profiles
CREATE POLICY "Parents can view children profiles"
  ON profiles FOR SELECT
  USING (
    role = 'student' AND
    EXISTS (
      SELECT 1 FROM profiles parent
      WHERE parent.id = auth.uid()
        AND parent.role = 'parent'
        AND profiles.id = ANY(parent.children_ids)
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- CHAT SESSIONS & MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Session Details
  subject TEXT NOT NULL, -- 'Mathematics', 'Science', 'English', etc.
  grade TEXT NOT NULL,
  mode TEXT DEFAULT 'socratic' CHECK (mode IN ('socratic', 'compass', 'homework_help')),
  
  -- Context
  teacher_context TEXT, -- For compass mode
  learning_objective TEXT, -- What student is trying to learn
  
  -- Metadata
  title TEXT, -- Auto-generated or user-set
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_subject ON chat_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message Content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  tokens_used INTEGER,
  model TEXT, -- 'llama-3.3-70b-versatile', etc.
  latency_ms INTEGER, -- Response time
  
  -- Choices (for Socratic mode)
  choices TEXT[], -- Extracted [CHOICE: ...] options
  selected_choice TEXT, -- If user clicked a choice
  
  -- Feedback
  helpful BOOLEAN, -- User feedback: thumbs up/down
  feedback_comment TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- RLS Policies for Chat Sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student sessions"
  ON chat_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
        AND teacher.role = 'teacher'
        AND EXISTS (
          SELECT 1 FROM profiles student
          WHERE student.id = chat_sessions.user_id
            AND student.grade = ANY(teacher.classes)
        )
    )
  );

-- RLS Policies for Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
        AND teacher.role = 'teacher'
        AND EXISTS (
          SELECT 1 FROM profiles student
          WHERE student.id = chat_messages.user_id
            AND student.grade = ANY(teacher.classes)
        )
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- STUDENT PROGRESS & ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════

-- Learning Progress (competency-based tracking)
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  competency_code TEXT NOT NULL,
  competency_name TEXT NOT NULL,
  strand TEXT,
  questions_asked INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  mastery_level TEXT DEFAULT 'not_started',
  mastered_at TIMESTAMPTZ,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_subject ON learning_progress(subject);

-- Made with Bob
