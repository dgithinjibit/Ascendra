/**
 * Test Accounts Configuration
 * 
 * Pre-configured test accounts for development/testing.
 * These follow the pattern: {role}1@ascendra.test
 */

export const TEST_ACCOUNTS = {
  student: {
    email: 'student01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Student 01',
    role: 'student' as const,
  },
  teacher: {
    email: 'teacher01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Teacher 01',
    role: 'teacher' as const,
  },
  parent: {
    email: 'parent01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Parent 01',
    role: 'parent' as const,
  },
  admin: {
    email: 'admin01@ascendra.test',
    password: 'TestPassword123!',
    name: 'Test Admin 01',
    role: 'admin' as const,
  },
};

export type TestAccountRole = keyof typeof TEST_ACCOUNTS;

export function getTestAccount(role: TestAccountRole) {
  return TEST_ACCOUNTS[role];
}

export function isTestAccount(email: string): boolean {
  return email.endsWith('@ascendra.test');
}
