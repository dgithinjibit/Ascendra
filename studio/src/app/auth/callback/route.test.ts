import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock('@/lib/supabase/route-handler', () => ({
  createSupabaseRouteHandlerClient: deps.createClient,
}));

import { GET } from './route';

describe('OAuth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: deps.exchangeCodeForSession },
      from: vi.fn(),
    });
  });

  it('routes provider errors to the real auth error page without exchanging a code', async () => {
    const response = await GET(new NextRequest('http://localhost/auth/callback?error=access_denied'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error?reason=oauth_provider_declined');
    expect(deps.createClient).not.toHaveBeenCalled();
  });

  it('uses the cookie-aware exchange and sends new Google signups to password setup', async () => {
    deps.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const response = await GET(new NextRequest('http://localhost/auth/callback?code=oauth-code&flow=signup&next=%2Fauth%2Fonboarding%3Frole%3Dstudent'));
    expect(response.status).toBe(307);
    expect(deps.exchangeCodeForSession).toHaveBeenCalledWith('oauth-code');
    expect(response.headers.get('location')).toContain('/auth/set-password?next=%2Fauth%2Fonboarding%3Frole%3Dstudent');
  });
});
