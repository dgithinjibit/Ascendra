export type SandboxProvider = 'gemini' | 'local_template' | 'not_configured';
export type SandboxArtifactKind = 'image' | 'video' | 'presentation';

export interface SandboxProviderPlan {
  provider: SandboxProvider;
  model: string | null;
  enabled: boolean;
  reason: 'configured' | 'feature_disabled' | 'missing_api_key' | 'local_fallback';
}

function enabledFlag(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

/**
 * Server-only provider selection. It never returns or logs credentials.
 * Generation stays disabled unless the deployment explicitly opts in.
 */
export function selectSandboxProvider(
  kind: SandboxArtifactKind,
  env: Record<string, string | undefined> = process.env,
): SandboxProviderPlan {
  if (kind === 'presentation') {
    return { provider: 'local_template', model: null, enabled: true, reason: 'local_fallback' };
  }

  const hasGeminiKey = Boolean(env.GEMINI_API_KEY);
  const mediaEnabled = enabledFlag(env.SYNC_SENTA_ENABLE_MEDIA_GENERATION);
  if (!hasGeminiKey) {
    return { provider: 'not_configured', model: null, enabled: false, reason: 'missing_api_key' };
  }
  if (!mediaEnabled) {
    return { provider: 'gemini', model: null, enabled: false, reason: 'feature_disabled' };
  }

  const model = kind === 'image'
    ? env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image'
    : env.GEMINI_VIDEO_MODEL || 'gemini-omni-flash';
  return { provider: 'gemini', model, enabled: true, reason: 'configured' };
}

export function providerIsAllowedForChildFacing(
  kind: SandboxArtifactKind,
  plan: SandboxProviderPlan,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!plan.enabled) return false;
  if (kind === 'video' && plan.provider === 'gemini') {
    return enabledFlag(env.SYNC_SENTA_ENABLE_CHILD_VIDEO);
  }
  return kind === 'image' && plan.provider === 'gemini' || kind === 'presentation' && plan.provider === 'local_template';
}
