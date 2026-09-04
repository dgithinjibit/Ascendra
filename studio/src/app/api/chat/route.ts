/**
 * POST /api/chat - Enhanced Version
 *
 * Streams a Socratic Mentor response from Groq with:
 * - Supabase authentication and user profile lookup
 * - Distributed rate limiting via Upstash Redis
 * - Chat history persistence to database
 * - Progress tracking and analytics
 * - Usage logging for billing/monitoring
 *
 * This is the production-ready version that replaces the original route.ts
 * To use: rename this file to route.ts and backup the original.
 */

import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import {
  buildCompassSystemPrompt,
  type LearnerLearningContext,
} from '@/lib/socratic-prompts';
import { evaluateTutoringDecision } from '@/lib/omega-agent/metta-core';
import { buildDynamicSystemPrompt, buildLearningState } from '@/lib/subject-session';
import { updateLearningSession } from '@/lib/session-persistence';
import { checkChatRateLimit } from '@/lib/rate-limit-upstash';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { addChatMessage, createChatSession } from '@/lib/chat-history-supabase';
import { updateDailyActivity, updateLearningProgress } from '@/lib/progress-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────
// Tunables
// ──────────────────────────────────────────────────────────────────────────

const MODEL_TIMEOUT_MS = 30_000;
const MAX_HISTORY_TURNS = 40;

// ──────────────────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────────────────

const HistoryEntry = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const ChatRequest = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(HistoryEntry).max(MAX_HISTORY_TURNS * 2).default([]),
  grade: z.string().min(1).max(40),
  subject: z.string().min(1).max(80),
  language: z.enum(['english', 'kiswahili', 'mixed']).default('mixed'),
  studentName: z.string().max(80).optional(),
  mode: z.enum(['socratic', 'compass']).default('socratic'),
  teacherContext: z.string().max(20000).optional(),
  sessionId: z.string().uuid().optional(), // For continuing existing sessions
  competencyCode: z.string().optional(), // For progress tracking
});

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function sseError(message: string, detail?: string): string {
  const payload = detail ? { error: message, detail } : { error: message };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function cbcStageForGrade(grade: string): string {
  const normalized = grade.toLowerCase();
  if (/grade\s?[1-3]|g[1-3]|pp[1-2]|pre-primary/.test(normalized)) return 'Early Years / Lower Primary foundation';
  if (/grade\s?[4-6]|g[4-6]/.test(normalized)) return 'Upper Primary';
  if (/grade\s?[7-9]|g[7-9]/.test(normalized)) return 'Junior Secondary';
  return 'CBC stage to be confirmed';
}

function ageBandFromDateOfBirth(dateOfBirth: string | null | undefined): string | undefined {
  if (!dateOfBirth) return undefined;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const month = now.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  if (age <= 5) return '5 and under';
  if (age <= 8) return '6–8';
  if (age <= 11) return '9–11';
  if (age <= 14) return '12–14';
  if (age <= 17) return '15–17';
  return '18+';
}

// ──────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ---- Authentication -------------------------------------------------------
  const supabase = getSupabaseServerClient();
  const {
    data: { user: authenticatedUser },
    error: authError,
  } = await supabase.auth.getUser();
  const allowDevelopmentChat = process.env.NODE_ENV !== 'production' && process.env.SYNCSENTA_ALLOW_DEV_CHAT === 'true';
  const isDevelopmentChat = !authenticatedUser && allowDevelopmentChat;
  const user = authenticatedUser ?? (isDevelopmentChat ? { id: 'dev-local-student' } : null);

  if (authError && !isDevelopmentChat) {
    return Response.json(
      { error: 'Unauthorized', detail: 'Please sign in to continue' },
      { status: 401 }
    );
  }
  if (!user) {
    return Response.json(
      { error: 'Unauthorized', detail: 'Please sign in to continue' },
      { status: 401 }
    );
  }

  const profile = authenticatedUser
    ? (await supabase
        .from('profiles')
        .select('subscription_tier, grade, full_name, date_of_birth, language_preference')
        .eq('id', authenticatedUser.id)
        .single()).data
    : { subscription_tier: 'free', grade: null, full_name: 'Development learner', date_of_birth: null, language_preference: 'mixed' as const };

  if (!profile) {
    return Response.json(
      { error: 'Profile not found', detail: 'Please complete your profile' },
      { status: 400 }
    );
  }

  // ---- Rate limiting --------------------------------------------------------
  const rateLimitResult = isDevelopmentChat
    ? { success: true, remaining: 1, limit: 1, reset: 0 }
    : await checkChatRateLimit(
        user.id,
        profile.subscription_tier as 'free' | 'premium' | 'school'
      );

  if (!rateLimitResult.success) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        detail: `You've reached your daily limit. ${
          profile.subscription_tier === 'free'
            ? 'Upgrade to Premium for unlimited messages.'
            : `Try again in ${rateLimitResult.reset} seconds.`
        }`,
        remaining: rateLimitResult.remaining,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.reset),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
        },
      }
    );
  }

  // ---- Parse + validate -----------------------------------------------------
  let body: z.infer<typeof ChatRequest>;
  try {
    const json = await req.json();
    body = ChatRequest.parse(json);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Invalid JSON';
    return Response.json({ error: 'Invalid request body', detail }, { status: 400 });
  }

  const verifiedGrade = profile.grade || body.grade;
  const learnerContext: LearnerLearningContext = {
    ageBand: ageBandFromDateOfBirth(profile.date_of_birth),
    cbcStage: cbcStageForGrade(verifiedGrade),
  };

  if (authenticatedUser) {
    const { data: masteryRows } = await supabase
      .from('learning_progress')
      .select('competency_name, mastery_level, progress_percentage, last_practiced_at, questions_answered, correct_answers')
      .eq('user_id', authenticatedUser.id)
      .eq('subject', body.subject)
      .eq('grade', verifiedGrade)
      .order('last_practiced_at', { ascending: false })
      .limit(5);
    const current = body.competencyCode
      ? masteryRows?.find((row) => row.competency_name === body.competencyCode)
      : masteryRows?.[0];
    if (current) {
      learnerContext.currentCompetency = current.competency_name;
      learnerContext.masteryLevel = current.mastery_level;
      learnerContext.progressPercentage = current.progress_percentage;
      learnerContext.recentPractice = current.last_practiced_at;
    }
  }

  if (body.mode === 'compass' && !body.teacherContext) {
    return Response.json(
      { error: 'Compass mode requires teacherContext' },
      { status: 400 }
    );
  }

  // ---- Env ------------------------------------------------------------------
  // Only model inference is provider-switchable. Auth, Supabase, Redis, and
  // persistence APIs must remain on their existing services.
  const provider = (process.env.LLM_PROVIDER || 'groq').trim().toLowerCase();
  const isGemini = provider === 'gemini';
  const apiKey = isGemini ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY;
  const requiredKeyName = isGemini ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
  if (!apiKey) {
    return Response.json(
      {
        error: `Server is missing ${requiredKeyName}`,
        detail: `Set ${requiredKeyName} in your server environment.`,
      },
      { status: 500 }
    );
  }
  const model = isGemini
    ? process.env.GEMINI_MODEL || 'gemini-3.6-flash'
    : process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  // ---- Create or get session ------------------------------------------------
  let sessionId = isDevelopmentChat ? undefined : body.sessionId;
  if (!isDevelopmentChat && !sessionId) {
    try {
      sessionId = await createChatSession(
        user.id,
        body.subject,
        body.grade,
        body.mode,
        body.teacherContext
      );
    } catch (error) {
      console.error('Failed to create chat session:', error);
      // Continue without session (degraded mode)
    }
  }

  // ---- Save user message ----------------------------------------------------
  if (sessionId && !isDevelopmentChat) {
    try {
      await addChatMessage(sessionId, user.id, 'user', body.message);
    } catch (error) {
      console.error('Failed to save user message:', error);
    }
  }

  // ---- Build messages -------------------------------------------------------
  // For compass mode, keep the existing prompt unchanged.
  // For socratic mode, compute a tutoring decision from learning_progress data
  // and replace the static socratic prompt with a dynamic Omega-aware one.
  let systemPrompt: string;

  if (body.mode === 'compass') {
    systemPrompt = buildCompassSystemPrompt({
      teacherContext: body.teacherContext!,
      language: body.language,
      studentName: body.studentName || profile.full_name || undefined,
      learnerContext,
    });
  } else {
    // Fetch learning_progress row once more (or reuse masteryRows captured above).
    // We need questions_answered + correct_answers for the decision engine.
    let masteryRowForDecision: {
      questions_answered: number | null;
      correct_answers: number | null;
      mastery_level: string | null;
    } | null = null;

    if (authenticatedUser) {
      const { data: decisionRows } = await supabase
        .from('learning_progress')
        .select('questions_answered, correct_answers, mastery_level')
        .eq('user_id', authenticatedUser.id)
        .eq('subject', body.subject)
        .eq('grade', verifiedGrade)
        .order('last_practiced_at', { ascending: false })
        .limit(1)
        .single();
      masteryRowForDecision = decisionRows ?? null;
    }

    const learningState = buildLearningState(masteryRowForDecision);
    const decision = evaluateTutoringDecision(learningState);

    // Fire-and-forget: persist scaffolding level in Redis for teacher visibility.
    if (authenticatedUser) {
      updateLearningSession(authenticatedUser.id, {
        preferences: {
          language: body.language,
          difficultyLevel: 3,
          learningStyle: 'mixed',
          scaffoldingLevel: decision.scaffolding,
        } as any,
      }).catch((err: unknown) => console.error('[/api/chat] Redis scaffolding write failed:', err));
    }

    const effectiveLanguage =
      body.language === 'mixed' && profile.language_preference
        ? (profile.language_preference as 'english' | 'kiswahili' | 'mixed')
        : body.language;

    systemPrompt = buildDynamicSystemPrompt({
      decision,
      subject: body.subject,
      grade: verifiedGrade,
      language: effectiveLanguage,
      studentName: body.studentName || profile.full_name || undefined,
      learnerContext,
    });
  }

  // Cap history
  const trimmedHistory = body.history.slice(-MAX_HISTORY_TURNS * 2);

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: body.message },
  ];

  // ---- Call selected model provider (streaming, with timeout) ----------------
  const timeoutSignal = AbortSignal.timeout(MODEL_TIMEOUT_MS);
  let modelStream: AsyncIterable<string>;
  try {
    if (isGemini) {
      const gemini = new GoogleGenerativeAI(apiKey);
      const geminiModel = gemini.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
      });
      const geminiHistory = trimmedHistory.map((entry) => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }],
      }));
      const geminiResult = await geminiModel.generateContentStream({
        contents: [...geminiHistory, { role: 'user', parts: [{ text: body.message }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600, topP: 1 },
      });
      modelStream = (async function* () {
        for await (const chunk of geminiResult.stream) {
          const text = chunk.text();
          if (text) yield text;
        }
      })();
    } else {
      const groq = new Groq({ apiKey });
      const groqStream = await groq.chat.completions.create(
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: 600,
          top_p: 1,
          stream: true,
        },
        { signal: timeoutSignal }
      );
      modelStream = (async function* () {
        for await (const chunk of groqStream) {
          const text = chunk?.choices?.[0]?.delta?.content;
          if (text) yield text;
        }
      })();
    }
  } catch (err) {
    const aborted =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    const detail = err instanceof Error ? err.message : `Unknown ${provider} error`;
    console.error(`[/api/chat] ${provider} request failed:`, detail);

    // Development chat never writes synthetic usage or telemetry rows.
    if (!isDevelopmentChat) await supabase.from('api_usage').insert({
      user_id: user.id,
      endpoint: '/api/chat',
      method: 'POST',
      status_code: aborted ? 504 : 502,
      latency_ms: Date.now() - startTime,
    });

    return Response.json(
      {
        error: aborted ? 'Upstream timeout' : 'Upstream model error',
        detail,
      },
      { status: aborted ? 504 : 502 }
    );
  }

  // ---- Convert AsyncIterable -> SSE ReadableStream --------------------------
  const encoder = new TextEncoder();
  let fullResponse = '';
  let tokensUsed = 0;

  const sse = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of modelStream) {
          if (timeoutSignal.aborted) {
            controller.enqueue(
              encoder.encode(sseError('stream_timeout', 'Upstream timed out mid-stream.'))
            );
            controller.close();
            return;
          }

          fullResponse += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        // ---- Post-stream: Save assistant message and update analytics ---------
        const latencyMs = Date.now() - startTime;

        // Save assistant message
        if (sessionId && !isDevelopmentChat) {
          try {
            await addChatMessage(sessionId, user.id, 'assistant', fullResponse, {
              tokensUsed,
              model,
              latencyMs,
            });
          } catch (error) {
            console.error('Failed to save assistant message:', error);
          }
        }

        // Update daily activity only for authenticated learners.
        if (!isDevelopmentChat) try {
          await updateDailyActivity(user.id, {
            messagesSent: 1,
            sessionsStarted: body.sessionId ? 0 : 1,
            timeSpentMinutes: Math.ceil(latencyMs / 60000),
            subjectsPracticed: [body.subject],
          });
        } catch (error) {
          console.error('Failed to update daily activity:', error);
        }

        // Update learning progress if competency provided
        if (body.competencyCode && !isDevelopmentChat) {
          try {
            await updateLearningProgress(user.id, body.competencyCode, {
              competencyName: body.competencyCode, // Should be passed from client
              subject: body.subject,
              grade: body.grade,
              questionsAsked: 1,
              timeSpentMinutes: Math.ceil(latencyMs / 60000),
            });
          } catch (error) {
            console.error('Failed to update learning progress:', error);
          }
        }

        // Log API usage only for authenticated requests.
        if (!isDevelopmentChat) await supabase.from('api_usage').insert({
          user_id: user.id,
          endpoint: '/api/chat',
          method: 'POST',
          tokens_used: tokensUsed,
          status_code: 200,
          latency_ms: latencyMs,
        });

        // Increment daily quota only for authenticated requests.
        if (!isDevelopmentChat) await supabase.rpc('increment_daily_quota', { p_user_id: user.id });
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Stream interrupted';
        console.error('[/api/chat] Stream error:', detail);
        controller.enqueue(encoder.encode(sseError('stream_interrupted', detail)));
        controller.close();
      }
    },
    cancel() {
      // Client disconnected
    },
  });

  return new Response(sse, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Limit': String(rateLimitResult.limit),
      'X-Session-Id': sessionId || '',
    },
  });
}
