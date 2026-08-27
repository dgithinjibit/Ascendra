import { createHash } from 'node:crypto'
import { CHILD_FACING_GATES, type ChildFacingGate, type ChildFacingRole, type GateStatus } from './child-facing-readiness'

export interface ApprovalEvidenceRecord {
  subject: 'gate' | 'role'
  key: ChildFacingGate | ChildFacingRole
  status: GateStatus
  environment: 'local' | 'staging' | 'production'
  recordedAt: string
  reviewerStatus: 'unassigned' | 'pending' | 'verified' | 'rejected'
  reviewerRef?: string
  testRefs: string[]
  previousDigest: string
  digest: string
}

export interface ApprovalEvidenceBundle {
  schemaVersion: 'syncsenta.child-facing-evidence.v1'
  bundleId: string
  environment: 'local' | 'staging' | 'production'
  createdAt: string
  records: ApprovalEvidenceRecord[]
  digest: string
}

const ROLES: ChildFacingRole[] = ['student', 'teacher', 'head', 'parent']
const SAFE_REF = /^[A-Za-z0-9._:/-]{1,160}$/
const GENESIS = '0'.repeat(64)

function digestRecord(record: Omit<ApprovalEvidenceRecord, 'digest'>): string {
  return createHash('sha256').update(JSON.stringify(record)).digest('hex')
}

function ensureSafeReference(value: string): string {
  if (!SAFE_REF.test(value)) throw new Error('unsafe_evidence_reference')
  return value
}

export function createApprovalEvidenceBundle(input: {
  bundleId: string
  environment: ApprovalEvidenceBundle['environment']
  createdAt: string
  gates: Partial<Record<ChildFacingGate, { status: GateStatus; reviewerStatus?: ApprovalEvidenceRecord['reviewerStatus']; reviewerRef?: string; testRefs?: string[] }>>
  roles: Partial<Record<ChildFacingRole, { status: GateStatus; reviewerStatus?: ApprovalEvidenceRecord['reviewerStatus']; reviewerRef?: string; testRefs?: string[] }>>
}): ApprovalEvidenceBundle {
  const entries: Array<{ subject: 'gate' | 'role'; key: ChildFacingGate | ChildFacingRole; value?: { status: GateStatus; reviewerStatus?: ApprovalEvidenceRecord['reviewerStatus']; reviewerRef?: string; testRefs?: string[] } }> = [
    ...CHILD_FACING_GATES.map((key) => ({ subject: 'gate' as const, key, value: input.gates[key] })),
    ...ROLES.map((key) => ({ subject: 'role' as const, key, value: input.roles[key] })),
  ]
  let previousDigest = GENESIS
  const records = entries.map(({ subject, key, value }) => {
    const testRefs = (value?.testRefs ?? []).map(ensureSafeReference)
    const reviewerRef = value?.reviewerRef ? ensureSafeReference(value.reviewerRef) : undefined
    const unsigned: Omit<ApprovalEvidenceRecord, 'digest'> = {
      subject,
      key,
      status: value?.status ?? 'unknown',
      environment: input.environment,
      recordedAt: input.createdAt,
      reviewerStatus: value?.reviewerStatus ?? 'unassigned',
      ...(reviewerRef ? { reviewerRef } : {}),
      testRefs,
      previousDigest,
    }
    const digest = digestRecord(unsigned)
    previousDigest = digest
    return { ...unsigned, digest }
  })

  return {
    schemaVersion: 'syncsenta.child-facing-evidence.v1',
    bundleId: ensureSafeReference(input.bundleId),
    environment: input.environment,
    createdAt: input.createdAt,
    records,
    digest: previousDigest,
  }
}

export function verifyApprovalEvidenceBundle(bundle: ApprovalEvidenceBundle): boolean {
  if (bundle.schemaVersion !== 'syncsenta.child-facing-evidence.v1' || bundle.records.length !== CHILD_FACING_GATES.length + ROLES.length) return false
  let previousDigest = GENESIS
  for (const record of bundle.records) {
    const { digest, ...unsigned } = record
    if (record.previousDigest !== previousDigest || digestRecord(unsigned) !== digest) return false
    previousDigest = record.digest
  }
  return bundle.digest === previousDigest
}
