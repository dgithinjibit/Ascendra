import { describe, expect, it } from 'vitest';
import { providerIsAllowedForChildFacing, selectSandboxProvider } from '../sandbox-provider';

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
