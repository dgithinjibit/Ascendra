import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({ from: vi.fn(), client: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: supabaseMock.client }));

import { GET, POST } from './route';

function request(method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/internal/schools/onboarding', {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const reviewHeaders = {
  'x-syncsenta-school-review-token': 'expected',
  'x-syncsenta-reviewer-ref': 'reviewer-1',
};

describe('internal school onboarding review route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('SYNC_SENTA_SCHOOL_REVIEW_TOKEN', 'expected');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key');
    supabaseMock.client.mockReturnValue({ from: supabaseMock.from });
  });

  it('does not list pending requests without the review token', async () => {
    const response = await GET(request('GET'));
    expect(response.status).toBe(401);
  });

  it('does not approve or reject without the review token', async () => {
    const response = await POST(request('POST', { requestId: '00000000-0000-0000-0000-000000000001', action: 'approve' }));
    expect(response.status).toBe(401);
  });

  it('rejects oversized review requests before database access', async () => {
    const response = await POST(request('POST', { requestId: '00000000-0000-0000-0000-000000000001', action: 'approve' }, {
      ...reviewHeaders,
      'content-length': String(16 * 1024 + 1),
    }));
    expect(response.status).toBe(413);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('rejects malformed review actions without database access', async () => {
    const response = await POST(request('POST', { requestId: 'not-a-uuid', action: 'publish' }, reviewHeaders));
    expect(response.status).toBe(400);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('writes a redacted audit record when rejecting a pending school', async () => {
    const inserted: Record<string, unknown>[] = [];
    supabaseMock.from.mockImplementation((table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        update: () => chain,
        insert: (row: Record<string, unknown>) => { if (table === 'school_review_audits') inserted.push(row); return Promise.resolve({ error: null }); },
        maybeSingle: () => Promise.resolve({ data: { id: '00000000-0000-0000-0000-000000000001', school_name: 'Genuine School', county: 'Turkana', school_code: 'SCH-1', school_type: 'public', classes: ['Grade 4'], status: 'pending' }, error: null }),
      };
      return chain;
    });

    const response = await POST(request('POST', { requestId: '00000000-0000-0000-0000-000000000001', action: 'reject' }, reviewHeaders));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.auditDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(inserted[0]).toMatchObject({ action: 'reject', result: 'rejected', request_id: '00000000-0000-0000-0000-000000000001' });
    expect(inserted[0].source_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(inserted[0].reviewer_ref).toMatch(/^operator:[a-f0-9]{24}$/);
    expect(inserted[0]).not.toHaveProperty('contact_email');
  });

  it('writes an audit record when approving a pending school', async () => {
    const inserted: Record<string, unknown>[] = [];
    supabaseMock.from.mockImplementation((table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        update: () => chain,
        upsert: () => chain,
        insert: (row: Record<string, unknown>) => { if (table === 'school_review_audits') inserted.push(row); return Promise.resolve({ error: null }); },
        maybeSingle: () => Promise.resolve({ data: { id: '00000000-0000-0000-0000-000000000002', school_name: 'Nairobi School', county: 'Nairobi', school_code: null, school_type: 'private', classes: [], status: 'pending' }, error: null }),
        single: () => Promise.resolve({ data: { id: '00000000-0000-0000-0000-000000000010', name: 'Nairobi School', county: 'Nairobi', code: null, status: 'active' }, error: null }),
      };
      return chain;
    });

    const response = await POST(request('POST', { requestId: '00000000-0000-0000-0000-000000000002', action: 'approve' }, reviewHeaders));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('approved');
    expect(body.auditDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ action: 'approve', result: 'approved', school_id: '00000000-0000-0000-0000-000000000010' });
  });
});
