import { describe, expect, it } from 'vitest';
import { getSandboxProviderPreflight, providerIsAllowedForChildFacing, selectSandboxProvider } from '../sandbox-provider';

describe('sandbox provider preflight', () => {
  it('reports ready for mocked activation without exposing secret material', () => {
    expect(getSandboxProviderPreflight({
      GEMINI_API_KEY: 'secret',
      SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true',
      SYNC_SENTA_ENABLE_ARTIFACT_WORKER: 'true',
      SYNC_SENTA_ENABLE_CHILD_VIDEO: 'false',
    })).toEqual({
      workerEnabled: true,
      mediaGenerationEnabled: true,
      childVideoEnabled: false,
      geminiKeyPresent: true,
      imageProviderReady: true,
      videoProviderReady: false,
      presentationProviderReady: true,
      status: 'ready_for_mocked_activation',
    });
  });

  it('distinguishes missing secret, disabled feature, and local-only states', () => {
    expect(getSandboxProviderPreflight({
      SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true',
    }).status).toBe('blocked_missing_secret');
    expect(getSandboxProviderPreflight({
      GEMINI_API_KEY: 'secret',
    }).status).toBe('blocked_feature_flag');
    expect(getSandboxProviderPreflight({}).status).toBe('safe_local_only');
  });
});

describe('sandbox provider selection', () => {
  it('uses the local template path for presentations without an API key', () => {
    const plan = selectSandboxProvider('presentation', {});
    expect(plan).toMatchObject({ provider: 'local_template', enabled: true, reason: 'local_fallback' });
    expect(providerIsAllowedForChildFacing('presentation', plan)).toBe(true);
  });

  it('keeps Gemini disabled when no key is configured', () => {
    const plan = selectSandboxProvider('image', {});
    expect(plan).toMatchObject({ provider: 'not_configured', enabled: false, reason: 'missing_api_key' });
    expect(providerIsAllowedForChildFacing('image', plan)).toBe(false);
  });

  it('keeps Gemini disabled until the media flag is explicitly enabled', () => {
    const plan = selectSandboxProvider('image', { GEMINI_API_KEY: 'test-key' });
    expect(plan).toMatchObject({ provider: 'gemini', enabled: false, reason: 'feature_disabled' });
  });

  it('selects Gemini image generation only when explicitly enabled', () => {
    const plan = selectSandboxProvider('image', {
      GEMINI_API_KEY: 'test-key',
      SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true',
      GEMINI_IMAGE_MODEL: 'test-image-model',
    });
    expect(plan).toMatchObject({ provider: 'gemini', model: 'test-image-model', enabled: true, reason: 'configured' });
    expect(providerIsAllowedForChildFacing('image', plan)).toBe(true);
  });

  it('requires a separate child-video flag before Gemini video can render', () => {
    const plan = selectSandboxProvider('video', {
      GEMINI_API_KEY: 'test-key',
      SYNC_SENTA_ENABLE_MEDIA_GENERATION: 'true',
      GEMINI_VIDEO_MODEL: 'test-video-model',
    });
    expect(plan).toMatchObject({ provider: 'gemini', model: 'test-video-model', enabled: true });
    expect(providerIsAllowedForChildFacing('video', plan)).toBe(false);
  });
});
