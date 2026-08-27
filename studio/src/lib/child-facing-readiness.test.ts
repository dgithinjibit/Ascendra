import { describe, expect, it } from 'vitest'
import { CHILD_FACING_GATES, evaluateChildFacingReadiness, isChildFacingProductionConfigurationSafe } from './child-facing-readiness'

const passingGates = Object.fromEntries(CHILD_FACING_GATES.map((gate) => [gate, 'pass']))
const passingRoles = { student: 'pass', teacher: 'pass', head: 'pass', parent: 'pass' } as const

describe('child-facing readiness', () => {
  it('approves only when all gates and roles pass', () => {
    expect(evaluateChildFacingReadiness({ gates: passingGates, roles: passingRoles })).toEqual({
      status: 'approved',
      passedGates: 10,
      requiredGates: 10,
      passedRoles: 4,
      requiredRoles: 4,
      blockingGates: [],
      blockingRoles: [],
    })
  })

  it('blocks unknown gates and missing roles', () => {
    const result = evaluateChildFacingReadiness({
      gates: { ...passingGates, privacy_consent: 'unknown', media_moderation: 'fail' },
      roles: { student: 'pass', teacher: 'pass' },
    })
    expect(result.status).toBe('blocked')
    expect(result.blockingGates).toEqual(['privacy_consent', 'media_moderation'])
    expect(result.blockingRoles).toEqual(['head', 'parent'])
  })

  it('allows local test configuration outside production', () => {
    expect(isChildFacingProductionConfigurationSafe({ nodeEnv: 'test', syntheticData: true, mockAuth: true, biometricProcessing: true })).toBe(true)
  })

  it('rejects synthetic, mock, or biometric production configuration', () => {
    expect(isChildFacingProductionConfigurationSafe({ nodeEnv: 'production', syntheticData: true })).toBe(false)
    expect(isChildFacingProductionConfigurationSafe({ nodeEnv: 'production', mockAuth: true })).toBe(false)
    expect(isChildFacingProductionConfigurationSafe({ nodeEnv: 'production', biometricProcessing: true })).toBe(false)
  })
})
