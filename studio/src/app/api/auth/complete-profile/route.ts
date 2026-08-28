import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type Role = 'student' | 'teacher' | 'parent' | 'admin';

const ROLES = new Set<Role>(['student', 'teacher', 'parent', 'admin']);
const GRADES = new Set(['PP1', 'PP2', ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`)]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeNext(value: unknown) {
  const next = typeof value === 'string' ? value : '/';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export async function POST(request: NextRequest) {
  const authClient = await createSupabaseRouteHandlerClient();
  const { data: authData, error: authError } = await authClient.auth.getUser();
  const user = authData.user;
  if (authError || !user) return NextResponse.json({ error: 'Your secure session has expired. Please sign in again.' }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid profile request.' }, { status: 400 });

  const roleValue = cleanText(body.role, 20);
  const role = roleValue as Role;
  const email = cleanText(user.email, 320);
  const fullName = cleanText(body.fullName, 120) || cleanText(user.user_metadata?.full_name, 120);
  const grade = cleanText(body.grade, 20);
  const schoolId = cleanText(body.schoolId, 80);
  const classroomId = cleanText(body.classroomId, 80);
  const schoolName = cleanText(body.schoolName, 160);

  if (!ROLES.has(role) || !fullName) return NextResponse.json({ error: 'Choose a valid role and provide your full name.' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'Google did not provide an email address for this account.' }, { status: 400 });
  if (role === 'student' && grade && !GRADES.has(grade)) return NextResponse.json({ error: 'Choose a valid CBC grade.' }, { status: 400 });
  if (role === 'admin' && !schoolId) return NextResponse.json({ error: 'Heads of School must select an approved school.' }, { status: 400 });
  if (classroomId && !schoolId) return NextResponse.json({ error: 'Choose a school before selecting a class.' }, { status: 400 });

  // The generated Database type predates the canonical students directory columns;
  // keep this service-role boundary explicit and server-only until types regenerate.
  const admin = getSupabaseServerClient() as any;
  let verifiedSchoolName: string | null = schoolName || null;
  if (schoolId) {
    const { data: school, error: schoolError } = await admin
      .from('schools')
      .select('id,name,status')
      .eq('id', schoolId)
      .eq('status', 'active')
      .maybeSingle();
    if (schoolError || !school) return NextResponse.json({ error: 'That school is not currently available.' }, { status: 400 });
    verifiedSchoolName = school.name;
  } else if (role === 'student') {
    verifiedSchoolName = null;
  }

  let verifiedClassName: string | null = null;
  if (classroomId) {
    const { data: classroom, error: classroomError } = await admin
      .from('school_classes')
      .select('id,name,grade,school_id,status')
      .eq('id', classroomId)
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .maybeSingle();
    if (classroomError || !classroom) return NextResponse.json({ error: 'That class is not currently available.' }, { status: 400 });
    if (grade && classroom.grade !== grade) return NextResponse.json({ error: 'Choose a class in the selected grade.' }, { status: 400 });
    verifiedClassName = classroom.name;
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    email,
    full_name: fullName,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    role,
    grade: role === 'student' ? grade || null : null,
    school_name: verifiedSchoolName,
    language_preference: role === 'student' ? 'mixed' : 'english',
    timezone: 'Africa/Nairobi',
    subscription_tier: 'free',
    subscription_status: 'active',
  }, { onConflict: 'id' });
  if (profileError) {
    console.error('[auth/complete-profile] profile upsert failed:', profileError.message);
    return NextResponse.json({ error: 'We could not finish your profile. Please try again.' }, { status: 503 });
  }

  if (role === 'student') {
    const { error: studentError } = await admin.from('students').upsert({
      user_id: user.id,
      student_name: fullName,
      grade: grade || 'Grade 1',
      class_name: verifiedClassName,
      school_name: verifiedSchoolName,
      school_id: schoolId || null,
      classroom_id: classroomId || null,
      status: 'active',
    }, { onConflict: 'user_id' });
    if (studentError) {
      console.error('[auth/complete-profile] student upsert failed:', studentError.message);
      return NextResponse.json({ error: 'Your profile was saved, but the learner record could not be completed.' }, { status: 503 });
    }
  }

  return NextResponse.json({ success: true, next: safeNext(body.next) });
}
