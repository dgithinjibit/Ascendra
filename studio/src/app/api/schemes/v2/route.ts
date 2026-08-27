import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api-config';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const authResult = await supabase.auth.getUser().catch(() => null);
  const user = authResult?.data?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Invalid teacher scope' }, { status: 403 });
  }

  let target: string;
  try {
    target = buildApiUrl('/api/v1/schemes/v2');
  } catch {
    return NextResponse.json({ error: 'Scheme persistence backend is not configured' }, { status: 503 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Forwarded-User': user.id,
  };
  const authorization = request.headers.get('authorization');
  if (authorization) headers.Authorization = authorization;

  try {
    const response = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.text();
    return new NextResponse(payload, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Scheme persistence backend unavailable' },
      { status: 503 },
    );
  }
}
