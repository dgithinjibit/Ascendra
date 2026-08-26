export type EmotionalSentiment =
  | 'frustrated'
  | 'confused'
  | 'confident'
  | 'excited'
  | 'neutral';

export interface EmotionalState {
  sentiment: EmotionalSentiment;
  confidence: number;
  needsEncouragement: boolean;
  detectedPatterns: string[];
}

export interface Encouragement {
  message: string;
  tone: 'reassuring' | 'supportive';
}

export interface Celebration {
  message: string;
  tone: 'celebratory';
}

type HistoryMessage = { role: 'user' | 'model'; content: string };

const matchesAny = (text: string, terms: string[]) =>
  terms.some((term) => text.includes(term));

export function analyzeEmotionalState(
  input: string,
  history: HistoryMessage[] = []
): EmotionalState {
  const text = input.toLowerCase().trim();
  const patterns: string[] = [];
  const frustrationTerms = [
    "don't understand",
    "dont understand",
    "don't get",
    "dont get",
    'still stuck',
    'this is hard',
    'frustrated',
    'confusing',
  ];
  const confusionTerms = ['what does this mean', 'how do i solve', 'confused', 'not sure'];
  const confidenceTerms = ['i understand', 'i can do this', 'i got it', 'i know now'];
  const excitementTerms = ['wow', 'so cool', 'awesome', 'excited', 'amazing'];

  const repeatedQuestion =
    history.filter((message) => message.role === 'user' && message.content.includes('?')).length >= 2;

  if (matchesAny(text, frustrationTerms)) patterns.push('frustration_keywords');
  if (matchesAny(text, confusionTerms)) patterns.push('confusion_keywords');
  if (repeatedQuestion) patterns.push('repeated_questions');
  if (matchesAny(text, confidenceTerms)) patterns.push('confidence_keywords');
  if (matchesAny(text, excitementTerms)) patterns.push('excitement_keywords');

  if (patterns.includes('repeated_questions') || patterns.includes('frustration_keywords')) {
    return {
      sentiment: 'frustrated',
      confidence: 0.9,
      needsEncouragement: true,
      detectedPatterns: patterns,
    };
  }
  if (patterns.includes('confusion_keywords')) {
    return {
      sentiment: 'confused',
      confidence: 0.85,
      needsEncouragement: true,
      detectedPatterns: patterns,
    };
  }
  if (patterns.includes('excitement_keywords')) {
    return {
      sentiment: 'excited',
      confidence: 0.9,
      needsEncouragement: false,
      detectedPatterns: patterns,
    };
  }
  if (patterns.includes('confidence_keywords')) {
    return {
      sentiment: 'confident',
      confidence: 0.85,
      needsEncouragement: false,
      detectedPatterns: patterns,
    };
  }

  return {
    sentiment: 'neutral',
    confidence: 0.5,
    needsEncouragement: false,
    detectedPatterns: patterns,
  };
}

export function generateEncouragement(
  state: EmotionalState,
  studentName?: string,
  subject?: string
): Encouragement | null {
  if (!state.needsEncouragement) return null;
  const name = studentName ? `${studentName}, ` : '';
  const topic = subject ? ` Let’s take ${subject} one small step at a time.` : '';
  return {
    message:
      state.sentiment === 'frustrated'
        ? `${name}it is okay to find this challenging. You are making progress.${topic}`
        : `${name}let’s slow down and work through this together.${topic}`,
    tone: state.sentiment === 'frustrated' ? 'reassuring' : 'supportive',
  };
}

export function generateCelebration(
  state: EmotionalState,
  studentName?: string
): Celebration | null {
  if (state.sentiment !== 'confident' && state.sentiment !== 'excited') return null;
  const name = studentName ? `${studentName}, ` : '';
  return {
    message: `${name}excellent work. Your confidence is growing!`,
    tone: 'celebratory',
  };
}
