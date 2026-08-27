import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

function request(method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/internal/schools/onboarding', {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('internal school onboarding review route', () => {
  it('does not list pending requests without the review token', async () => {
    vi.stubEnv('SYNC_SENTA_SCHOOL_REVIEW_TOKEN', 'expected');
    const response = await GET(request('GET'));
    expect(response.status).toBe(401);
    vi.unstubAllEnvs();
  });

  it('does not approve or reject without the review token', async () => {
    vi.stubEnv('SYNC_SENTA_SCHOOL_REVIEW_TOKEN', 'expected');
    const response = await POST(request('POST', { requestId: '00000000-0000-0000-0000-000000000001', action: 'approve' }));
    expect(response.status).toBe(401);
    vi.unstubAllEnvs();
  });

  it('rejects oversized review requests before database access', async () => {
    vi.stubEnv('SYNC_SENTA_SCHOOL_REVIEW_TOKEN', 'expected');
    const response = await POST(request('POST', { requestId: '00000000-0000-0000-0000-000000000001', action: 'approve' }, {
      'x-syncsenta-school-review-token': 'expected',
      'content-length': String(16 * 1024 + 1),
    }));
    expect(response.status).toBe(413);
    vi.unstubAllEnvs();
  });

  it('rejects malformed review actions without database access', async () => {
    vi.stubEnv('SYNC_SENTA_SCHOOL_REVIEW_TOKEN', 'expected');
    const response = await POST(request('POST', { requestId: 'not-a-uuid', action: 'publish' }, {
      'x-syncsenta-school-review-token': 'expected',
    }));
    expect(response.status).toBe(400);
    vi.unstubAllEnvs();
  });
});
