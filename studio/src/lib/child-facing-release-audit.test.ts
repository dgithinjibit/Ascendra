import { describe, expect, it } from 'vitest'
import { CHILD_FACING_GATES } from './child-facing-readiness'
import { createApprovalEvidenceBundle } from './child-facing-evidence'
import { evaluateChildFacingReleaseDecision } from './child-facing-release-decision'
import { createChildFacingReleaseAudit } from './child-facing-release-audit'

function makeBundle() {
  return createApprovalEvidenceBundle({
    bundleId: 'bundle:audit-test',
    environment: 'staging',
    createdAt: '2026-08-27T00:00:00.000Z',
    gates: Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, { status: 'pass', reviewerStatus: 'verified', reviewerRef: 'reviewer:01', testRefs: ['test:audit'] }])),
    roles: { student: { status: 'pass', reviewerStatus: 'verified' }, teacher: { status: 'pass', reviewerStatus: 'verified' }, head: { status: 'pass', reviewerStatus: 'verified' }, parent: { status: 'pass', reviewerStatus: 'verified' } },
  })
}

describe('createChildFacingReleaseAudit', () => {
  it('creates a deterministic redacted audit record', () => {
    const bundle = makeBundle()
    const decision = evaluateChildFacingReleaseDecision(bundle, 'staging', { NODE_ENV: 'staging' })
    const first = createChildFacingReleaseAudit(decision, bundle, '2026-08-27T01:00:00.000Z')
    const second = createChildFacingReleaseAudit(decision, bundle, '2026-08-27T01:00:00.000Z')
    expect(first).toEqual(second)
    expect(first.evidenceDigest).toBe(bundle.digest)
    expect(first.auditDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(first)).not.toContain('reviewer:01')
    expect(JSON.stringify(first)).not.toContain('test:audit')
  })

  it('records blocked decisions without exposing evidence records', () => {
    const bundle = makeBundle()
    bundle.records[0].status = 'fail'
    const decision = evaluateChildFacingReleaseDecision(bundle, 'staging', { NODE_ENV: 'staging' })
    const audit = createChildFacingReleaseAudit(decision, bundle, '2026-08-27T01:00:00.000Z')
    expect(audit.status).toBe('blocked')
    expect(audit.reason).toBe('invalid_evidence')
    expect(Object.keys(audit).sort()).toEqual([
      'auditDigest', 'auditId', 'blockingGateCount', 'blockingRoleCount', 'createdAt', 'environment',
      'evidenceDigest', 'evidenceReviewed', 'evidenceValid', 'passedGates', 'passedRoles', 'reason',
      'requiredGates', 'requiredRoles', 'schemaVersion', 'status',
    ].sort())
  })
})
