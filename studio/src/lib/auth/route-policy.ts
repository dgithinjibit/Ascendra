export function shouldEnforceAuthWall(
  nodeEnv: string | undefined,
  configuredValue: string | undefined,
): boolean {
  return nodeEnv === 'production'
    ? configuredValue !== 'false'
    : configuredValue === 'true';
}

export function isLocalDemoEnabled(
  nodeEnv: string | undefined,
  configuredValue: string | undefined,
): boolean {
  return nodeEnv !== 'production' && configuredValue === 'true';
}
