/**
 * Subject Session Library
 *
 * Provides helpers for the subject-page flow:
 *   - SUBJECT_REGISTRY  — slug → display metadata
 *   - getSubjectXP      — XP + level for a subject from point_transactions
 *   - getOrCreateChatSession — find or open a chat session for a subject
 *   - buildLearningState     — construct LearningState from learning_progress
 *   - buildDynamicSystemPrompt — Omega-aware replacement for buildSocraticSystemPrompt
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TutoringDecision } from './omega-agent/metta-core';
import type { LearnerLearningContext } from './socratic-prompts';

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface SubjectMeta {
  label: string;
  /** 'chat'    → renders SubjectChat (blockchain, finlit, AI)
   *  'sandbox' → renders sandbox activity list (core CBC subjects) */
  layout: 'chat' | 'sandbox';
  xpPrefix: string;
}

export const SUBJECT_REGISTRY: Record<string, SubjectMeta> = {
  // Core CBC subjects (sandbox-first)
  mathematics:          { label: 'Mathematics',           layout: 'sandbox', xpPrefix: 'MATH.' },
  english:              { label: 'English',               layout: 'sandbox', xpPrefix: 'ENG.' },
  kiswahili:            { label: 'Kiswahili',             layout: 'sandbox', xpPrefix: 'KSW.' },
  environmental:        { label: 'Environmental',         layout: 'sandbox', xpPrefix: 'ENV.' },
  creative:             { label: 'Creative Arts',         layout: 'sandbox', xpPrefix: 'CRE.' },
  cre:                  { label: 'Religious Education',   layout: 'sandbox', xpPrefix: 'CRE2.' },
  indigenous:           { label: 'Indigenous Language',   layout: 'sandbox', xpPrefix: 'IND.' },
  // Extended courses (chat-first)
  blockchain:           { label: 'Blockchain',            layout: 'chat',    xpPrefix: 'blockchain.' },
  'financial-literacy': { label: 'Financial Literacy',    layout: 'chat',    xpPrefix: 'finlit.' },
  ai:                   { label: 'Artificial Intelligence', layout: 'chat',  xpPrefix: 'ai.' },
};

// ─────────────────────────────────────────────────────────────────────────────
// XP & Level
// ─────────────────────────────────────────────────────────────────────────────

const XP_THRESHOLDS = [0, 200, 500, 1000, 2000] as const;

export async function getSubjectXP(
  userId: string,
  subjectSlug: string,
): Promise<{ totalXP: number; level: number; nextLevelXP: number }> {
  // Import lazily so this module is safe to import in both server and browser.
  const { supabase } = await import('@/lib/supabase/client');

  const prefix = SUBJECT_REGISTRY[subjectSlug]?.xpPrefix ?? `${subjectSlug}.`;

  const { data } = await supabase
    .from('point_transactions')
    .select('total_points')
    .eq('user_id', userId)
    .like('competency_code', `${prefix}%`);

  const totalXP = (data ?? []).reduce(
    (sum: number, row: { total_points: number | null }) => sum + (row.total_points ?? 0),
    0,
  );

  const level =
    totalXP >= 2000 ? 5 :
    totalXP >= 1000 ? 4 :
    totalXP >= 500  ? 3 :
    totalXP >= 200  ? 2 : 1;

  const nextThreshold = XP_THRESHOLDS[level] ?? Infinity;
  const nextLevelXP = Math.max(0, nextThreshold - totalXP);

  return { totalXP, level, nextLevelXP };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat session
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrCreateChatSession(
  supabase: SupabaseClient,
  userId: string,
  subjectSlug: string,
  grade: string,
): Promise<{ sessionId: string; isNew: boolean }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('id, last_message_at')
    .eq('user_id', userId)
    .eq('subject', subjectSlug)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (existing && existing.last_message_at > thirtyDaysAgo) {
    return { sessionId: existing.id, isNew: false };
  }

  const { data: created, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      subject: subjectSlug,
      grade,
      mode: 'socratic',
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create chat session: ${error?.message ?? 'unknown error'}`);
  }

  return { sessionId: created.id, isNew: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Learning state
// ─────────────────────────────────────────────────────────────────────────────

export interface LearningState {
  attempts: number;
  correctAttempts: number;
  hintsUsed: number;
  frustrationSignal: boolean;
}

export function buildLearningState(masteryRow?: {
  questions_answered: number | null;
  correct_answers: number | null;
  mastery_level: string | null;
} | null): LearningState {
  const attempts = masteryRow?.questions_answered ?? 0;
  const correctAttempts = masteryRow?.correct_answers ?? 0;
  const frustrationSignal =
    masteryRow?.mastery_level === 'not_started' && attempts > 3;

  return { attempts, correctAttempts, hintsUsed: 0, frustrationSignal };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic system prompt
// ─────────────────────────────────────────────────────────────────────────────

const SCAFFOLDING_INSTRUCTIONS: Record<TutoringDecision['scaffolding'], string> = {
  Independent:
    'The student is performing well. Ask open-ended questions. ' +
    'Do NOT give the answer. Let them reason through it independently.',
  Guided:
    'Ask ONE guiding question per turn. ' +
    'Acknowledge what is correct before redirecting. ' +
    'Do not give the complete answer.',
  Intensive:
    'Break the concept into the smallest possible step. ' +
    'Present one step, check understanding, then move to the next. ' +
    'Use concrete Kenyan examples (matatus, shillings, everyday life).',
};

export function buildDynamicSystemPrompt(params: {
  decision: TutoringDecision;
  subject: string;
  grade: string;
  language: 'english' | 'kiswahili' | 'mixed';
  studentName?: string;
  learnerContext: LearnerLearningContext;
}): string {
  const { decision, subject, grade, language, studentName, learnerContext } = params;

  const lines = [
    `You are syncsenta, a patient Kenyan tutor for ${grade} students.`,
    `Subject: ${subject}. Language: ${language}.`,
    `Student: ${studentName ?? 'the student'}.`,
    `Scaffolding level: ${decision.scaffolding}.`,
    SCAFFOLDING_INSTRUCTIONS[decision.scaffolding],
    decision.hint,
    learnerContext.currentCompetency
      ? `Current competency: ${learnerContext.currentCompetency} ` +
        `(mastery: ${learnerContext.masteryLevel}, ` +
        `${learnerContext.progressPercentage}% correct).`
      : '',
    "Always respond in the student's language. " +
    'Mix Kiswahili and English naturally if language is "mixed".',
  ];

  return lines.filter(Boolean).join('\n');
}
