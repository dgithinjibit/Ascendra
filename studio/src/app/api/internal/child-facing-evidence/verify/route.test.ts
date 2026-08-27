import { describe, expect, it, vi } from 'vitest'
import { CHILD_FACING_GATES } from '@/lib/child-facing-readiness'
import { createApprovalEvidenceBundle } from '@/lib/child-facing-evidence'
import { POST } from './route'

const bundle = createApprovalEvidenceBundle({
  bundleId: 'bundle:verify-test',
  environment: 'staging',
  createdAt: '2026-08-27T00:00:00.000Z',
  gates: Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, { status: 'pass', reviewerStatus: 'verified', reviewerRef: 'reviewer:01', testRefs: ['test:role-gate'] }])),
  roles: { student: { status: 'pass' }, teacher: { status: 'pass' }, head: { status: 'pass' }, parent: { status: 'pass' } },
})

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/internal/child-facing-evidence/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('child-facing evidence verification route', () => {
  it('verifies a valid bundle with a redacted response', async () => {
    const response = await POST(request(bundle))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ valid: true, schemaVersion: 'syncsenta.child-facing-evidence.v1', environment: 'staging' })
  })

  it('rejects a tampered bundle without exposing records', async () => {
    const tampered = structuredClone(bundle)
    tampered.records[0].status = 'fail'
    const response = await POST(request(tampered))
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ valid: false, schemaVersion: 'syncsenta.child-facing-evidence.v1', environment: 'staging' })
  })

  it('rejects malformed bundle structure', async () => {
    const response = await POST(request({ ...bundle, records: [] }))
    expect(response.status).toBe(400)
  })

  it('requires a release token in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SYNC_SENTA_RELEASE_CHECK_TOKEN', 'expected')
    const response = await POST(request(bundle, { 'x-syncsenta-release-token': 'wrong' }))
    expect(response.status).toBe(401)
    vi.unstubAllEnvs()
  })
})
