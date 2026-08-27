import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CHILD_FACING_GATES,
  evaluateChildFacingReadiness,
  isChildFacingProductionConfigurationSafe,
  type ChildFacingGate,
  type ChildFacingRole,
} from '@/lib/child-facing-readiness'

const status = z.enum(['pass', 'fail', 'unknown'])
const gateSchema = z.object(Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, status.optional()])) as Record<ChildFacingGate, z.ZodOptional<typeof status>>).strict()
const roleSchema = z.object({
  student: status.optional(),
  teacher: status.optional(),
  head: status.optional(),
  parent: status.optional(),
}).strict()
const requestSchema = z.object({ gates: gateSchema, roles: roleSchema }).strict()

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const expected = process.env.SYNC_SENTA_RELEASE_CHECK_TOKEN
  const provided = request.headers.get('x-syncsenta-release-token')
  return Boolean(expected && provided && provided === expected)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'release_check_unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  const safeConfiguration = isChildFacingProductionConfigurationSafe({
    nodeEnv: process.env.NODE_ENV,
    syntheticData: process.env.SYNC_SENTA_ALLOW_SYNTHETIC_DATA === 'true',
    mockAuth: process.env.SYNC_SENTA_USE_MOCK_AUTH === 'true' || process.env.REQUIRE_MOCK_AUTH === 'true',
    biometricProcessing: process.env.SYNC_SENTA_ENABLE_BIOMETRIC_PROCESSING === 'true',
  })
  if (!safeConfiguration) {
    return NextResponse.json({ error: 'production_configuration_blocked' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json({
    status: 'blocked',
    reason: 'evidence_not_submitted',
    requiredGates: CHILD_FACING_GATES,
    requiredRoles: ['student', 'teacher', 'head', 'parent'],
    evidenceSource: 'operator-submitted-release-evidence',
  }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'release_check_unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const safeConfiguration = isChildFacingProductionConfigurationSafe({
    nodeEnv: process.env.NODE_ENV,
    syntheticData: process.env.SYNC_SENTA_ALLOW_SYNTHETIC_DATA === 'true',
    mockAuth: process.env.SYNC_SENTA_USE_MOCK_AUTH === 'true' || process.env.REQUIRE_MOCK_AUTH === 'true',
    biometricProcessing: process.env.SYNC_SENTA_ENABLE_BIOMETRIC_PROCESSING === 'true',
  })
  if (!safeConfiguration) {
    return NextResponse.json({ error: 'production_configuration_blocked' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_release_check_payload' }, { status: 400 })

  const result = evaluateChildFacingReadiness(parsed.data)
  return NextResponse.json({ ...result, evidenceSource: 'operator-submitted-release-evidence' }, {
    status: result.status === 'approved' ? 200 : 409,
    headers: { 'Cache-Control': 'no-store' },
  })
}
