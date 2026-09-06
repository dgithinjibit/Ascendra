/**
 * Resolves the current student's ID from Supabase authentication.
 * 
 * In client components:
 * - Use useAuth() hook to get the authenticated user
 * - Falls back to localStorage for backward compatibility
 * - Use 'demo-student' for public demo pages
 * 
 * This replaces the old hardcoded 'user1' pattern with real authentication.
 */

const FALLBACK_STUDENT_ID = 'anonymous-student';
const DEMO_STUDENT_ID = 'demo-student';
const STORAGE_KEYS = ['studentId', 'userId'] as const;

/**
 * Get student ID from localStorage (legacy support only).
 * 
 * @deprecated Use useAuth() hook instead to get authenticated user.id
 * This function is kept for backward compatibility but will be removed
 * once all components migrate to proper authentication.
 */
export function getStudentId(): string {
  if (typeof window === 'undefined') return FALLBACK_STUDENT_ID;
  
  // Check for demo student first
  const demoCheck = window.localStorage.getItem('studentId');
  if (demoCheck === DEMO_STUDENT_ID) return DEMO_STUDENT_ID;
  
  for (const key of STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim().length > 0) return value;
  }
  return FALLBACK_STUDENT_ID;
}

export { FALLBACK_STUDENT_ID, DEMO_STUDENT_ID };
