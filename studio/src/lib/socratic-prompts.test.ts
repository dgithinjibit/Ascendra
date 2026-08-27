import { describe, expect, it } from 'vitest';
import { buildSocraticSystemPrompt } from './socratic-prompts';

describe('Mwalimu AI learner context', () => {
  it('grounds Junior Secondary Environmental Activities tutoring in verified context', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 8',
      subject: 'Environmental Activities',
      language: 'english',
      studentName: 'Sample Learner',
      learnerContext: {
        ageBand: '12–14',
        cbcStage: 'Junior Secondary',
        currentCompetency: 'Conserving the environment',
        masteryLevel: 'developing',
        progressPercentage: 46,
        recentPractice: '2026-08-27T07:00:00.000Z',
      },
    });

    expect(prompt).toContain('Grade level: Grade 8');
    expect(prompt).toContain('Subject: Environmental Activities');
    expect(prompt).toContain('Age band: 12–14');
    expect(prompt).toContain('CBC stage: Junior Secondary');
    expect(prompt).toContain('Current competency: Conserving the environment');
    expect(prompt).toContain('Verified mastery level: developing');
    expect(prompt).toContain('Verified progress: 46%');
    expect(prompt).toContain('plants and animals in our environment');
    expect(prompt).toContain('never infer mood, emotion, disability, or wellbeing');
  });
});
