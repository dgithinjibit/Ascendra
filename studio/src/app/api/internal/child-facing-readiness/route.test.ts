import { describe, expect, it, vi } from 'vitest'
import { CHILD_FACING_GATES } from '@/lib/child-facing-readiness'
import { GET, POST } from './route'

const allPassing = Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, 'pass']))
const roles = { student: 'pass', teacher: 'pass', head: 'pass', parent: 'pass' }

const request = (body: unknown, headers: Record<string, string> = {}) => new Request('http://localhost/api/internal/child-facing-readiness', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
})

describe('internal child-facing readiness route', () => {
  it('returns a redacted blocked-by-default operator report', async () => {
    const response = await GET(new Request('http://localhost/api/internal/child-facing-readiness'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({ status: 'blocked', reason: 'evidence_not_submitted' })
    expect(body.requiredGates).toHaveLength(10)
    expect(body.requiredRoles).toEqual(['student', 'teacher', 'head', 'parent'])
    expect(body).not.toHaveProperty('learnerId')
    expect(body).not.toHaveProperty('secret')
  })

  it('returns approved only for complete passing evidence', async () => {
    const response = await POST(request({ gates: allPassing, roles }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'approved', passedGates: 10, passedRoles: 4 })
  })

  it('returns blocked for incomplete evidence', async () => {
    const response = await POST(request({ gates: { ...allPassing, privacy_consent: 'unknown' }, roles: { student: 'pass' } }))
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ status: 'blocked', blockingGates: ['privacy_consent'], blockingRoles: ['teacher', 'head', 'parent'] })
  })

  it('rejects invalid payloads', async () => {
    const response = await POST(request({ gates: {}, roles: {}, extra: true }))
    expect(response.status).toBe(400)
  })

  it('requires a token in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SYNC_SENTA_RELEASE_CHECK_TOKEN', 'correct-token')
    const response = await POST(request({ gates: allPassing, roles }, { 'x-syncsenta-release-token': 'wrong-token' }))
    expect(response.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('blocks unsafe production configuration even with a valid token', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SYNC_SENTA_RELEASE_CHECK_TOKEN', 'correct-token')
    vi.stubEnv('SYNC_SENTA_ALLOW_SYNTHETIC_DATA', 'true')
    const response = await POST(request({ gates: allPassing, roles }, { 'x-syncsenta-release-token': 'correct-token' }))
    expect(response.status).toBe(503)
    vi.unstubAllEnvs()
  })
})
