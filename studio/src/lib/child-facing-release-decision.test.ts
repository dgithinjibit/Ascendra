import { describe, expect, it } from 'vitest'
import { CHILD_FACING_GATES } from './child-facing-readiness'
import { createApprovalEvidenceBundle } from './child-facing-evidence'
import { evaluateChildFacingReleaseDecision } from './child-facing-release-decision'

function makeBundle(overrides: { environment?: 'local' | 'staging' | 'production'; roles?: Parameters<typeof createApprovalEvidenceBundle>[0]['roles'] } = {}) {
  return createApprovalEvidenceBundle({
    bundleId: 'bundle:release-test',
    environment: overrides.environment ?? 'staging',
    createdAt: '2026-08-27T00:00:00.000Z',
    gates: Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, { status: 'pass', reviewerStatus: 'verified', reviewerRef: 'reviewer:01', testRefs: ['test:release'] }])),
    roles: {
      student: { status: 'pass', reviewerStatus: 'verified' },
      teacher: { status: 'pass', reviewerStatus: 'verified' },
      head: { status: 'pass', reviewerStatus: 'verified' },
      parent: { status: 'pass', reviewerStatus: 'verified' },
      ...overrides.roles,
    },
  })
}

describe('evaluateChildFacingReleaseDecision', () => {
  it('approves only fully verified, valid, matching evidence', () => {
    const decision = evaluateChildFacingReleaseDecision(makeBundle(), 'staging')
    expect(decision.status).toBe('approved')
    expect(decision.reason).toBe('approved')
  })

  it('blocks unreviewed evidence', () => {
    const decision = evaluateChildFacingReleaseDecision(makeBundle({ roles: { student: { status: 'pass', reviewerStatus: 'pending' } } }), 'staging')
    expect(decision.status).toBe('blocked')
    expect(decision.reason).toBe('unreviewed_evidence')
  })

  it('blocks an environment mismatch', () => {
    const decision = evaluateChildFacingReleaseDecision(makeBundle(), 'production')
    expect(decision.status).toBe('blocked')
    expect(decision.reason).toBe('evidence_environment_mismatch')
  })

  it('blocks tampered evidence before readiness can approve it', () => {
    const tampered = makeBundle()
    tampered.records[0].status = 'fail'
    const decision = evaluateChildFacingReleaseDecision(tampered, 'staging')
    expect(decision.status).toBe('blocked')
    expect(decision.reason).toBe('invalid_evidence')
  })
})
