/**
 * Tests for evaluateTutoringDecision()
 *
 * Source of truth: lib/omega-agent/metta-core.ts
 * Must stay in sync with Rust: rust-core/src/agent_runtime.rs (decide_tutoring)
 *
 * Run: npx vitest run src/lib/__tests__/omega-decision.test.ts
 */

import { describe, it, expect } from 'vitest';
import { evaluateTutoringDecision } from '../omega-agent/metta-core';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function state(
  attempts: number,
  correctAttempts: number,
  hintsUsed = 0,
  frustrationSignal = false,
) {
  return { attempts, correctAttempts, hintsUsed, frustrationSignal };
}

// ─────────────────────────────────────────────────────────────────────────────
// Intensive branch
// ─────────────────────────────────────────────────────────────────────────────

describe('Intensive scaffolding', () => {
  it('triggers when mastery is 0% (0/10)', () => {
    expect(evaluateTutoringDecision(state(10, 0)).scaffolding).toBe('Intensive');
  });

  it('triggers when mastery is 30% (3/10)', () => {
    expect(evaluateTutoringDecision(state(10, 3)).scaffolding).toBe('Intensive');
  });

  it('triggers when mastery is 39% (just below threshold)', () => {
    // 3/8 = 37.5% → rounds to 38
    expect(evaluateTutoringDecision(state(8, 3)).scaffolding).toBe('Intensive');
  });

  it('triggers when hintsUsed is exactly 2 (regardless of mastery)', () => {
    // 90% mastery but 2 hints → Intensive
    expect(evaluateTutoringDecision(state(10, 9, 2)).scaffolding).toBe('Intensive');
  });

  it('triggers when hintsUsed is 3 (regardless of mastery)', () => {
    expect(evaluateTutoringDecision(state(10, 10, 3)).scaffolding).toBe('Intensive');
  });

  it('triggers when frustrationSignal is true (regardless of mastery)', () => {
    // 100% mastery but frustrated
    expect(evaluateTutoringDecision(state(10, 10, 0, true)).scaffolding).toBe('Intensive');
  });

  it('frustration overrides even 100% mastery with 0 hints', () => {
    expect(evaluateTutoringDecision(state(20, 20, 0, true)).scaffolding).toBe('Intensive');
  });

  it('returns show_conceptual_example as nextAction', () => {
    expect(evaluateTutoringDecision(state(10, 2)).nextAction).toBe('show_conceptual_example');
  });

  it('returns a non-empty hint string', () => {
    const { hint } = evaluateTutoringDecision(state(10, 2));
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Guided branch
// ─────────────────────────────────────────────────────────────────────────────

describe('Guided scaffolding', () => {
  it('triggers when attempts is 0 (new student)', () => {
    expect(evaluateTutoringDecision(state(0, 0)).scaffolding).toBe('Guided');
  });

  it('triggers when mastery is exactly 40% (4/10)', () => {
    expect(evaluateTutoringDecision(state(10, 4)).scaffolding).toBe('Guided');
  });

  it('triggers when mastery is 60% (6/10)', () => {
    expect(evaluateTutoringDecision(state(10, 6)).scaffolding).toBe('Guided');
  });

  it('triggers when mastery is 79% (just below independent threshold)', () => {
    // 7/9 = 77.7% → rounds to 78
    expect(evaluateTutoringDecision(state(9, 7)).scaffolding).toBe('Guided');
  });

  it('returns ask_guiding_question as nextAction', () => {
    expect(evaluateTutoringDecision(state(10, 5)).nextAction).toBe('ask_guiding_question');
  });

  it('returns a non-empty hint string', () => {
    const { hint } = evaluateTutoringDecision(state(0, 0));
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });

  it('treats 1 hint used as Guided when mastery is in range', () => {
    // 1 hint < 2 threshold, mastery 60% → Guided
    expect(evaluateTutoringDecision(state(10, 6, 1)).scaffolding).toBe('Guided');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Independent branch
// ─────────────────────────────────────────────────────────────────────────────

describe('Independent scaffolding', () => {
  it('triggers when mastery is exactly 80% (8/10)', () => {
    expect(evaluateTutoringDecision(state(10, 8)).scaffolding).toBe('Independent');
  });

  it('triggers when mastery is 90% (9/10)', () => {
    expect(evaluateTutoringDecision(state(10, 9)).scaffolding).toBe('Independent');
  });

  it('triggers when mastery is 100% (10/10)', () => {
    expect(evaluateTutoringDecision(state(10, 10)).scaffolding).toBe('Independent');
  });

  it('triggers with large attempt counts at 80%+', () => {
    expect(evaluateTutoringDecision(state(100, 85)).scaffolding).toBe('Independent');
  });

  it('returns present_next_challenge as nextAction', () => {
    expect(evaluateTutoringDecision(state(10, 9)).nextAction).toBe('present_next_challenge');
  });

  it('returns a non-empty hint string', () => {
    const { hint } = evaluateTutoringDecision(state(10, 9));
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary conditions (exact threshold values)
// ─────────────────────────────────────────────────────────────────────────────

describe('Boundary conditions', () => {
  it('39% mastery → Intensive (below 40 threshold)', () => {
    // 39/100 = 39%
    expect(evaluateTutoringDecision(state(100, 39)).scaffolding).toBe('Intensive');
  });

  it('40% mastery → Guided (at lower threshold)', () => {
    expect(evaluateTutoringDecision(state(100, 40)).scaffolding).toBe('Guided');
  });

  it('79% mastery → Guided (below upper threshold)', () => {
    expect(evaluateTutoringDecision(state(100, 79)).scaffolding).toBe('Guided');
  });

  it('80% mastery → Independent (at upper threshold)', () => {
    expect(evaluateTutoringDecision(state(100, 80)).scaffolding).toBe('Independent');
  });

  it('hintsUsed = 1 → does NOT trigger Intensive by hints alone', () => {
    const result = evaluateTutoringDecision(state(10, 9, 1));
    expect(result.scaffolding).not.toBe('Intensive');
  });

  it('hintsUsed = 2 → triggers Intensive even at 90% mastery', () => {
    expect(evaluateTutoringDecision(state(10, 9, 2)).scaffolding).toBe('Intensive');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('0 attempts → Guided (not a division by zero crash)', () => {
    expect(() => evaluateTutoringDecision(state(0, 0))).not.toThrow();
    expect(evaluateTutoringDecision(state(0, 0)).scaffolding).toBe('Guided');
  });

  it('returns all three required fields on every branch', () => {
    const cases = [
      state(0, 0),       // Guided
      state(10, 2),      // Intensive
      state(10, 9),      // Independent
    ];
    for (const s of cases) {
      const d = evaluateTutoringDecision(s);
      expect(d).toHaveProperty('scaffolding');
      expect(d).toHaveProperty('hint');
      expect(d).toHaveProperty('nextAction');
    }
  });

  it('scaffolding value is always one of the three known levels', () => {
    const valid = ['Independent', 'Guided', 'Intensive'];
    const samples = [
      state(0, 0), state(10, 0), state(10, 4), state(10, 8),
      state(10, 9, 2), state(10, 10, 0, true),
    ];
    for (const s of samples) {
      expect(valid).toContain(evaluateTutoringDecision(s).scaffolding);
    }
  });

  it('hint and nextAction are always non-empty strings', () => {
    const samples = [
      state(0, 0), state(10, 3), state(10, 6), state(10, 9),
    ];
    for (const s of samples) {
      const d = evaluateTutoringDecision(s);
      expect(d.hint).toBeTruthy();
      expect(d.nextAction).toBeTruthy();
    }
  });
});
