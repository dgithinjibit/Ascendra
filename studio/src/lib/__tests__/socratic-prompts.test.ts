/**
 * Golden-output assertions on the Socratic Mentor prompt builders.
 *
 * The intent is *drift detection*, not full prompt validation. If a future
 * change to the prompt template accidentally removes a hard rule (e.g. the
 * "≤ 4 sentences" cap, the [CHOICE] grammar, the silent-reasoning clause),
 * these tests fail loudly and the reviewer must opt in.
 *
 * Run with vitest (once added as a dep) or jest:
 *   npx vitest run src/lib/__tests__/socratic-prompts.test.ts
 *
 * Uses `vitest.config.ts` which sets `globals: true`, so describe/it/expect
 * are available without imports. The // @ts-ignore lines keep typecheck
 * green even when no test runner types are installed.
 */

// @ts-ignore - globals provided by vitest at test time
declare const describe: (name: string, fn: () => void) => void;
// @ts-ignore
declare const it: (name: string, fn: () => void) => void;
// @ts-ignore
declare const expect: any;

import {
  buildSocraticSystemPrompt,
  buildCompassSystemPrompt,
  buildSystemPrompt,
} from '../socratic-prompts';

describe('buildSocraticSystemPrompt', () => {
  it('injects grade and subject into the prompt', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 4',
      subject: 'Mathematics',
      language: 'mixed',
      studentName: 'Amani',
    });
    expect(prompt).toContain('Grade 4');
    expect(prompt).toContain('Mathematics');
    expect(prompt).toContain('Amani');
    expect(prompt).toContain('Preferred language: english');
  });

  it('enforces the four-sentence cap', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 4',
      subject: 'Mathematics',
    });
    expect(prompt).toMatch(/never write more than 4 sentences/i);
  });

  it('mandates ending with a question or [CHOICE] tokens', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 7',
      subject: 'Integrated Science',
    });
    expect(prompt).toMatch(/ALWAYS end with a question/i);
    expect(prompt).toContain('[CHOICE:');
  });

  it('keeps the silent-reasoning clause', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 5',
      subject: 'English',
    });
    expect(prompt).toMatch(/silent.*never reveal/i);
  });

  it('lists the five Socratic moves', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 4',
      subject: 'Mathematics',
    });
    expect(prompt).toContain('PROBE');
    expect(prompt).toContain('REFOCUS');
    expect(prompt).toContain('SCAFFOLD');
    expect(prompt).toContain('ACKNOWLEDGE+ADVANCE');
    expect(prompt).toContain('REGROUND');
  });

  it('defaults language to pure English when omitted', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 4',
      subject: 'Mathematics',
    });
    expect(prompt).toContain('Preferred language: english');
  });

  it('forces pure Kiswahili for Kiswahili subjects', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 8',
      subject: 'Kiswahili',
      language: 'mixed',
    });
    expect(prompt).toContain('Preferred language: kiswahili');
  });

  it('falls back to "the student" when studentName is missing', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 1',
      subject: 'Mathematics',
    });
    expect(prompt).toContain('Student name: the student');
  });

  it('injects a Creative Activities scope block that excludes arithmetic', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 1',
      subject: 'Creative Activities',
    });
    expect(prompt).toMatch(/SUBJECT SCOPE/);
    expect(prompt).toMatch(/IN SCOPE/);
    expect(prompt).toMatch(/OUT OF SCOPE/);
    expect(prompt).toMatch(/arithmetic.*Mathematics/i);
    expect(prompt).toMatch(/REDIRECT PROTOCOL/);
  });

  it('injects a Mathematics scope block that excludes pure drawing', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 4',
      subject: 'Mathematics',
    });
    expect(prompt).toMatch(/SUBJECT SCOPE/);
    expect(prompt).toMatch(/drawing.*Creative Activities/i);
  });

  it('normalises subject keys (case + dashes) when matching scope', () => {
    const dashed = buildSocraticSystemPrompt({
      grade: 'Grade 1',
      subject: 'creative-activities',
    });
    const upper = buildSocraticSystemPrompt({
      grade: 'Grade 1',
      subject: 'CREATIVE ACTIVITIES',
    });
    expect(dashed).toMatch(/SUBJECT SCOPE/);
    expect(upper).toMatch(/SUBJECT SCOPE/);
  });

  it('omits the scope block for unknown subjects (graceful fallback)', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 4',
      subject: 'Astrophysics 101',
    });
    expect(prompt).not.toMatch(/SUBJECT SCOPE/);
  });

  it('forbids silent subject-switching in the hard rules', () => {
    const prompt = buildSocraticSystemPrompt({
      grade: 'Grade 1',
      subject: 'Creative Activities',
    });
    expect(prompt).toMatch(/never silently teach the other subject/i);
  });
});

describe('buildCompassSystemPrompt', () => {
  it('embeds the teacher context verbatim', () => {
    const prompt = buildCompassSystemPrompt({
      teacherContext: 'CHAPTER 7: water cycle — evaporation, condensation, precipitation.',
      language: 'english',
      studentName: 'Wanjiru',
    });
    expect(prompt).toContain('CHAPTER 7: water cycle');
    expect(prompt).toContain('Wanjiru');
  });

  it('includes the fixed greeting protocol', () => {
    const prompt = buildCompassSystemPrompt({
      teacherContext: 'irrelevant',
    });
    expect(prompt).toContain('Welcome, Explorer!');
  });

  it('includes the out-of-scope decline phrase', () => {
    const prompt = buildCompassSystemPrompt({
      teacherContext: 'irrelevant',
    });
    expect(prompt).toContain('outside the map your teacher has provided');
  });

  it('mandates the "Drawing from your teacher\'s materials" prefix', () => {
    const prompt = buildCompassSystemPrompt({
      teacherContext: 'irrelevant',
    });
    expect(prompt).toContain("Drawing from your teacher's materials");
  });
});

describe('buildSystemPrompt', () => {
  it('routes socratic mode to buildSocraticSystemPrompt', () => {
    const result = buildSystemPrompt('socratic', {
      grade: 'Grade 4',
      subject: 'Mathematics',
    });
    expect(result).toContain('Socratic mentor');
  });

  it('routes compass mode to buildCompassSystemPrompt', () => {
    const result = buildSystemPrompt(
      'compass',
      { grade: 'Grade 4', subject: 'Mathematics' },
      { teacherContext: 'sample materials' }
    );
    expect(result).toContain('Welcome, Explorer!');
  });

  it('throws when compass mode lacks compassInput', () => {
    expect(() =>
      buildSystemPrompt('compass', {
        grade: 'Grade 4',
        subject: 'Mathematics',
      })
    ).toThrow(/compass mode requires/i);
  });
});
