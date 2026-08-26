import { NextRequest } from 'next/server';
import { buildApiUrl } from '@/lib/api-config';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  let target: string;
  try {
    target = buildApiUrl('/lesson-architect/generate-exam');
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend not configured' }), { status: 502 });
  }

  const supabase = getSupabaseServerClient();
  const authResult = await supabase.auth.getUser().catch(() => null);
  const user = authResult?.data?.user ?? null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user?.id) headers['X-Forwarded-User'] = user.id;

  const res = await fetch(target, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
}
