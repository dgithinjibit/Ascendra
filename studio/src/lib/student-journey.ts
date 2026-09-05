export type JourneyStep = 'level' | 'grade' | 'subject';

/**
 * Return the next wizard step after a learner selects a grade.
 * Covered grades continue to subject selection; unsupported grades remain
 * unavailable and should not be advanced by the UI.
 */
export function getJourneyStepAfterGrade(
  grade: string,
  coveredGrades: ReadonlySet<string>,
): JourneyStep {
  return coveredGrades.has(grade) ? 'subject' : 'grade';
}
