export const CHILD_FACING_GATES = [
  'safeguarding',
  'privacy_consent',
  'role_access',
  'curriculum_language',
  'accessibility_devices',
  'adaptive_determinism',
  'media_moderation',
  'deployment_rollback',
  'monitoring_support',
  'pilot_signoff',
] as const

export type ChildFacingGate = (typeof CHILD_FACING_GATES)[number]
export type GateStatus = 'pass' | 'fail' | 'unknown'
export type ChildFacingRole = 'student' | 'teacher' | 'head' | 'parent'

export interface ChildFacingGateResult {
  gate: ChildFacingGate
  status: GateStatus
  evidence?: string
}

export interface ChildFacingRoleResult {
  role: ChildFacingRole
  status: GateStatus
  evidence?: string
}

export interface ChildFacingReadinessInput {
  gates: Partial<Record<ChildFacingGate, GateStatus>>
  roles: Partial<Record<ChildFacingRole, GateStatus>>
}

export interface ChildFacingReadinessResult {
  status: 'approved' | 'blocked'
  passedGates: number
  requiredGates: number
  passedRoles: number
  requiredRoles: number
  blockingGates: ChildFacingGate[]
  blockingRoles: ChildFacingRole[]
}

export function evaluateChildFacingReadiness(input: ChildFacingReadinessInput): ChildFacingReadinessResult {
  const blockingGates = CHILD_FACING_GATES.filter((gate) => input.gates[gate] !== 'pass')
  const roles: ChildFacingRole[] = ['student', 'teacher', 'head', 'parent']
  const blockingRoles = roles.filter((role) => input.roles[role] !== 'pass')
  const passedGates = CHILD_FACING_GATES.length - blockingGates.length
  const passedRoles = roles.length - blockingRoles.length

  return {
    status: blockingGates.length === 0 && blockingRoles.length === 0 ? 'approved' : 'blocked',
    passedGates,
    requiredGates: CHILD_FACING_GATES.length,
    passedRoles,
    requiredRoles: roles.length,
    blockingGates,
    blockingRoles,
  }
}

export function isChildFacingProductionConfigurationSafe(
  config: { nodeEnv?: string; syntheticData?: boolean; mockAuth?: boolean; biometricProcessing?: boolean },
): boolean {
  if (config.nodeEnv !== 'production') return true
  return config.syntheticData !== true && config.mockAuth !== true && config.biometricProcessing !== true
}
