import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Personalization endpoint backing the student dashboard.
 *
 * Reads real data from Supabase:
 *   - `action=profile`  → profiles table (authenticated user's own row)
 *   - `action=progress` → student_sessions + behavioral_profiles aggregated per subject
 *
 * Falls back gracefully when Supabase isn't configured or the user has no data yet.
 *
 * Supported queries:
 *   GET /api/test-personalization?action=profile&userId=<id>
 *   GET /api/test-personalization?action=progress&userId=<id>&subject=<name>
 */

function makeSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // ------------------------------------------------------------------
  // action=profile
  // ------------------------------------------------------------------
  if (action === 'profile') {
    const supabase = makeSupabaseClient();

    if (supabase) {
      try {
        // Identify the calling user from the session cookie.
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: row, error } = await supabase
            .from('profiles')
            .select(
              'id, full_name, role, grade, language_preference, region, subjects',
            )
            .eq('id', user.id)
            .single();

          if (!error && row) {
            return NextResponse.json({
              success: true,
              profile: {
                id: row.id,
                name: row.full_name ?? user.email ?? 'Learner',
                grade: row.grade ?? 'Grade 4',
                preferredLanguage: (row.language_preference as
                  | 'english'
                  | 'kiswahili'
                  | 'mixed') ?? 'mixed',
                learningStyle: 'visual',
                interests: [],
                strengths: row.subjects ?? [],
                challenges: [],
                culturalContext: {
                  region: row.region ?? 'Kenya',
                  culturalReferences: [],
                },
              },
            });
          }
        }
      } catch {
        // Fall through to empty-state response below.
      }
    }

    // Unauthenticated / DB unavailable — return an empty-state profile so the
    // UI renders the "continue as guest" path without hard-coding fake names.
    return NextResponse.json({
      success: true,
      profile: {
        id: 'guest',
        name: 'Learner',
        grade: 'Grade 4',
        preferredLanguage: 'mixed' as const,
        learningStyle: 'visual',
        interests: [],
        strengths: [],
        challenges: [],
        culturalContext: { region: 'Kenya', culturalReferences: [] },
      },
    });
  }

  // ------------------------------------------------------------------
  // action=progress
  // ------------------------------------------------------------------
  if (action === 'progress') {
    const subject = searchParams.get('subject');
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'subject parameter is required' },
        { status: 400 },
      );
    }

    const supabase = makeSupabaseClient();

    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Pull all sessions for this user + subject, newest first.
          const { data: sessions } = await supabase
            .from('student_sessions')
            .select('session_id, started_at, ended_at, created_at')
            .eq('student_id', user.id)
            .eq('subject', subject)
            .order('created_at', { ascending: false })
            .limit(100);

          if (sessions && sessions.length > 0) {
            // Pull mastery scores from behavioral_profiles for these sessions.
            const sessionIds = sessions.map((s) => s.session_id);
            const { data: profiles } = await supabase
              .from('behavioral_profiles')
              .select('mastery_indicator, created_at')
              .in('session_id', sessionIds);

            const masteries = (profiles ?? [])
              .map((p) => p.mastery_indicator as number | null)
              .filter((m): m is number => m != null);

            const overallProgress =
              masteries.length > 0
                ? Math.round(
                    (masteries.reduce((a, b) => a + b, 0) / masteries.length) * 100,
                  )
                : 0;

            // Streak: count consecutive days ending today that had a session.
            const sessionDays = new Set(
              sessions.map((s) =>
                new Date(s.created_at).toISOString().slice(0, 10),
              ),
            );
            let streakDays = 0;
            const today = new Date();
            for (let i = 0; i < 365; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const key = d.toISOString().slice(0, 10);
              if (sessionDays.has(key)) {
                streakDays++;
              } else {
                break;
              }
            }

            const totalMinutes = sessions.reduce((acc, s) => {
              if (!s.started_at || !s.ended_at) return acc;
              const diff =
                (new Date(s.ended_at).getTime() -
                  new Date(s.started_at).getTime()) /
                60000;
              return acc + Math.max(0, diff);
            }, 0);

            return NextResponse.json({
              success: true,
              progress: {
                overallProgress,
                streakDays,
                totalSessions: sessions.length,
                averageSessionTime:
                  sessions.length > 0
                    ? Math.round(totalMinutes / sessions.length)
                    : 0,
              },
            });
          }
        }
      } catch {
        // Fall through to zero-state response.
      }
    }

    // No data yet — return zero-state so new users see an empty dashboard
    // rather than fabricated numbers.
    return NextResponse.json({
      success: true,
      progress: {
        overallProgress: 0,
        streakDays: 0,
        totalSessions: 0,
        averageSessionTime: 0,
      },
    });
  }

  return NextResponse.json(
    { success: false, error: `unknown action: ${action}` },
    { status: 400 },
  );
}
