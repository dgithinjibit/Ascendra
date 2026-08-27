import {
  CHILD_FACING_GATES,
  evaluateChildFacingReadiness,
  type ChildFacingRole,
  type ChildFacingReadinessResult,
} from './child-facing-readiness'
import { verifyApprovalEvidenceBundle, type ApprovalEvidenceBundle } from './child-facing-evidence'

const ROLES: ChildFacingRole[] = ['student', 'teacher', 'head', 'parent']

export interface ChildFacingReleaseDecision {
  status: 'approved' | 'blocked'
  reason: 'approved' | 'invalid_evidence' | 'evidence_environment_mismatch' | 'unreviewed_evidence' | 'readiness_blocked'
  evidenceValid: boolean
  evidenceReviewed: boolean
  readiness: ChildFacingReadinessResult
  blockingGates: string[]
  blockingRoles: string[]
}

export function evaluateChildFacingReleaseDecision(
  bundle: ApprovalEvidenceBundle,
  expectedEnvironment: ApprovalEvidenceBundle['environment'],
): ChildFacingReleaseDecision {
  const evidenceValid = verifyApprovalEvidenceBundle(bundle)
  const environmentMatches = bundle.environment === expectedEnvironment && bundle.records.every((record) => record.environment === expectedEnvironment)
  const evidenceReviewed = bundle.records.length === CHILD_FACING_GATES.length + ROLES.length && bundle.records.every((record) => record.reviewerStatus === 'verified')
  const gates = Object.fromEntries(bundle.records.filter((record) => record.subject === 'gate').map((record) => [record.key, record.status])) as Parameters<typeof evaluateChildFacingReadiness>[0]['gates']
  const roles = Object.fromEntries(bundle.records.filter((record) => record.subject === 'role').map((record) => [record.key, record.status])) as Parameters<typeof evaluateChildFacingReadiness>[0]['roles']
  const readiness = evaluateChildFacingReadiness({ gates, roles })

  let reason: ChildFacingReleaseDecision['reason'] = 'approved'
  if (!evidenceValid) reason = 'invalid_evidence'
  else if (!environmentMatches) reason = 'evidence_environment_mismatch'
  else if (!evidenceReviewed) reason = 'unreviewed_evidence'
  else if (readiness.status !== 'approved') reason = 'readiness_blocked'

  return {
    status: reason === 'approved' ? 'approved' : 'blocked',
    reason,
    evidenceValid,
    evidenceReviewed,
    readiness,
    blockingGates: readiness.blockingGates,
    blockingRoles: readiness.blockingRoles,
  }
}
