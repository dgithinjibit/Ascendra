import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyApprovalEvidenceBundle, type ApprovalEvidenceBundle } from '@/lib/child-facing-evidence'

const MAX_BODY_BYTES = 64 * 1024
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const record = z.object({
  subject: z.enum(['gate', 'role']),
  key: z.string().min(1).max(64),
  status: z.enum(['pass', 'fail', 'unknown']),
  environment: z.enum(['local', 'staging', 'production']),
  recordedAt: z.string().datetime({ offset: true }),
  reviewerStatus: z.enum(['unassigned', 'pending', 'verified', 'rejected']),
  reviewerRef: z.string().regex(/^[A-Za-z0-9._:/-]{1,160}$/).optional(),
  testRefs: z.array(z.string().regex(/^[A-Za-z0-9._:/-]{1,160}$/)).max(32),
  previousDigest: digest,
  digest,
}).strict()
const bundle = z.object({
  schemaVersion: z.literal('syncsenta.child-facing-evidence.v1'),
  bundleId: z.string().regex(/^[A-Za-z0-9._:/-]{1,160}$/),
  environment: z.enum(['local', 'staging', 'production']),
  createdAt: z.string().datetime({ offset: true }),
  records: z.array(record).length(14),
  digest,
}).strict()

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const expected = process.env.SYNC_SENTA_RELEASE_CHECK_TOKEN
  const provided = request.headers.get('x-syncsenta-release-token')
  return Boolean(expected && provided && provided === expected)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'evidence_verify_unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'evidence_bundle_too_large' }, { status: 413 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = bundle.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_evidence_bundle' }, { status: 400 })

  const valid = verifyApprovalEvidenceBundle(parsed.data as ApprovalEvidenceBundle)
  return NextResponse.json({ valid, schemaVersion: parsed.data.schemaVersion, environment: parsed.data.environment }, {
    status: valid ? 200 : 422,
    headers: { 'Cache-Control': 'no-store' },
  })
}
