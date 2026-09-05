import { describe, expect, it } from 'vitest';
import { getJourneyStepAfterGrade } from '../student-journey';

describe('student journey grade transition', () => {
  const coveredGrades = new Set(['Grade 1', 'Grade 2', 'Grade 3']);

  it('advances a covered grade to subject selection', () => {
    expect(getJourneyStepAfterGrade('Grade 2', coveredGrades)).toBe('subject');
  });

  it('keeps an unsupported grade on the grade step', () => {
    expect(getJourneyStepAfterGrade('Grade 10', coveredGrades)).toBe('grade');
  });
});
