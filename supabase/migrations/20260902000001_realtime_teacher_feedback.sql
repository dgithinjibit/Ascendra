-- ============================================================================
-- REAL-TIME TEACHER-STUDENT FEEDBACK SYSTEM
-- Enable instant communication between teacher dashboard and student interface
-- ============================================================================

-- Create teacher_student_feedback table for real-time messaging
CREATE TABLE IF NOT EXISTS teacher_student_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message details
  type TEXT NOT NULL CHECK (type IN ('encouragement', 'intervention', 'hint', 'redirect', 'celebration')),
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Context
  activity_id TEXT,
  subject TEXT,
  grade TEXT DEFAULT 'Grade 2',
  
  -- Metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}',
  -- Example metadata structure:
  -- {
  --   "competency": "MATH.G2.NUMBERS.COUNT",
  --   "misconception": "counting by tens instead of ones", 
  --   "suggestedAction": "provide concrete manipulatives",
  --   "relatedResources": ["counting-blocks", "number-line"],
  --   "student_response": "I understand now!"
  -- }
  
  -- Status tracking
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT fk_teacher_feedback_teacher FOREIGN KEY (teacher_id) REFERENCES auth.users(id),
  CONSTRAINT fk_teacher_feedback_student FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_student_feedback_teacher ON teacher_student_feedback(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_feedback_student ON teacher_student_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_feedback_created_at ON teacher_student_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_student_feedback_priority ON teacher_student_feedback(priority) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_student_feedback_unread ON teacher_student_feedback(student_id) WHERE read_at IS NULL;

-- Enable Row Level Security
ALTER TABLE teacher_student_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_student_feedback
CREATE POLICY "Teachers can view feedback they sent" ON teacher_student_feedback
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view feedback sent to them" ON teacher_student_feedback  
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can insert feedback to their students" ON teacher_student_feedback
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can update their own feedback (mark as read/respond)" ON teacher_student_feedback
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can update feedback they sent" ON teacher_student_feedback
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Service role has full access for system operations
CREATE POLICY "Service role full access on teacher_student_feedback" ON teacher_student_feedback
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Enable real-time for instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_student_feedback;

-- ============================================================================
-- ENHANCED STUDENT SESSIONS TABLE FOR REAL-TIME PROGRESS
-- Add fields for better real-time monitoring
-- ============================================================================

-- Add columns to existing student_sessions table (if they don't exist)
DO $$ 
BEGIN
  -- Add competency tracking columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'student_sessions' AND column_name = 'competency_level') THEN
    ALTER TABLE student_sessions ADD COLUMN competency_level INTEGER CHECK (competency_level >= 0 AND competency_level <= 4);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'student_sessions' AND column_name = 'struggling_with') THEN
    ALTER TABLE student_sessions ADD COLUMN struggling_with TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'student_sessions' AND column_name = 'attention_level') THEN
    ALTER TABLE student_sessions ADD COLUMN attention_level TEXT DEFAULT 'focused' 
      CHECK (attention_level IN ('focused', 'distracted', 'needs_help', 'idle'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'student_sessions' AND column_name = 'last_interaction') THEN
    ALTER TABLE student_sessions ADD COLUMN last_interaction TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Ensure student_sessions has real-time enabled
ALTER PUBLICATION supabase_realtime ADD TABLE student_sessions;

-- ============================================================================
-- FUNCTIONS FOR AUTOMATED INTERVENTION ALERTS
-- ============================================================================

-- Function to detect struggling students and auto-generate teacher alerts
CREATE OR REPLACE FUNCTION detect_struggling_students()
RETURNS TRIGGER AS $$
BEGIN
  -- If student is struggling (competency level < 2 or explicit struggle indicator)
  IF (NEW.competency_level IS NOT NULL AND NEW.competency_level < 2) OR 
     (NEW.struggling_with IS NOT NULL AND NEW.struggling_with != '') THEN
    
    -- Auto-generate intervention alert for teacher
    INSERT INTO teacher_student_feedback (
      teacher_id,
      student_id,
      type,
      message,
      priority,
      activity_id,
      subject,
      grade,
      metadata
    )
    SELECT 
      tsa.teacher_id,
      NEW.student_id,
      'intervention',
      'Student may need help with ' || COALESCE(NEW.struggling_with, 'current activity'),
      'high',
      NEW.activity_id,
      NEW.subject,
      NEW.grade,
      jsonb_build_object(
        'auto_generated', true,
        'competency_level', NEW.competency_level,
        'struggling_with', NEW.struggling_with,
        'suggested_action', 'Provide additional scaffolding or redirect to easier activity',
        'session_duration', EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) / 60
      )
    FROM teacher_student_assignments tsa
    JOIN students s ON s.user_id = NEW.student_id  
    WHERE tsa.student_id = s.id 
      AND tsa.status = 'active'
    ON CONFLICT DO NOTHING; -- Avoid duplicate alerts
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-detect struggling students
DROP TRIGGER IF EXISTS trigger_detect_struggling_students ON student_sessions;
CREATE TRIGGER trigger_detect_struggling_students
  AFTER UPDATE OF competency_level, struggling_with ON student_sessions
  FOR EACH ROW
  EXECUTE FUNCTION detect_struggling_students();

-- ============================================================================
-- FUNCTION TO GET CLASSROOM LIVE STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_classroom_live_status(p_teacher_id UUID, p_class_name TEXT DEFAULT 'Grade 2A')
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  current_activity TEXT,
  activity_id TEXT,
  subject TEXT,
  progress INTEGER,
  competency_level INTEGER,
  struggling_with TEXT,
  attention_level TEXT,
  time_spent_minutes INTEGER,
  status TEXT,
  last_seen TIMESTAMPTZ,
  unread_feedback_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.student_id,
    COALESCE(p.full_name, s.student_name, 'Student') as student_name,
    ss.activity_data->>'activity_name' as current_activity,
    ss.activity_id,
    ss.subject,
    COALESCE(ss.progress, 0) as progress,
    ss.competency_level,
    ss.struggling_with,
    COALESCE(ss.attention_level, 'focused') as attention_level,
    COALESCE(EXTRACT(EPOCH FROM (NOW() - ss.started_at))::INTEGER / 60, 0) as time_spent_minutes,
    CASE 
      WHEN ss.struggling_with IS NOT NULL THEN 'struggling'
      WHEN ss.competency_level >= 3 THEN 'excelling'
      WHEN ss.progress >= 80 THEN 'completing'
      WHEN ss.last_interaction < NOW() - INTERVAL '5 minutes' THEN 'idle'
      ELSE 'active'
    END as status,
    COALESCE(ss.last_interaction, ss.updated_at) as last_seen,
    COALESCE(
      (SELECT COUNT(*) FROM teacher_student_feedback tsf 
       WHERE tsf.student_id = ss.student_id AND tsf.read_at IS NULL), 0
    ) as unread_feedback_count
  FROM student_sessions ss
  JOIN teacher_student_assignments tsa ON tsa.student_id = (
    SELECT id FROM students WHERE user_id = ss.student_id LIMIT 1
  )
  LEFT JOIN students s ON s.user_id = ss.student_id
  LEFT JOIN profiles p ON p.id = ss.student_id
  WHERE tsa.teacher_id = p_teacher_id
    AND tsa.class_name = p_class_name
    AND tsa.status = 'active'
    AND ss.status IN ('active', 'in_progress')
    AND ss.updated_at > NOW() - INTERVAL '1 hour' -- Only recent sessions
  ORDER BY ss.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_classroom_live_status(UUID, TEXT) TO authenticated;

-- ============================================================================
-- UPDATE TRIGGERS FOR REAL-TIME SYNC
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_realtime_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_interaction = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for student_sessions updates
DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON student_sessions;
CREATE TRIGGER trigger_update_session_timestamp
  BEFORE UPDATE ON student_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_realtime_timestamp();

-- Trigger for teacher_student_feedback updates  
DROP TRIGGER IF EXISTS trigger_update_feedback_timestamp ON teacher_student_feedback;
CREATE TRIGGER trigger_update_feedback_timestamp
  BEFORE UPDATE ON teacher_student_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_feedback_updated_at();

-- ============================================================================
-- SAMPLE DATA FOR DEMO
-- ============================================================================

-- Insert sample feedback for demo (only if demo users exist)
DO $$
DECLARE
  demo_teacher_id UUID;
  demo_student_id UUID;
BEGIN
  -- Get demo user IDs
  SELECT id INTO demo_teacher_id FROM auth.users WHERE email = 'teacher01@syncsenta.dev' LIMIT 1;
  SELECT id INTO demo_student_id FROM auth.users WHERE email = 'student01@syncsenta.dev' LIMIT 1;
  
  -- Insert sample feedback if both users exist
  IF demo_teacher_id IS NOT NULL AND demo_student_id IS NOT NULL THEN
    INSERT INTO teacher_student_feedback (
      teacher_id, student_id, type, message, priority, activity_id, subject, grade, metadata
    ) VALUES 
    (
      demo_teacher_id,
      demo_student_id, 
      'encouragement',
      'Great job counting to 10! You''re doing amazing work! 🌟',
      'medium',
      'g2-math-number-garden-1',
      'mathematics',
      'Grade 2',
      '{"competency": "MATH.G2.NUMBERS.COUNT", "achievement": "counted_to_10"}'
    ),
    (
      demo_teacher_id,
      demo_student_id,
      'hint', 
      'Try using your fingers to help count the flowers! 👆',
      'medium',
      'g2-math-number-garden-1',
      'mathematics', 
      'Grade 2',
      '{"competency": "MATH.G2.NUMBERS.COUNT", "suggested_strategy": "finger_counting"}'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE teacher_student_feedback IS 'Real-time messaging system for teacher-student communication during learning activities';
COMMENT ON FUNCTION detect_struggling_students() IS 'Auto-generates intervention alerts when students show signs of struggle';
COMMENT ON FUNCTION get_classroom_live_status(UUID, TEXT) IS 'Returns live classroom status for teacher dashboard monitoring';