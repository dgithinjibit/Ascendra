import { NextResponse } from 'next/server'
import { z } from 'zod'
import { summarizePilotEvidence, type PilotEvidencePackage } from '@/lib/pilot-evidence'

const safeRef = z.string().regex(/^[A-Za-z0-9._:/-]{1,160}$/)
const schema = z.object({
  schemaVersion: z.literal('syncsenta.pilot-evidence.v1'),
  packageId: safeRef,
  environment: z.literal('staging'),
  createdAt: z.string().datetime({ offset: true }),
  records: z.array(z.object({
    role: z.enum(['student', 'teacher', 'head', 'parent']),
    status: z.enum(['pass', 'fail']),
    environment: z.literal('staging'),
    httpStatus: z.number().int().min(100).max(599),
    checkedAt: z.string().datetime({ offset: true }),
    routeRef: safeRef,
    testRefs: z.array(safeRef).max(32),
    synthetic: z.literal(false),
  }).strict()).length(4),
  packageDigest: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const expected = process.env.SYNC_SENTA_RELEASE_CHECK_TOKEN
  return Boolean(expected && request.headers.get('x-syncsenta-release-token') === expected)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'pilot_evidence_unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_pilot_evidence' }, { status: 400 })
  const summary = summarizePilotEvidence(parsed.data as PilotEvidencePackage)
  return NextResponse.json(summary, { status: summary.status === 'ready' ? 200 : 409, headers: { 'Cache-Control': 'no-store' } })
}
