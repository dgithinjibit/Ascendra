#!/usr/bin/env node

/**
 * Role-based Syncsenta smoke workflow.
 *
 * This runner performs route-level checks only. It never creates real learner
 * data and never embeds credentials. For authenticated checks, provide an
 * externally managed AUTH_COOKIE or Authorization header through the shell.
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 node scripts/test-role-workflows.mjs
 *   BASE_URL=https://staging.example.com AUTH_COOKIE='sb-...=...' node ...
 */

const baseUrl = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
const authCookie = process.env.AUTH_COOKIE;
const authHeader = process.env.AUTHORIZATION;

const roleRoutes = {
  student: [
    '/',
    '/student',
    '/student/demo',
    '/student/journey',
    '/student/sandbox',
    '/student/tutor-dashboard',
    '/offline',
    '/quiz',
    '/student/chat/Mathematics',
    '/student/sandbox/Grade%204/Mathematics',
  ],
  teacher: [
    '/teacher',
    '/teacher/dashboard',
    '/teacher/exams',
    '/teacher/metta-analytics',
    '/teacher/scheme-wizard',
    '/teacher/setup',
  ],
  head_of_school: [
    '/dashboard',
    '/dashboard/schools',
    '/dashboard/school-staff',
    '/dashboard/student-submissions',
    '/dashboard/school-finance',
    '/dashboard/county-teachers',
    '/dashboard/county-resources',
    '/dashboard/county-comms',
    '/dashboard/county-finance',
    '/dashboard/guide',
    '/dashboard/improvements',
  ],
  parent_guardian: [
    '/parent',
    '/parent/dashboard',
  ],
};

const apiChecks = [
  ['GET', '/api/test-personalization?action=progress&subject=Mathematics'],
  ['GET', '/api/schemes/active'],
  ['GET', '/api/teacher/assignments'],
  ['GET', '/api/teacher/feedback'],
  ['GET', '/api/teacher/lookup-students'],
  ['POST', '/api/chat', {
    message: 'Synthetic test only: what is 2 + 2?',
    history: [],
    grade: 'Grade 4',
    subject: 'Mathematics',
    language: 'english',
    mode: 'socratic',
  }],
  ['POST', '/api/generate/lesson-plan', { grade: 'Grade 4', subject: 'Mathematics', topic: 'Water conservation' }],
  ['POST', '/api/generate/assessment', { grade: 'Grade 4', subject: 'Mathematics', topic: 'Fractions' }],
  ['POST', '/api/generate/scheme', { grade: 'Grade 4', subject: 'Mathematics', term: 1 }],
  ['POST', '/api/offline/resolve', { queue: [], deviceId: 'synthetic-smoke-device' }],
];

function headers() {
  const result = { Accept: 'application/json,text/html;q=0.9' };
  if (authCookie) result.Cookie = authCookie;
  if (authHeader) result.Authorization = authHeader;
  return result;
}

async function check(method, path, body) {
  const init = { method, headers: headers(), redirect: 'manual' };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const started = Date.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, init);
    const text = await response.text();
    return {
      method,
      path,
      status: response.status,
      latencyMs: Date.now() - started,
      outcome: response.status >= 200 && response.status < 300 ? 'success' :
        [301, 302, 303, 307, 308, 400, 401, 403, 405, 409, 429].includes(response.status) ? 'reachable_or_validation_or_auth_required' :
        response.status === 404 ? 'missing_route' : 'failure',
      preview: text.replace(/\s+/g, ' ').slice(0, 180),
    };
  } catch (error) {
    return { method, path, status: null, latencyMs: Date.now() - started, outcome: 'unreachable', preview: String(error) };
  }
}

const results = [];
for (const [role, routes] of Object.entries(roleRoutes)) {
  for (const path of routes) results.push({ role, ...(await check('GET', path)) });
}
for (const [method, path, body] of apiChecks) {
  results.push({ role: 'shared_api', ...(await check(method, path, body)) });
}

const byOutcome = results.reduce((acc, item) => {
  acc[item.outcome] = (acc[item.outcome] || 0) + 1;
  return acc;
}, {});
const parentStatus = roleRoutes.parent_guardian.length === 0
  ? 'missing_route_inventory_entry'
  : results.filter((item) => item.role === 'parent_guardian' && item.outcome === 'success').length === roleRoutes.parent_guardian.length
    ? 'configured'
    : 'not_ready';

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  authenticatedRun: Boolean(authCookie || authHeader),
  parentGuardianStatus: parentStatus,
  summary: { total: results.length, byOutcome },
  results,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = byOutcome.failure || byOutcome.unreachable || byOutcome.missing_route ? 1 : 0;
