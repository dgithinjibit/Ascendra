import type { ChatLanguage } from './socratic-prompts';

export type TeachingLanguageContext = {
  subject: string;
  grade: string;
  requestedLanguage?: ChatLanguage;
};

const KISWAHILI_SUBJECTS = ['kiswahili', 'kiswahili language activities', 'lugha ya kiswahili'];
const LOCAL_LANGUAGE_GRADES = /^(pp1|pp2|grade\s?[1-3]|g[1-3])$/i;

export function isKiswahiliSubject(subject: string): boolean {
  const normalized = subject.trim().toLowerCase();
  return KISWAHILI_SUBJECTS.some((item) => normalized.includes(item));
}

export function isLowerPrimary(grade: string): boolean {
  return LOCAL_LANGUAGE_GRADES.test(grade.trim());
}

/**
 * SyncSenta classroom language policy:
 * - Kiswahili is taught in pure Kiswahili.
 * - Other subjects are taught in pure English.
 * - Lower-primary local-language support is opt-in and configured separately.
 * - Mixed English/Kiswahili is not used as a default classroom mode.
 */
export function resolveTeachingLanguage({ subject, grade, requestedLanguage }: TeachingLanguageContext): ChatLanguage {
  if (isKiswahiliSubject(subject)) return 'kiswahili';
  if (subject.trim().toLowerCase() === 'indigenous language' && isLowerPrimary(grade)) {
    return requestedLanguage === 'kiswahili' ? 'kiswahili' : 'english';
  }
  return 'english';
}
