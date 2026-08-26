/**
 * Supabase Database Types
 * 
 * Auto-generated types for type-safe database queries.
 * Regenerate with: npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type LegacyTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone_number: string | null;
          role: 'student' | 'teacher' | 'parent' | 'admin';
          grade: string | null;
          school_name: string | null;
          student_id: string | null;
          school_id: string | null;
          classroom_id: string | null;
          total_points: number;
          date_of_birth: string | null;
          subjects: string[] | null;
          classes: string[] | null;
          children_ids: string[] | null;
          language_preference: 'english' | 'kiswahili' | 'mixed';
          region: string | null;
          timezone: string;
          subscription_tier: 'free' | 'premium' | 'school';
          subscription_status: 'active' | 'cancelled' | 'expired' | 'trial';
          subscription_started_at: string | null;
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
          last_seen_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          role: 'student' | 'teacher' | 'parent' | 'admin';
          grade?: string | null;
          school_name?: string | null;
          student_id?: string | null;
          school_id?: string | null;
          classroom_id?: string | null;
          total_points?: number;
          date_of_birth?: string | null;
          subjects?: string[] | null;
          classes?: string[] | null;
          children_ids?: string[] | null;
          language_preference?: 'english' | 'kiswahili' | 'mixed';
          region?: string | null;
          timezone?: string;
          subscription_tier?: 'free' | 'premium' | 'school';
          subscription_status?: 'active' | 'cancelled' | 'expired' | 'trial';
          subscription_started_at?: string | null;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          role?: 'student' | 'teacher' | 'parent' | 'admin';
          grade?: string | null;
          school_name?: string | null;
          student_id?: string | null;
          school_id?: string | null;
          classroom_id?: string | null;
          total_points?: number;
          date_of_birth?: string | null;
          subjects?: string[] | null;
          classes?: string[] | null;
          children_ids?: string[] | null;
          language_preference?: 'english' | 'kiswahili' | 'mixed';
          region?: string | null;
          timezone?: string;
          subscription_tier?: 'free' | 'premium' | 'school';
          subscription_status?: 'active' | 'cancelled' | 'expired' | 'trial';
          subscription_started_at?: string | null;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          grade: string;
          mode: 'socratic' | 'compass' | 'homework_help';
          teacher_context: string | null;
          learning_objective: string | null;
          title: string | null;
          message_count: number;
          started_at: string;
          last_message_at: string;
          ended_at: string | null;
          status: 'active' | 'archived' | 'deleted';
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          grade: string;
          mode?: 'socratic' | 'compass' | 'homework_help';
          teacher_context?: string | null;
          learning_objective?: string | null;
          title?: string | null;
          message_count?: number;
          started_at?: string;
          last_message_at?: string;
          ended_at?: string | null;
          status?: 'active' | 'archived' | 'deleted';
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          grade?: string;
          mode?: 'socratic' | 'compass' | 'homework_help';
          teacher_context?: string | null;
          learning_objective?: string | null;
          title?: string | null;
          message_count?: number;
          started_at?: string;
          last_message_at?: string;
          ended_at?: string | null;
          status?: 'active' | 'archived' | 'deleted';
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          tokens_used: number | null;
          model: string | null;
          latency_ms: number | null;
          choices: string[] | null;
          selected_choice: string | null;
          helpful: boolean | null;
          feedback_comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          tokens_used?: number | null;
          model?: string | null;
          latency_ms?: number | null;
          choices?: string[] | null;
          selected_choice?: string | null;
          helpful?: boolean | null;
          feedback_comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          tokens_used?: number | null;
          model?: string | null;
          latency_ms?: number | null;
          choices?: string[] | null;
          selected_choice?: string | null;
          helpful?: boolean | null;
          feedback_comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          grade: string;
          competency_code: string;
          competency_name: string;
          strand: string | null;
          mastery_level: 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered';
          progress_percentage: number;
          questions_asked: number;
          questions_answered: number;
          correct_answers: number;
          time_spent_minutes: number;
          first_attempted_at: string;
          last_practiced_at: string;
          mastered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          grade: string;
          competency_code: string;
          competency_name: string;
          strand?: string | null;
          mastery_level?: 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered';
          progress_percentage?: number;
          questions_asked?: number;
          questions_answered?: number;
          correct_answers?: number;
          time_spent_minutes?: number;
          first_attempted_at?: string;
          last_practiced_at?: string;
          mastered_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          grade?: string;
          competency_code?: string;
          competency_name?: string;
          strand?: string | null;
          mastery_level?: 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered';
          progress_percentage?: number;
          questions_asked?: number;
          questions_answered?: number;
          correct_answers?: number;
          time_spent_minutes?: number;
          first_attempted_at?: string;
          last_practiced_at?: string;
          mastered_at?: string | null;
        };
        Relationships: [];
      };
      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          messages_sent: number;
          sessions_started: number;
          time_spent_minutes: number;
          subjects_practiced: string[] | null;
          daily_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date?: string;
          messages_sent?: number;
          sessions_started?: number;
          time_spent_minutes?: number;
          subjects_practiced?: string[] | null;
          daily_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_date?: string;
          messages_sent?: number;
          sessions_started?: number;
          time_spent_minutes?: number;
          subjects_practiced?: string[] | null;
          daily_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achievement_name: string;
          achievement_description: string | null;
          badge_icon: string | null;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
          achievement_name: string;
          achievement_description?: string | null;
          badge_icon?: string | null;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_type?: string;
          achievement_name?: string;
          achievement_description?: string | null;
          badge_icon?: string | null;
          earned_at?: string;
        };
        Relationships: [];
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string | null;
          endpoint: string;
          method: string;
          tokens_used: number | null;
          cost_usd: number | null;
          status_code: number | null;
          latency_ms: number | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          endpoint: string;
          method: string;
          tokens_used?: number | null;
          cost_usd?: number | null;
          status_code?: number | null;
          latency_ms?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          endpoint?: string;
          method?: string;
          tokens_used?: number | null;
          cost_usd?: number | null;
          status_code?: number | null;
          latency_ms?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_quotas: {
        Row: {
          id: string;
          user_id: string;
          quota_date: string;
          messages_used: number;
          messages_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quota_date?: string;
          messages_used?: number;
          messages_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quota_date?: string;
          messages_used?: number;
          messages_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_keys: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          secret_key: string;
          public_key: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          secret_key: string;
          public_key?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          name?: string;
          secret_key?: string;
          public_key?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_traces: {
        Row: {
          id: string;
          trace_id: string;
          agent_id: string;
          session_id: string | null;
          user_id: string | null;
          input: Json;
          prompt: string;
          model: string;
          output: Json;
          confidence: number | null;
          signed_hash: string;
          signature: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trace_id: string;
          agent_id: string;
          session_id?: string | null;
          user_id?: string | null;
          input: Json;
          prompt: string;
          model: string;
          output: Json;
          confidence?: number | null;
          signed_hash: string;
          signature: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trace_id?: string;
          agent_id?: string;
          session_id?: string | null;
          user_id?: string | null;
          input?: Json;
          prompt?: string;
          model?: string;
          output?: Json;
          confidence?: number | null;
          signed_hash?: string;
          signature?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_submissions: LegacyTable;
      ai_personalization_queue: LegacyTable;
      ai_recommendations: LegacyTable;
      batch_submissions: LegacyTable;
      camera_frames: LegacyTable;
      "esp32-uploads": LegacyTable;
      point_transactions: LegacyTable;
      referrals: LegacyTable;
      student_alerts: LegacyTable;
      teacher_feedback: LegacyTable;
      teacher_grade_assignments: LegacyTable;
      teacher_interventions: LegacyTable;
      teacher_notifications: LegacyTable;
      teacher_student_assignments: LegacyTable;
      teacher_students: LegacyTable;
      teacher_subject_assignments: LegacyTable;
      voice_conversations: LegacyTable;
      voice_messages: LegacyTable;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_daily_quota: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      increment_daily_quota: {
        Args: { p_user_id: string };
        Returns: void;
      };
      get_user_stats: {
        Args: { p_user_id: string };
        Returns: {
          total_sessions: number;
          total_messages: number;
          total_time_minutes: number;
          current_streak: number;
          competencies_mastered: number;
          achievements_earned: number;
        }[];
      };
      get_teacher_students: {
        Args: { p_teacher_id: string };
        Returns: Record<string, any>[];
      };
      get_teacher_alerts: {
        Args: { p_teacher_id: string; p_status?: string };
        Returns: Record<string, any>[];
      };
      get_class_summary: {
        Args: { p_teacher_id: string; p_class_name?: string };
        Returns: Record<string, any>[];
      };
      create_student_alert: {
        Args: Record<string, any>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
