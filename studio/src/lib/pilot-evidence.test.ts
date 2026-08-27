import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { summarizePilotEvidence, verifyPilotEvidencePackage, type PilotEvidencePackage } from './pilot-evidence'

function makePackage(): PilotEvidencePackage {
  const records = (['student', 'teacher', 'head', 'parent'] as const).map((role) => ({
    role,
    status: 'pass' as const,
    environment: 'staging' as const,
    httpStatus: 200,
    checkedAt: '2026-08-27T02:00:00.000Z',
    routeRef: `/role/${role}/health`,
    testRefs: ['test:staging-role'],
    synthetic: false as const,
  }))
  const unsigned = { schemaVersion: 'syncsenta.pilot-evidence.v1' as const, packageId: 'pilot:staging:001', environment: 'staging' as const, createdAt: '2026-08-27T02:00:00.000Z', records }
  return { ...unsigned, packageDigest: createHash('sha256').update(JSON.stringify(unsigned)).digest('hex') }
}

describe('pilot evidence', () => {
  it('accepts complete non-synthetic staging coverage', () => {
    const pkg = makePackage()
    expect(verifyPilotEvidencePackage(pkg)).toBe(true)
    expect(summarizePilotEvidence(pkg)).toEqual({ status: 'ready', evidenceValid: true, passedRoles: 4, requiredRoles: 4, blockingRoles: [] })
  })

  it('blocks missing or duplicate role coverage', () => {
    const pkg = makePackage()
    pkg.records[3] = { ...pkg.records[3], role: 'student' }
    expect(verifyPilotEvidencePackage(pkg)).toBe(false)
    expect(summarizePilotEvidence(pkg).status).toBe('blocked')
  })

  it('blocks tampering and synthetic provenance', () => {
    const pkg = makePackage()
    pkg.records[0].status = 'fail'
    expect(verifyPilotEvidencePackage(pkg)).toBe(false)
    const synthetic = makePackage()
    synthetic.records[0].synthetic = true as never
    expect(verifyPilotEvidencePackage(synthetic)).toBe(false)
  })

  it('reports failed role coverage without exposing records', () => {
    const pkg = makePackage()
    pkg.records[1].status = 'fail'
    const summary = summarizePilotEvidence(pkg)
    expect(summary).toEqual({ status: 'blocked', evidenceValid: false, passedRoles: 3, requiredRoles: 4, blockingRoles: ['teacher'] })
    expect(JSON.stringify(summary)).not.toContain('student')
  })
})
