import { describe, expect, it } from 'vitest'
import { POST } from './route'

const validPayload = {
  lessonId: 'fractions-1',
  grade: 'Grade 2',
  subject: 'Mathematics',
  competency: 'MATH.G2.FRACTIONS',
  currentIndex: 0,
  totalQuestions: 3,
  attemptCount: 1,
  correctCount: 0,
  hintLevel: 1,
  lastCorrect: true,
  interest: 'octopus',
  masteryThreshold: 2,
}

describe('POST /api/student/adaptive-question', () => {
  it('returns a privacy-safe adaptive decision', async () => {
    const response = await POST(new Request('http://localhost/api/student/adaptive-question', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.action).toBe('advance')
    expect(body.route).toBe('server-fallback')
    expect(body.mettaQuery).not.toContain('octopus')
  })

  it('rejects malformed and inconsistent input', async () => {
    const malformed = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ ...validPayload, currentIndex: 3 }),
    }))
    expect(malformed.status).toBe(400)

    const inconsistent = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ ...validPayload, correctCount: 2, attemptCount: 1 }),
    }))
    expect(inconsistent.status).toBe(400)
  })

  it('rejects oversized request bodies before policy evaluation', async () => {
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-length': '9000' },
      body: JSON.stringify(validPayload),
    }))
    expect(response.status).toBe(413)
  })
})
