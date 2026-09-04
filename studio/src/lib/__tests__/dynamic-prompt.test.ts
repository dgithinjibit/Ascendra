/**
 * Tests for buildDynamicSystemPrompt() and buildLearningState()
 *
 * Source: lib/subject-session.ts
 * Run: npx vitest run src/lib/__tests__/dynamic-prompt.test.ts
 */

import { describe, it, expect } from 'vitest';
import { buildDynamicSystemPrompt, buildLearningState } from '../subject-session';
import type { LearningState } from '../subject-session';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const baseDecision = {
  scaffolding: 'Guided' as const,
  hint: 'What do you notice first?',
  nextAction: 'ask_guiding_question',
};

const baseParams = {
  decision: baseDecision,
  subject: 'mathematics',
  grade: 'grade-4',
  language: 'english' as const,
  studentName: 'Jane',
  learnerContext: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// buildLearningState
// ─────────────────────────────────────────────────────────────────────────────

describe('buildLearningState', () => {
  it('returns zeroed state when masteryRow is null', () => {
    const state: LearningState = buildLearningState(null);
    expect(state.attempts).toBe(0);
    expect(state.correctAttempts).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.frustrationSignal).toBe(false);
  });

  it('returns zeroed state when masteryRow is undefined', () => {
    const state: LearningState = buildLearningState(undefined);
    expect(state.attempts).toBe(0);
    expect(state.correctAttempts).toBe(0);
  });

  it('maps questions_answered to attempts', () => {
    const state = buildLearningState({
      questions_answered: 15,
      correct_answers: 10,
      mastery_level: 'developing',
    });
    expect(state.attempts).toBe(15);
    expect(state.correctAttempts).toBe(10);
  });

  it('handles null field values gracefully', () => {
    const state = buildLearningState({
      questions_answered: null,
      correct_answers: null,
      mastery_level: null,
    });
    expect(state.attempts).toBe(0);
    expect(state.correctAttempts).toBe(0);
    expect(state.frustrationSignal).toBe(false);
  });

  it('sets frustrationSignal when mastery_level is not_started and attempts > 3', () => {
    const state = buildLearningState({
      questions_answered: 4,
      correct_answers: 0,
      mastery_level: 'not_started',
    });
    expect(state.frustrationSignal).toBe(true);
  });

  it('does NOT set frustrationSignal when not_started but attempts <= 3', () => {
    const state = buildLearningState({
      questions_answered: 3,
      correct_answers: 0,
      mastery_level: 'not_started',
    });
    expect(state.frustrationSignal).toBe(false);
  });

  it('does NOT set frustrationSignal for other mastery levels even with many attempts', () => {
    const state = buildLearningState({
      questions_answered: 20,
      correct_answers: 5,
      mastery_level: 'developing',
    });
    expect(state.frustrationSignal).toBe(false);
  });

  it('hintsUsed is always 0 (not stored in mastery row)', () => {
    const state = buildLearningState({
      questions_answered: 10,
      correct_answers: 8,
      mastery_level: 'proficient',
    });
    expect(state.hintsUsed).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildDynamicSystemPrompt — structure
// ─────────────────────────────────────────────────────────────────────────────

describe('buildDynamicSystemPrompt — structure', () => {
  it('returns a non-empty string', () => {
    const prompt = buildDynamicSystemPrompt(baseParams);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('includes the student name', () => {
    const prompt = buildDynamicSystemPrompt(baseParams);
    expect(prompt).toContain('Jane');
  });

  it('includes the subject', () => {
    const prompt = buildDynamicSystemPrompt(baseParams);
    expect(prompt.toLowerCase()).toContain('mathematics');
  });

  it('includes the grade', () => {
    const prompt = buildDynamicSystemPrompt(baseParams);
    expect(prompt).toContain('grade-4');
  });

  it('includes the scaffolding level name', () => {
    const prompt = buildDynamicSystemPrompt(baseParams);
    expect(prompt).toContain('Guided');
  });

  it('includes the hint from the decision', () => {
    const prompt = buildDynamicSystemPrompt(baseParams);
    expect(prompt).toContain('What do you notice first?');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildDynamicSystemPrompt — scaffolding instructions
// ─────────────────────────────────────────────────────────────────────────────

describe('buildDynamicSystemPrompt — scaffolding instructions', () => {
  it('Independent: contains instruction not to give the answer', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      decision: { scaffolding: 'Independent', hint: 'Try it yourself.', nextAction: 'present_next_challenge' },
    });
    expect(prompt).toContain('Do NOT give the answer');
  });

  it('Guided: contains one-question-per-turn instruction', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      decision: { scaffolding: 'Guided', hint: 'Look at the first step.', nextAction: 'ask_guiding_question' },
    });
    expect(prompt).toContain('ONE guiding question per turn');
  });

  it('Intensive: contains smallest-step instruction', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      decision: { scaffolding: 'Intensive', hint: 'Start with what you know.', nextAction: 'show_conceptual_example' },
    });
    expect(prompt).toContain('smallest possible step');
  });

  it('Intensive: contains Kenyan examples reference', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      decision: { scaffolding: 'Intensive', hint: 'Let us try together.', nextAction: 'show_conceptual_example' },
    });
    expect(prompt).toContain('Kenyan');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildDynamicSystemPrompt — learner context
// ─────────────────────────────────────────────────────────────────────────────

describe('buildDynamicSystemPrompt — learner context', () => {
  it('includes competency name when provided', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      learnerContext: {
        currentCompetency: 'fractions',
        masteryLevel: 'developing',
        progressPercentage: 60,
      },
    });
    expect(prompt).toContain('fractions');
  });

  it('includes mastery level when provided', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      learnerContext: {
        currentCompetency: 'fractions',
        masteryLevel: 'developing',
        progressPercentage: 60,
      },
    });
    expect(prompt).toContain('developing');
  });

  it('does not crash when learnerContext is empty', () => {
    expect(() =>
      buildDynamicSystemPrompt({ ...baseParams, learnerContext: {} })
    ).not.toThrow();
  });

  it('omits competency line when learnerContext has no currentCompetency', () => {
    const prompt = buildDynamicSystemPrompt({
      ...baseParams,
      learnerContext: {},
    });
    // Should not contain "mastery:" without a competency context
    expect(prompt).not.toContain('mastery:');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildDynamicSystemPrompt — language
// ─────────────────────────────────────────────────────────────────────────────

describe('buildDynamicSystemPrompt — language', () => {
  it('includes the language in the prompt', () => {
    const prompt = buildDynamicSystemPrompt({ ...baseParams, language: 'kiswahili' });
    expect(prompt).toContain('kiswahili');
  });

  it('includes mixed language reference', () => {
    const prompt = buildDynamicSystemPrompt({ ...baseParams, language: 'mixed' });
    expect(prompt).toContain('mixed');
  });

  it('handles student name being undefined without crashing', () => {
    const { studentName: _, ...rest } = baseParams;
    expect(() => buildDynamicSystemPrompt(rest)).not.toThrow();
  });
});
