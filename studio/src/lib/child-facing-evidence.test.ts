import { describe, expect, it } from 'vitest'
import { CHILD_FACING_GATES } from './child-facing-readiness'
import { createApprovalEvidenceBundle, verifyApprovalEvidenceBundle } from './child-facing-evidence'

const evidence = { status: 'pass' as const, reviewerStatus: 'verified' as const, reviewerRef: 'reviewer:education-01', testRefs: ['test:student-sandbox', 'test:role-rls'] }

describe('child-facing approval evidence bundle', () => {
  it('creates and verifies a complete redacted hash chain', () => {
    const bundle = createApprovalEvidenceBundle({
      bundleId: 'bundle:2026-08-27:001',
      environment: 'staging',
      createdAt: '2026-08-27T00:00:00.000Z',
      gates: Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, evidence])),
      roles: { student: evidence, teacher: evidence, head: evidence, parent: evidence },
    })
    expect(bundle.records).toHaveLength(14)
    expect(bundle.records.every((record) => record.reviewerStatus === 'verified')).toBe(true)
    expect(bundle.records.some((record) => 'learnerId' in record || 'rawAnswer' in record)).toBe(false)
    expect(verifyApprovalEvidenceBundle(bundle)).toBe(true)
  })

  it('detects tampering in a chained record', () => {
    const bundle = createApprovalEvidenceBundle({
      bundleId: 'bundle:tamper-test',
      environment: 'local',
      createdAt: '2026-08-27T00:00:00.000Z',
      gates: {},
      roles: {},
    })
    const tampered = structuredClone(bundle)
    tampered.records[0].status = 'pass'
    expect(verifyApprovalEvidenceBundle(tampered)).toBe(false)
  })

  it('rejects unsafe references that could contain learner content', () => {
    expect(() => createApprovalEvidenceBundle({
      bundleId: 'bundle:unsafe',
      environment: 'local',
      createdAt: '2026-08-27T00:00:00.000Z',
      gates: { safeguarding: { status: 'pass', testRefs: ['raw learner answer: octopus'] } },
      roles: {},
    })).toThrow('unsafe_evidence_reference')
  })
})
