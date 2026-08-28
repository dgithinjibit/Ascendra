/**
 * Auth Callback Route
 *
 * Handles OAuth callbacks (Google, etc.) and email confirmations.
 * Redirects users to the appropriate page after authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeNext(requestUrl.searchParams.get('next'));
  const flow = requestUrl.searchParams.get('flow');
  const providerError = requestUrl.searchParams.get('error');

  if (providerError) {
    const errorUrl = new URL('/auth/error', requestUrl.origin);
    errorUrl.searchParams.set('reason', 'oauth_provider_declined');
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = await createSupabaseRouteHandlerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] OAuth code exchange failed:', error.message);
      const errorUrl = new URL('/auth/error', requestUrl.origin);
      errorUrl.searchParams.set('reason', 'oauth_exchange_failed');
      return NextResponse.redirect(errorUrl);
    }

    if (data.user && flow === 'signup') {
      const setupUrl = new URL('/auth/set-password', requestUrl.origin);
      setupUrl.searchParams.set('next', next);
      return NextResponse.redirect(setupUrl);
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[auth/callback] Profile lookup failed:', profileError.message);
        const errorUrl = new URL('/auth/error', requestUrl.origin);
        errorUrl.searchParams.set('reason', 'profile_lookup_failed');
        return NextResponse.redirect(errorUrl);
      }

      if (!profile) {
        const onboardingUrl = new URL('/auth/onboarding', requestUrl.origin);
        onboardingUrl.searchParams.set('next', next);
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
