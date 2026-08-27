import { describe, expect, it, vi } from 'vitest'
import { CHILD_FACING_GATES } from '@/lib/child-facing-readiness'
import { createApprovalEvidenceBundle } from '@/lib/child-facing-evidence'
import { evaluateChildFacingReleaseDecision } from '@/lib/child-facing-release-decision'
import { createChildFacingReleaseAudit } from '@/lib/child-facing-release-audit'
import { POST } from './route'

function makeAudit() {
  const bundle = createApprovalEvidenceBundle({
    bundleId: 'bundle:audit-route-test',
    environment: 'staging',
    createdAt: '2026-08-27T00:00:00.000Z',
    gates: Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, { status: 'pass', reviewerStatus: 'verified', testRefs: ['test:audit-route'] }])),
    roles: { student: { status: 'pass', reviewerStatus: 'verified' }, teacher: { status: 'pass', reviewerStatus: 'verified' }, head: { status: 'pass', reviewerStatus: 'verified' }, parent: { status: 'pass', reviewerStatus: 'verified' } },
  })
  return createChildFacingReleaseAudit(evaluateChildFacingReleaseDecision(bundle, 'staging', { NODE_ENV: 'staging' }), bundle, '2026-08-27T01:00:00.000Z')
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/internal/child-facing-release-audit/verify', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
}

describe('child-facing release audit verification route', () => {
  it('verifies a valid audit and returns only its digest metadata', async () => {
    const audit = makeAudit()
    const response = await POST(request(audit))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ valid: true, schemaVersion: audit.schemaVersion, auditDigest: audit.auditDigest })
  })

  it('rejects a tampered audit', async () => {
    const audit = makeAudit()
    audit.reason = 'readiness_blocked'
    const response = await POST(request(audit))
    expect(response.status).toBe(422)
  })

  it('rejects malformed audit input', async () => {
    const response = await POST(request({ auditDigest: 'not-a-digest' }))
    expect(response.status).toBe(400)
  })

  it('requires authorization in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SYNC_SENTA_RELEASE_CHECK_TOKEN', 'expected')
    const response = await POST(request(makeAudit(), { 'x-syncsenta-release-token': 'wrong' }))
    expect(response.status).toBe(401)
    vi.unstubAllEnvs()
  })
})
