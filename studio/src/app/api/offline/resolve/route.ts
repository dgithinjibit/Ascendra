import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.resolutionData?.action ?? 'keep-server';
    const requestId = body?.requestId ?? 'unknown';
    const originalUrl = body?.originalUrl ?? '/';

    if (!body?.requestId) {
      return NextResponse.json({ ok: false, error: 'Missing requestId' }, { status: 400 });
    }

    // Placeholder merge logic for the offline-first workflow.
    // This can later be exchanged for a DB-backed reconciliation or an event ingestion pipeline.
    const result = {
      ok: true,
      requestId,
      action,
      resolvedAt: new Date().toISOString(),
      message: `Conflict resolved via ${action}`,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('Error handling offline resolution:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export const runtime = 'edge';
