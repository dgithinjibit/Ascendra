import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdaptiveQuestionBridge, type AdaptiveDecisionRequest } from '@/lib/adaptive-question-bridge'
import { buildAdaptiveDecisionRequest } from '@/lib/adaptive-question-bridge'
import type { LearningLoopState } from '@/lib/student-learning-loop'

const MAX_BODY_BYTES = 8 * 1024
const DECISION_TIMEOUT_MS = 120

const adaptiveInputSchema = z.object({
  lessonId: z.string().trim().min(1).max(120),
  grade: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(1).max(40),
  competency: z.string().trim().min(1).max(120),
  currentIndex: z.number().int().min(0).max(1000),
  totalQuestions: z.number().int().min(1).max(1000),
  attemptCount: z.number().int().min(0).max(10000),
  correctCount: z.number().int().min(0).max(10000),
  hintLevel: z.number().int().min(0).max(3),
  lastCorrect: z.boolean(),
  interest: z.string().trim().max(120).optional(),
  masteryThreshold: z.number().int().min(1).max(1000),
}).superRefine((input, context) => {
  if (input.currentIndex >= input.totalQuestions) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['currentIndex'], message: 'currentIndex is outside the question sequence' })
  }
  if (input.correctCount > input.attemptCount) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['correctCount'], message: 'correctCount cannot exceed attemptCount' })
  }
})

const bridge = createAdaptiveQuestionBridge()

function timeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('adaptive decision timeout')), milliseconds)),
  ])
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'request_too_large' }, { status: 413 })
  }

  let input: z.infer<typeof adaptiveInputSchema>
  try {
    input = adaptiveInputSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_adaptive_input' }, { status: 400 })
  }

  const state: LearningLoopState = {
    lessonId: input.lessonId,
    masteryThreshold: input.masteryThreshold,
    attemptCount: input.attemptCount,
    correctCount: input.correctCount,
    currentIndex: input.currentIndex,
    hintLevel: input.hintLevel,
    mastered: input.correctCount >= input.masteryThreshold,
    status: input.correctCount >= input.masteryThreshold ? 'completed' : 'active',
  }
  const decisionRequest: AdaptiveDecisionRequest = buildAdaptiveDecisionRequest({
    state,
    grade: input.grade,
    subject: input.subject,
    competency: input.competency,
    currentIndex: input.currentIndex,
    totalQuestions: input.totalQuestions,
    lastCorrect: input.lastCorrect,
    interest: input.interest,
    masteryThreshold: input.masteryThreshold,
    answer: '(server-policy)',
  })

  try {
    const decision = await timeout(bridge.decide(decisionRequest), DECISION_TIMEOUT_MS)
    return NextResponse.json({ ...decision, route: 'server-fallback' }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'adaptive_decision_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
