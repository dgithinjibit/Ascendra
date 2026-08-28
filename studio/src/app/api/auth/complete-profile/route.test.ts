import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  routeClient: vi.fn(),
  adminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/route-handler', () => ({
  createSupabaseRouteHandlerClient: deps.routeClient,
}));
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: deps.adminClient,
}));

import { POST } from './route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/auth/complete-profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Google profile completion route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects requests without an authenticated user', async () => {
    deps.routeClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
    const response = await POST(request({ role: 'student', fullName: 'Home Learner', grade: 'Grade 4' }));
    expect(response.status).toBe(401);
    expect(deps.adminClient).not.toHaveBeenCalled();
  });

  it('rejects an authenticated identity without a real email instead of inventing one', async () => {
    deps.routeClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: null, user_metadata: {} } }, error: null }) } });
    const response = await POST(request({ role: 'student', fullName: 'Home Learner', grade: 'Grade 4' }));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain('email address');
    expect(deps.adminClient).not.toHaveBeenCalled();
  });
});
