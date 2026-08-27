import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function currentTeacher() {
  const supabase = getSupabaseServerClient();
  const auth = await supabase.auth.getUser().catch(() => null);
  const user = auth?.data?.user ?? null;
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['teacher', 'admin'].includes(profile.role)) return { supabase, user: null };
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await currentTeacher();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase
    .from('teacher_assessments')
    .select('id, grade, subject, term, assessment_period, title, total_marks, status, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Unable to load assessments' }, { status: 500 });
  return NextResponse.json({ assessments: data || [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await currentTeacher();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.grade || !body?.subject || !body?.term || !body?.assessment_period || !body?.title) {
    return NextResponse.json({ error: 'grade, subject, term, assessment_period, and title are required' }, { status: 400 });
  }
  const { data, error } = await supabase.from('teacher_assessments').insert({
    teacher_id: user.id,
    grade: body.grade,
    subject: body.subject,
    term: body.term,
    assessment_period: body.assessment_period,
    title: body.title,
    instructions: body.instructions || null,
    questions: Array.isArray(body.questions) ? body.questions : [],
    total_marks: Number.isFinite(body.total_marks) ? body.total_marks : 0,
    status: 'draft',
  }).select('id, grade, subject, term, assessment_period, title, total_marks, status, created_at').single();
  if (error) return NextResponse.json({ error: 'Unable to save assessment draft' }, { status: 500 });
  return NextResponse.json({ assessment: data }, { status: 201 });
}
