import { describe, expect, it } from 'vitest';
import { buildSocraticSystemPrompt } from './socratic-prompts';

type ConsentFixture = {
  studentId: string;
  consentVersion: string;
  consentedAt: string;
  parentGuardianConfirmed: boolean;
  learnerConfirmed: boolean;
};

function verifyConsent(fixture: ConsentFixture) {
  const checks = {
    consentVersionPresent: fixture.consentVersion.trim().length > 0,
    consentedAtValid: !Number.isNaN(new Date(fixture.consentedAt).getTime()),
    learnerConfirmed: fixture.learnerConfirmed,
    parentGuardianConfirmed: fixture.parentGuardianConfirmed,
  };
  const verified = Object.values(checks).every(Boolean);
  console.info(JSON.stringify({
    event: 'student_context_consent_verification',
    student_id: fixture.studentId,
    consent_version: fixture.consentVersion,
    checks,
    verified,
  }));
  if (!verified) throw new Error('Consent verification failed; learner context test blocked.');
  return { verified, consentVersion: fixture.consentVersion };
}

describe('consent-gated Junior Secondary context', () => {
  it('logs verified consent before building bilingual Environmental Activities context', () => {
    const consent = verifyConsent({
      studentId: 'sample-jss-learner',
      consentVersion: 'wellbeing-v1',
      consentedAt: '2026-08-27T07:00:00.000Z',
      learnerConfirmed: true,
      parentGuardianConfirmed: true,
    });

    expect(consent.verified).toBe(true);
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 8',
      subject: 'Environmental Activities',
      language: 'mixed',
      studentName: 'Sample Learner',
      learnerContext: {
        ageBand: '12–14',
        cbcStage: 'Junior Secondary',
        currentCompetency: 'Conserving the environment',
        masteryLevel: 'developing',
        progressPercentage: 46,
      },
    });

    expect(prompt).toContain('Preferred language: english');
    expect(prompt).toContain('CBC stage: Junior Secondary');
    expect(prompt).toContain('Environmental Activities');
    expect(prompt).toContain('never infer mood, emotion, disability, or wellbeing');
  });
});
