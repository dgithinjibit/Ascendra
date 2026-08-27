import { describe, expect, it } from 'vitest';
import { buildReflectionEvidencePlan } from '../teacher-reflection-evidence';

const base = {
  teacherId: 'teacher-01',
  studentId: 'student-01',
  schoolName: 'SyncSenta Primary',
  subject: 'Mathematics',
  masteryPercent: 62,
  teacherSummary: 'Use a visual fraction example next.',
  nextStep: 'Practise two equivalent fractions.',
  parentLinked: true,
  parentConsent: true,
};

describe('teacher reflection evidence planner', () => {
  it('creates aggregate Head evidence and a consented Parent report', () => {
    const plan = buildReflectionEvidencePlan(base);
    expect(plan?.head).toMatchObject({ learnerCount: 1, band: 'developing', metric: 'mastery_percent' });
    expect(plan?.head.message).not.toContain('student-01');
    expect(plan?.parent).toMatchObject({ studentReference: 'student-01', masteryPercent: 62, band: 'developing' });
  });

  it('withholds Parent detail when the relationship or consent is absent', () => {
    expect(buildReflectionEvidencePlan({ ...base, parentLinked: false })?.parent).toBeNull();
    expect(buildReflectionEvidencePlan({ ...base, parentConsent: false })?.parent).toBeNull();
  });

  it('rejects invalid or out-of-range input without truncating it', () => {
    expect(buildReflectionEvidencePlan({ ...base, masteryPercent: 101 })).toBeNull();
    expect(buildReflectionEvidencePlan({ ...base, teacherSummary: 'x'.repeat(501) })).toBeNull();
    expect(buildReflectionEvidencePlan({ ...base, studentId: '' })).toBeNull();
  });
});
