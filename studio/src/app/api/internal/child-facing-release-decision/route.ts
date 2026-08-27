import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CHILD_FACING_GATES } from '@/lib/child-facing-readiness'
import { evaluateChildFacingReleaseDecision } from '@/lib/child-facing-release-decision'
import type { ApprovalEvidenceBundle } from '@/lib/child-facing-evidence'
import { createChildFacingReleaseAudit } from '@/lib/child-facing-release-audit'

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
const requestSchema = z.object({
  expectedEnvironment: z.enum(['local', 'staging', 'production']),
  bundle: z.object({
    schemaVersion: z.literal('syncsenta.child-facing-evidence.v1'),
    bundleId: z.string().regex(/^[A-Za-z0-9._:/-]{1,160}$/),
    environment: z.enum(['local', 'staging', 'production']),
    createdAt: z.string().datetime({ offset: true }),
    records: z.array(record).length(CHILD_FACING_GATES.length + 4),
    digest,
  }).strict(),
}).strict()

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const expected = process.env.SYNC_SENTA_RELEASE_CHECK_TOKEN
  const provided = request.headers.get('x-syncsenta-release-token')
  return Boolean(expected && provided && provided === expected)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'release_decision_unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_release_decision_payload' }, { status: 400 })

  const decision = evaluateChildFacingReleaseDecision(parsed.data.bundle as ApprovalEvidenceBundle, parsed.data.expectedEnvironment, process.env)
  const audit = createChildFacingReleaseAudit(decision, parsed.data.bundle as ApprovalEvidenceBundle, new Date().toISOString())
  return NextResponse.json({
    status: decision.status,
    reason: decision.reason,
    evidenceValid: decision.evidenceValid,
    evidenceReviewed: decision.evidenceReviewed,
    readiness: decision.readiness,
    audit,
  }, { status: decision.reason === 'production_configuration_blocked' ? 503 : decision.status === 'approved' ? 200 : 409, headers: { 'Cache-Control': 'no-store' } })
}
