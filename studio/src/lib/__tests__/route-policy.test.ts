import { describe, expect, it } from 'vitest';
import { isLocalDemoEnabled, shouldEnforceAuthWall } from '../auth/route-policy';

describe('role route authentication policy', () => {
  it('protects production routes when no override is configured', () => {
    expect(shouldEnforceAuthWall('production', undefined)).toBe(true);
  });

  it('allows an explicit non-production auth-wall opt-out', () => {
    expect(shouldEnforceAuthWall('development', undefined)).toBe(false);
    expect(shouldEnforceAuthWall('development', 'true')).toBe(true);
  });

  it('does not enable demo mode in production', () => {
    expect(isLocalDemoEnabled('production', 'true')).toBe(false);
    expect(isLocalDemoEnabled('development', 'true')).toBe(true);
  });
});
