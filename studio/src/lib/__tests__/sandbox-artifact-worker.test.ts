import { describe, expect, it } from 'vitest';
import { processSandboxArtifact, type SandboxArtifactProvider, type WorkerArtifactJob } from '../sandbox-artifact-worker';
import type { SandboxProviderPlan } from '../sandbox-provider';

const baseJob: WorkerArtifactJob = {
  id: 'artifact-1',
  artifactType: 'image',
  prompt: 'Show 1/4 using eight octopus arms',
  grade: 'Grade 2',
  subject: 'Mathematics',
  competency: 'MATH.G2.FRACTIONS',
  consentVerified: true,
  moderationStatus: 'approved',
  status: 'queued',
  expiresAt: '2026-08-27T12:00:00.000Z',
  cancelRequestedAt: null,
};

const imagePlan: SandboxProviderPlan = {
  provider: 'gemini',
  model: 'test-image-model',
  enabled: true,
  reason: 'configured',
};

const provider: SandboxArtifactProvider = {
  generate: async () => ({ storagePath: 'sandbox/artifact-1.png', containsLearnerData: false, moderationPassed: true }),
};

const now = new Date('2026-08-27T11:00:00.000Z');

describe('sandbox artifact worker policy', () => {
  it('holds queued artifacts for human moderation', async () => {
    const result = await processSandboxArtifact({ ...baseJob, moderationStatus: 'pending' }, imagePlan, provider, { now });
    expect(result).toMatchObject({ status: 'queued', nextAction: 'human_review', errorCode: 'moderation_required' });
  });

  it('fails closed for expiry, cancellation, missing consent, and quota', async () => {
    await expect(processSandboxArtifact({ ...baseJob, expiresAt: '2026-08-27T10:59:00.000Z' }, imagePlan, provider, { now })).resolves.toMatchObject({ status: 'failed', errorCode: 'artifact_expired' });
    await expect(processSandboxArtifact({ ...baseJob, cancelRequestedAt: now.toISOString() }, imagePlan, provider, { now })).resolves.toMatchObject({ status: 'cancelled', errorCode: 'cancel_requested' });
    await expect(processSandboxArtifact({ ...baseJob, consentVerified: false }, imagePlan, provider, { now })).resolves.toMatchObject({ status: 'failed', errorCode: 'consent_verification_required' });
    await expect(processSandboxArtifact(baseJob, imagePlan, provider, { now, dailyQuotaUsed: 10 })).resolves.toMatchObject({ status: 'failed', errorCode: 'daily_quota_exceeded' });
  });

  it('does not call a disabled or non-child-facing provider', async () => {
    let called = false;
    const trackingProvider: SandboxArtifactProvider = { generate: async () => { called = true; return provider.generate(baseJob, new AbortController().signal); } };
    const result = await processSandboxArtifact(baseJob, { ...imagePlan, enabled: false, reason: 'feature_disabled' }, trackingProvider, { now });
    expect(result).toMatchObject({ status: 'queued', nextAction: 'provider_retry', errorCode: 'provider_not_ready' });
    expect(called).toBe(false);
  });

  it('allows a safe, approved mocked result to become ready', async () => {
    const result = await processSandboxArtifact(baseJob, imagePlan, provider, { now });
    expect(result).toMatchObject({ status: 'ready', nextAction: 'none', errorCode: null, provider: 'gemini' });
  });

  it('rejects provider output containing learner data or without moderation', async () => {
    const unsafeProvider: SandboxArtifactProvider = { generate: async () => ({ storagePath: 'x.png', containsLearnerData: true, moderationPassed: true }) };
    const unmoderatedProvider: SandboxArtifactProvider = { generate: async () => ({ storagePath: 'x.png', containsLearnerData: false, moderationPassed: false }) };
    await expect(processSandboxArtifact(baseJob, imagePlan, unsafeProvider, { now })).resolves.toMatchObject({ status: 'failed', errorCode: 'provider_output_rejected' });
    await expect(processSandboxArtifact(baseJob, imagePlan, unmoderatedProvider, { now })).resolves.toMatchObject({ status: 'failed', errorCode: 'provider_output_rejected' });
  });

  it('returns a retry decision when the provider times out', async () => {
    const slowProvider: SandboxArtifactProvider = { generate: () => new Promise(() => {}) };
    const result = await processSandboxArtifact(baseJob, imagePlan, slowProvider, { now, timeoutMs: 5 });
    expect(result).toMatchObject({ status: 'queued', nextAction: 'provider_retry', errorCode: 'provider_timeout' });
  });
});
