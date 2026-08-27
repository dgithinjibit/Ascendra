import { describe, expect, it } from 'vitest';
import { buildCanonicalEvidenceWrites } from '../reflection-evidence-delivery';
import { buildReflectionEvidencePlan } from '../teacher-reflection-evidence';

const plan = buildReflectionEvidencePlan({
  teacherId: 'teacher-01',
  studentId: 'student-01',
  schoolName: 'SyncSenta Primary',
  subject: 'Mathematics',
  masteryPercent: 62,
  teacherSummary: 'Use a visual fraction example next.',
  nextStep: 'Practise two equivalent fractions.',
  parentLinked: true,
  parentConsent: true,
})!;

describe('canonical reflection evidence delivery', () => {
  it('creates Head and consented Parent writes only for the same school', () => {
    const writes = buildCanonicalEvidenceWrites(plan, {
      headRecipientId: 'head-01',
      parentRecipientId: 'parent-01',
      childProfileId: 'student-profile-01',
      consentId: 'consent-01',
      sameSchool: true,
    });
    expect(writes.map((write) => write.table)).toEqual([
      'head_progress_notifications',
      'parent_performance_reports',
    ]);
    expect(JSON.stringify(writes[0])).not.toContain('student-01');
    expect(JSON.stringify(writes)).not.toContain('telemetry');
  });

  it('withholds all delivery when school scope is not proven', () => {
    expect(buildCanonicalEvidenceWrites(plan, {
      headRecipientId: 'head-01',
      parentRecipientId: 'parent-01',
      childProfileId: 'student-profile-01',
      consentId: 'consent-01',
      sameSchool: false,
    })).toEqual([]);
  });

  it('never creates a Parent write without a recipient and consent record', () => {
    const writes = buildCanonicalEvidenceWrites(plan, {
      headRecipientId: 'head-01',
      childProfileId: 'student-profile-01',
      sameSchool: true,
    });
    expect(writes).toHaveLength(1);
    expect(writes[0].table).toBe('head_progress_notifications');
  });
});
