/**
 * Age-adaptive theming for SyncSenta.
 *
 * Philosophy:
 * - Pre-primary / Lower primary: bright, bold, high-contrast — kids love saturated colours
 * - Upper primary: warm and encouraging, still colourful
 * - Junior secondary: cool, modern, LGBTQ-inclusive — neutral palette that doesn't
 *   enforce pink/blue gender binary. Soft purples, teals, and warm neutrals work for everyone.
 * - Senior secondary: clean, near-adult, minimal
 */

export type AgeTheme =
  | 'pre-primary'      // PP1–PP2, ages 4–5
  | 'lower-primary'    // Grade 1–3, ages 6–8
  | 'upper-primary'    // Grade 4–6, ages 9–11
  | 'junior-secondary' // Grade 7–9, ages 12–14
  | 'senior-secondary' // Grade 10–12, ages 15–17
  | 'default';

export interface ThemeConfig {
  /** CSS class applied to the root wrapper */
  rootClass: string;
  /** Tailwind bg for page background */
  pageBg: string;
  /** Tailwind classes for primary CTA buttons */
  ctaClass: string;
  /** Card base classes */
  cardClass: string;
  /** Subject pill/badge colours [index % colours.length] */
  subjectColours: string[];
  /** Heading font size modifier */
  headingSize: string;
  /** Border radius feel */
  radiusClass: string;
  /** Whether to show emoji decorations */
  showEmoji: boolean;
  /** Avatar/illustration style hint */
  illustrationStyle: 'playful' | 'friendly' | 'cool' | 'clean';
}

export const AGE_THEMES: Record<AgeTheme, ThemeConfig> = {
  'pre-primary': {
    rootClass: 'theme-pre-primary',
    pageBg: 'bg-amber-50',
    ctaClass: 'bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-base font-bold shadow-lg',
    cardClass: 'rounded-3xl border-4 border-opacity-60 shadow-lg',
    subjectColours: [
      'bg-red-400 text-white border-red-500',
      'bg-yellow-400 text-yellow-900 border-yellow-500',
      'bg-green-400 text-white border-green-500',
      'bg-blue-400 text-white border-blue-500',
      'bg-purple-400 text-white border-purple-500',
      'bg-pink-400 text-white border-pink-500',
    ],
    headingSize: 'text-3xl',
    radiusClass: 'rounded-3xl',
    showEmoji: true,
    illustrationStyle: 'playful',
  },

  'lower-primary': {
    rootClass: 'theme-lower-primary',
    pageBg: 'bg-yellow-50',
    ctaClass: 'bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold shadow-md',
    cardClass: 'rounded-2xl border-2 shadow-md',
    subjectColours: [
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-lime-100 text-lime-800 border-lime-200',
      'bg-sky-100 text-sky-800 border-sky-200',
      'bg-violet-100 text-violet-800 border-violet-200',
    ],
    headingSize: 'text-2xl',
    radiusClass: 'rounded-2xl',
    showEmoji: true,
    illustrationStyle: 'friendly',
  },

  'upper-primary': {
    rootClass: 'theme-upper-primary',
    pageBg: 'bg-emerald-50/60',
    ctaClass: 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow',
    cardClass: 'rounded-xl border shadow-sm',
    subjectColours: [
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-orange-50 text-orange-700 border-orange-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
    ],
    headingSize: 'text-2xl',
    radiusClass: 'rounded-xl',
    showEmoji: false,
    illustrationStyle: 'friendly',
  },

  // Junior secondary: LGBTQ-inclusive palette
  // Soft rainbow gradient accents, purples, teals, warm golds
  // No pink-for-girls / blue-for-boys — everyone gets the same beautiful palette
  'junior-secondary': {
    rootClass: 'theme-junior-secondary',
    pageBg: 'bg-slate-50',
    ctaClass: 'bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold shadow',
    cardClass: 'rounded-xl border border-slate-200 shadow-sm',
    subjectColours: [
      'bg-violet-50 text-violet-700 border-violet-200',
      'bg-teal-50 text-teal-700 border-teal-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-lime-50 text-lime-700 border-lime-200',
    ],
    headingSize: 'text-xl',
    radiusClass: 'rounded-xl',
    showEmoji: false,
    illustrationStyle: 'cool',
  },

  'senior-secondary': {
    rootClass: 'theme-senior-secondary',
    pageBg: 'bg-white',
    ctaClass: 'bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium',
    cardClass: 'rounded-lg border border-slate-200 shadow-sm',
    subjectColours: [
      'bg-slate-100 text-slate-700 border-slate-200',
      'bg-zinc-100 text-zinc-700 border-zinc-200',
      'bg-stone-100 text-stone-700 border-stone-200',
      'bg-neutral-100 text-neutral-700 border-neutral-200',
      'bg-gray-100 text-gray-700 border-gray-200',
      'bg-slate-50 text-slate-600 border-slate-100',
    ],
    headingSize: 'text-xl',
    radiusClass: 'rounded-lg',
    showEmoji: false,
    illustrationStyle: 'clean',
  },

  'default': {
    rootClass: '',
    pageBg: 'bg-[#f8fffe]',
    ctaClass: 'bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold',
    cardClass: 'rounded-xl border border-slate-100 shadow-sm',
    subjectColours: [
      'bg-teal-50 text-teal-700 border-teal-100',
      'bg-blue-50 text-blue-700 border-blue-100',
      'bg-emerald-50 text-emerald-700 border-emerald-100',
      'bg-violet-50 text-violet-700 border-violet-100',
      'bg-amber-50 text-amber-700 border-amber-100',
      'bg-rose-50 text-rose-700 border-rose-100',
    ],
    headingSize: 'text-xl',
    radiusClass: 'rounded-xl',
    showEmoji: false,
    illustrationStyle: 'friendly',
  },
};

/** Derive the theme from a CBC grade string like "Grade 3" or "PP1" */
export function themeFromGrade(grade: string | null | undefined): AgeTheme {
  if (!grade) return 'default';
  if (grade === 'PP1' || grade === 'PP2') return 'pre-primary';
  const n = parseInt(grade.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(n)) return 'default';
  if (n <= 3) return 'lower-primary';
  if (n <= 6) return 'upper-primary';
  if (n <= 9) return 'junior-secondary';
  return 'senior-secondary';
}

export function getTheme(grade: string | null | undefined): ThemeConfig {
  return AGE_THEMES[themeFromGrade(grade)];
}
