/**
 * Auth Callback Route
 * 
 * Handles OAuth callbacks (Google, etc.) and email confirmations.
 * Redirects users to the appropriate page after authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const flow = requestUrl.searchParams.get('flow');

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
    }

    if (data.user && flow === 'signup') {
      const setupUrl = new URL('/auth/set-password', requestUrl.origin);
      setupUrl.searchParams.set('next', next);
      return NextResponse.redirect(setupUrl);
    }

    // Check if profile exists
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // If no profile, redirect to onboarding
      if (!profile) {
        return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin));
      }
    }
  }

  // Redirect to the next URL or home
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
