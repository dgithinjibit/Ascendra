import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Demo login endpoint — signs in as a preset demo user and redirects
 * to the appropriate dashboard.
 *
 * Only active when NEXT_PUBLIC_DEMO_MODE=true (set in Vercel staging env).
 * Never expose this in production.
 */

const DEMO_USERS: Record<string, {
  email: string;
  password: string;
  redirect: string;
  grade?: string;
  level?: string;
}> = {
  student: {
    email: 'student01@syncsenta.dev',
    password: 'Demo@Student01',
    redirect: '/student',
    grade: 'Grade 5',
    level: 'upper-primary',
  },
  teacher: {
    email: 'teacher01@syncsenta.dev',
    password: 'Demo@Teacher01',
    redirect: '/teacher/dashboard',
  },
  head: {
    email: 'head01@syncsenta.dev',
    password: 'Demo@Head01',
    redirect: '/teacher/dashboard',
  },
  parent: {
    email: 'parent01@syncsenta.dev',
    password: 'Demo@Parent01',
    redirect: '/dashboard',
  },
};

export async function POST(request: NextRequest) {
  // Safety guard — only allow in demo/staging mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Demo mode is not enabled.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const role = (body?.role ?? '').toLowerCase() as string;
  const demo = DEMO_USERS[role];

  if (!demo) {
    return NextResponse.json({ error: `Unknown demo role: ${role}` }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  // Sign in using the anon client — this sets the session cookie via response
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: demo.email,
    password: demo.password,
  });

  if (error || !data.session) {
    console.error('[demo-login] sign-in failed:', error?.message);
    return NextResponse.json(
      { error: 'Demo login failed. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    redirect: demo.redirect,
    grade: demo.grade ?? null,
    level: demo.level ?? null,
  });
}
