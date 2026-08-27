import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getClientIP,
  rateLimiter,
  sanitizeIdentifier,
  formatDuration,
  validateInputLength,
} from '@/lib/security-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCHOOL_TYPES = new Set(['primary', 'junior_secondary', 'senior_secondary', 'integrated', 'special']);
const MAX_CLASSES = 40;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  const identifier = sanitizeIdentifier(getClientIP(request.headers));
  if (!rateLimiter.isAllowed(identifier, 'signup')) {
    const blockedTime = rateLimiter.getBlockedTime(identifier);
    return NextResponse.json(
      { error: 'Too many submissions', message: `Please try again in ${formatDuration(blockedTime)}` },
      { status: 429, headers: { 'Retry-After': Math.ceil(blockedTime / 1000).toString() } },
    );
  }

  try {
    const body = await request.json();
    const contactName = text(body.contactName);
    const contactEmail = text(body.contactEmail).toLowerCase();
    const schoolName = text(body.schoolName);
    const county = text(body.county);
    const schoolCode = text(body.schoolCode) || null;
    const schoolType = text(body.schoolType);
    const classes: string[] = Array.isArray(body.classes)
      ? body.classes.map(text).filter((item: string) => Boolean(item)).slice(0, MAX_CLASSES)
      : [];

    const fields: Array<[string, string, number, number]> = [
      ['Contact name', contactName, 2, 120],
      ['School name', schoolName, 2, 200],
      ['County', county, 2, 80],
    ];
    for (const [label, value, min, max] of fields) {
      const validation = validateInputLength(value, label, max, min);
      if (!validation.isValid) {
        rateLimiter.recordAttempt(identifier, 'signup');
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }
    if (!EMAIL_RE.test(contactEmail) || contactEmail.length > 254) {
      rateLimiter.recordAttempt(identifier, 'signup');
      return NextResponse.json({ error: 'Enter a valid contact email.' }, { status: 400 });
    }
    if (!SCHOOL_TYPES.has(schoolType)) {
      rateLimiter.recordAttempt(identifier, 'signup');
      return NextResponse.json({ error: 'Select a valid school type.' }, { status: 400 });
    }
    if (classes.length === 0 || classes.some((item) => item.length > 120)) {
      rateLimiter.recordAttempt(identifier, 'signup');
      return NextResponse.json({ error: 'Add at least one valid class or grade.' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'School registration is temporarily unavailable.' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('school_onboarding_requests')
      .insert({
        contact_name: contactName,
        contact_email: contactEmail,
        school_name: schoolName,
        county,
        school_code: schoolCode,
        school_type: schoolType,
        classes,
        status: 'pending',
        source: 'manual_school_onboarding',
      })
      .select('id, status, created_at')
      .single();

    if (error) {
      rateLimiter.recordAttempt(identifier, 'signup');
      console.error('[school-onboarding] submission failed:', error.code);
      return NextResponse.json({ error: 'School registration is temporarily unavailable.' }, { status: 503 });
    }

    rateLimiter.reset(identifier);
    return NextResponse.json({
      success: true,
      message: 'School registration received for review.',
      data: { id: data.id, status: data.status, createdAt: data.created_at },
    }, { status: 201 });
  } catch {
    rateLimiter.recordAttempt(identifier, 'signup');
    return NextResponse.json({ error: 'Enter valid school registration details.' }, { status: 400 });
  }
}
