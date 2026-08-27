import { describe, expect, it } from 'vitest';
import { isLowerPrimary, isKiswahiliSubject, resolveTeachingLanguage } from './teaching-language-policy';

describe('CBC teaching language policy', () => {
  it('uses pure Kiswahili for Kiswahili', () => {
    expect(isKiswahiliSubject('Kiswahili')).toBe(true);
    expect(resolveTeachingLanguage({ subject: 'Kiswahili', grade: 'Grade 8', requestedLanguage: 'mixed' })).toBe('kiswahili');
  });

  it('uses pure English for non-Kiswahili subjects', () => {
    expect(resolveTeachingLanguage({ subject: 'Environmental Activities', grade: 'Grade 8', requestedLanguage: 'mixed' })).toBe('english');
    expect(resolveTeachingLanguage({ subject: 'Mathematics', grade: 'Grade 4', requestedLanguage: 'kiswahili' })).toBe('english');
  });

  it('keeps lower-primary Indigenous Language opt-in and non-mixed', () => {
    expect(isLowerPrimary('Grade 2')).toBe(true);
    expect(resolveTeachingLanguage({ subject: 'Indigenous Language', grade: 'Grade 2', requestedLanguage: 'kiswahili' })).toBe('kiswahili');
    expect(resolveTeachingLanguage({ subject: 'Indigenous Language', grade: 'Grade 2', requestedLanguage: 'mixed' })).toBe('english');
  });
});
