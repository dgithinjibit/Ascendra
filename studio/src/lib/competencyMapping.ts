import { GRADE1_COMPETENCIES } from './grade1Competencies';

// Legacy activity type used by grade-1 competency mapping.
// The modern activity catalogue lives in sandbox-types.ts + sandbox-activities.ts.
interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'canvas' | 'mcq' | 'short-answer';
  competency_codes: string[];
  config?: Record<string, unknown>;
}

const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: 'g1-math-counting-1',
    title: 'Count the Fruit',
    description: 'Drag fruits into baskets to show the number asked. Practice counting to 20.',
    type: 'canvas',
    competency_codes: ['G1.MATH.NS.1'],
    config: { initialTokens: 10, prompt: 'Place exactly {n} fruits into the basket', scoring: { correct: 10, hintPenalty: -1 } },
  },
  {
    id: 'g1-eng-letters-1',
    title: 'Letter Match',
    description: 'Match the letter sound to the correct letter tile.',
    type: 'canvas',
    competency_codes: ['G1.ENG.LS.1'],
    config: { tileCount: 8, mode: 'match-sound', hintsAllowed: 3 },
  },
  {
    id: 'g1-sci-observe-1',
    title: 'Nature Drawing',
    description: 'Observe the picture and draw one thing you see; label it with one word.',
    type: 'short-answer',
    competency_codes: ['G1.SCI.OBS.1'],
    config: { allowDrawing: true, maxWords: 5 },
  },
];

export function getCompetenciesBySubject(subject: string) {
  return GRADE1_COMPETENCIES.filter(c => c.subject.toLowerCase() === subject.toLowerCase());
}

export function findCompetency(code: string) {
  return GRADE1_COMPETENCIES.find(c => c.code === code) || null;
}

export function activitiesForCompetency(code: string): Activity[] {
  return SAMPLE_ACTIVITIES.filter(a => a.competency_codes.includes(code));
}

export function competencySummary() {
  return GRADE1_COMPETENCIES.map(c => ({ code: c.code, subject: c.subject, strand: c.strand, outcomes: c.learning_outcomes.length }));
}

export default {
  getCompetenciesBySubject,
  findCompetency,
  activitiesForCompetency,
  competencySummary
};
