import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const CheckIn = z.object({
  consent_version: z.string().min(1).max(40),
  state: z.enum(['ready', 'unsure', 'tired', 'upset', 'needs_help', 'prefer_not_to_say']),
  note: z.string().max(500).optional(),
  support_requested: z.boolean().default(false),
  visibility: z.enum(['student_only', 'teacher', 'teacher_and_parent', 'safeguarding_team']).default('student_only'),
});

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('wellbeing_checkins').select('id, consent_version, consented_at, state, support_requested, visibility, created_at').eq('student_id', user.id).order('created_at', { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: 'Unable to load check-ins' }, { status: 500 });
  return NextResponse.json({ checkins: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = CheckIn.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid check-in', detail: parsed.error.issues.map((issue) => issue.message).join('; ') }, { status: 400 });
  const { data, error } = await supabase.from('wellbeing_checkins').insert({ student_id: user.id, ...parsed.data }).select('id, consent_version, state, support_requested, visibility, created_at').single();
  if (error) return NextResponse.json({ error: 'Unable to save check-in' }, { status: 500 });
  return NextResponse.json({ checkin: data }, { status: 201 });
}
