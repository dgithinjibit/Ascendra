import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_BODY_BYTES = 16 * 1024;

function internalClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function authorized(request: NextRequest) {
  const expected = process.env.SYNC_SENTA_SCHOOL_REVIEW_TOKEN;
  const supplied = request.headers.get('x-syncsenta-school-review-token');
  return Boolean(expected && supplied && supplied === expected);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = internalClient();
  if (!supabase) return NextResponse.json({ error: 'Reviewer service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('school_onboarding_requests')
    .select('id, contact_name, contact_email, school_name, county, school_code, school_type, classes, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) {
    console.error('[school-review] list failed:', error.code);
    return NextResponse.json({ error: 'Reviewer service is temporarily unavailable.' }, { status: 503 });
  }
  return NextResponse.json({ requests: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
  try {
    const body = await request.json();
    const requestId = typeof body.requestId === 'string' ? body.requestId : '';
    const action = body.action === 'approve' || body.action === 'reject' ? body.action : null;
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !action) {
      return NextResponse.json({ error: 'requestId and action are required.' }, { status: 400 });
    }

    const supabase = internalClient();
    if (!supabase) return NextResponse.json({ error: 'Reviewer service is not configured.' }, { status: 503 });

    const { data: registration, error: fetchError } = await supabase
      .from('school_onboarding_requests')
      .select('id, school_name, county, school_code, school_type, classes, status')
      .eq('id', requestId)
      .eq('status', 'pending')
      .maybeSingle();
    if (fetchError) return NextResponse.json({ error: 'Unable to read registration.' }, { status: 503 });
    if (!registration) return NextResponse.json({ error: 'Pending registration not found.' }, { status: 404 });

    if (action === 'reject') {
      const { error } = await supabase.from('school_onboarding_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', requestId).eq('status', 'pending');
      if (error) return NextResponse.json({ error: 'Unable to reject registration.' }, { status: 503 });
      return NextResponse.json({ success: true, status: 'rejected' });
    }

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .upsert({ name: registration.school_name, county: registration.county, code: registration.school_code, status: 'active' }, { onConflict: 'name,county' })
      .select('id, name, county, code, status')
      .single();
    if (schoolError || !school) return NextResponse.json({ error: 'Unable to publish school.' }, { status: 503 });

    const classes = Array.isArray(registration.classes) ? registration.classes.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
    if (classes.length > 0) {
      const classRows = classes.map((name) => ({ school_id: school.id, name, grade: name, status: 'active' }));
      const { error: classError } = await supabase.from('school_classes').upsert(classRows, { onConflict: 'school_id,name,academic_year', ignoreDuplicates: true });
      if (classError) return NextResponse.json({ error: 'Unable to publish school classes.' }, { status: 503 });
    }

    const { error: updateError } = await supabase.from('school_onboarding_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', requestId).eq('status', 'pending');
    if (updateError) return NextResponse.json({ error: 'School was published but registration status could not be updated.' }, { status: 503 });
    return NextResponse.json({ success: true, status: 'approved', school: { id: school.id, name: school.name, county: school.county, code: school.code } });
  } catch {
    return NextResponse.json({ error: 'Invalid reviewer request.' }, { status: 400 });
  }
}
