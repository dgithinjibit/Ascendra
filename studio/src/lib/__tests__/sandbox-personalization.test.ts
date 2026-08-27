import { describe, expect, it } from 'vitest';
import {
  buildAdaptiveLearningStep,
  buildFallbackPrompt,
  inferAdaptiveProfile,
  inferLearnerInterest,
  personalizePrompt,
} from '../sandbox-personalization';

describe('sandbox personalization', () => {
  it('tunes questions to a more supportive style for early learners', () => {
    const profile = inferAdaptiveProfile('g2', 1, 0, 0.4);
    const prompt = personalizePrompt('Which sentence is correct?', 'english', 'g2', 1, profile);

    expect(profile.level).toBe('support');
    expect(prompt).toContain('Choose the best answer');
    expect(prompt).toContain('Grade 2');
  });

  it('uses a more analytical prompt for confident learners', () => {
    const profile = inferAdaptiveProfile('g5', 4, 3, 0.9);
    const prompt = personalizePrompt('Which sentence is correct?', 'english', 'g5', 4, profile);

    expect(profile.level).toBe('challenge');
    expect(prompt).toContain('most accurate response');
  });

  it('uses Kiswahili phrasing for Kiswahili activities', () => {
    const prompt = personalizePrompt('Ni neno gani lina sauti /ny/ na /ng/ kwenye silabi zake?', 'kiswahili', 'g2', 1);

    expect(prompt).toContain('Chagua jibu sahihi');
  });

  it('uses a broader fallback for pronunciation-style English objectives', () => {
    const prompt = buildFallbackPrompt('english', 'pronunciation', 'g2', 1);

    expect(prompt).toContain('sound');
  });

  it('uses a broader fallback for environmental hygiene objectives', () => {
    const prompt = buildFallbackPrompt('environmental', 'hygiene', 'g2', 1);

    expect(prompt).toContain('health');
  });

  it('extracts a bounded learner interest signal without storing identity data', () => {
    expect(inferLearnerInterest('I am interested in octopus and the ocean').tags).toEqual([
      'octopus',
      'ocean',
    ]);
    expect(inferLearnerInterest('octopus').source).toBe('learner_text');
  });

  it('bridges a learner octopus interest into a fractions example with MeTTa-shaped facts', () => {
    const step = buildAdaptiveLearningStep({
      baseQuestion: 'Identify a fraction as part of a whole.',
      subject: 'mathematics',
      grade: 'g2',
      competency: 'MATH.G2.FRACTIONS',
      interestText: 'I like octopus.',
    });

    expect(step.prompt).toContain('octopus');
    expect(step.prompt).toContain('8');
    expect(step.prompt).toContain('fraction');
    expect(step.mettaFacts).toContain('(bridge octopus-legs 8)');
    expect(step.media.status).toBe('not_connected');
  });

  it('changes the octopus example after learner feedback indicates struggle', () => {
    const step = buildAdaptiveLearningStep({
      baseQuestion: 'Work with fractions of a whole.',
      subject: 'mathematics',
      grade: 'g2',
      competency: 'MATH.G2.FRACTIONS',
      interestText: 'octopus',
      feedbackText: 'Try again: I need help.',
    });

    expect(step.prompt).toContain('2 arms');
    expect(step.explanation).toContain('2/8');
    expect(step.mettaFacts).toContain('(feedback-state support)');
  });
});
