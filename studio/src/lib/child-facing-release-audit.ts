import { createHash } from 'node:crypto'
import type { ApprovalEvidenceBundle } from './child-facing-evidence'
import type { ChildFacingReleaseDecision } from './child-facing-release-decision'

export interface ChildFacingReleaseAudit {
  schemaVersion: 'syncsenta.child-facing-release-audit.v1'
  auditId: string
  createdAt: string
  environment: ApprovalEvidenceBundle['environment']
  status: ChildFacingReleaseDecision['status']
  reason: ChildFacingReleaseDecision['reason']
  evidenceDigest: string
  evidenceValid: boolean
  evidenceReviewed: boolean
  passedGates: number
  requiredGates: number
  passedRoles: number
  requiredRoles: number
  blockingGateCount: number
  blockingRoleCount: number
  auditDigest: string
}

function digestAudit(unsigned: Omit<ChildFacingReleaseAudit, 'auditDigest'>): string {
  return createHash('sha256').update(JSON.stringify(unsigned)).digest('hex')
}

export function verifyChildFacingReleaseAudit(audit: ChildFacingReleaseAudit): boolean {
  if (audit.schemaVersion !== 'syncsenta.child-facing-release-audit.v1') return false
  const { auditDigest, ...unsigned } = audit
  return /^[a-f0-9]{64}$/.test(auditDigest) && digestAudit(unsigned) === auditDigest
}

export function createChildFacingReleaseAudit(
  decision: ChildFacingReleaseDecision,
  bundle: ApprovalEvidenceBundle,
  createdAt: string,
): ChildFacingReleaseAudit {
  const unsigned = {
    schemaVersion: 'syncsenta.child-facing-release-audit.v1' as const,
    auditId: `audit:${bundle.bundleId}:${createdAt}`,
    createdAt,
    environment: bundle.environment,
    status: decision.status,
    reason: decision.reason,
    evidenceDigest: bundle.digest,
    evidenceValid: decision.evidenceValid,
    evidenceReviewed: decision.evidenceReviewed,
    passedGates: decision.readiness.passedGates,
    requiredGates: decision.readiness.requiredGates,
    passedRoles: decision.readiness.passedRoles,
    requiredRoles: decision.readiness.requiredRoles,
    blockingGateCount: decision.blockingGates.length,
    blockingRoleCount: decision.blockingRoles.length,
  }
  const auditDigest = digestAudit(unsigned)
  return { ...unsigned, auditDigest }
}
