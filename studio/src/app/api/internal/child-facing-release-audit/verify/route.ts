import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyChildFacingReleaseAudit, type ChildFacingReleaseAudit } from '@/lib/child-facing-release-audit'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const auditSchema = z.object({
  schemaVersion: z.literal('syncsenta.child-facing-release-audit.v1'),
  auditId: z.string().regex(/^[A-Za-z0-9._:/-]{1,240}$/),
  createdAt: z.string().datetime({ offset: true }),
  environment: z.enum(['local', 'staging', 'production']),
  status: z.enum(['approved', 'blocked']),
  reason: z.enum(['approved', 'invalid_evidence', 'evidence_environment_mismatch', 'unreviewed_evidence', 'readiness_blocked', 'production_configuration_blocked']),
  evidenceDigest: digest,
  evidenceValid: z.boolean(),
  evidenceReviewed: z.boolean(),
  passedGates: z.number().int().nonnegative(),
  requiredGates: z.number().int().positive(),
  passedRoles: z.number().int().nonnegative(),
  requiredRoles: z.number().int().positive(),
  blockingGateCount: z.number().int().nonnegative(),
  blockingRoleCount: z.number().int().nonnegative(),
  auditDigest: digest,
}).strict()

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const expected = process.env.SYNC_SENTA_RELEASE_CHECK_TOKEN
  return Boolean(expected && request.headers.get('x-syncsenta-release-token') === expected)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'audit_verify_unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const parsed = auditSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_release_audit' }, { status: 400 })

  const valid = verifyChildFacingReleaseAudit(parsed.data as ChildFacingReleaseAudit)
  return NextResponse.json({ valid, schemaVersion: parsed.data.schemaVersion, auditDigest: parsed.data.auditDigest }, {
    status: valid ? 200 : 422,
    headers: { 'Cache-Control': 'no-store' },
  })
}
