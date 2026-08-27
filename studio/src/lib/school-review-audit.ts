import { createHash } from 'node:crypto'

export type SchoolReviewAction = 'approve' | 'reject'

export interface SchoolReviewAuditInput {
  requestId: string
  action: SchoolReviewAction
  result: 'approved' | 'rejected'
  schoolId?: string | null
  schoolName: string
  county: string
  schoolCode?: string | null
  schoolType: string
  classes: string[]
  reviewerRef?: string
}

export interface SchoolReviewAuditRecord {
  schemaVersion: 'syncsenta.school-review-audit.v1'
  auditId: string
  requestId: string
  action: SchoolReviewAction
  result: 'approved' | 'rejected'
  schoolId: string | null
  sourceDigest: string
  reviewerRef: string
  createdAt: string
  auditDigest: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function sourceDigest(input: SchoolReviewAuditInput): string {
  return sha256(JSON.stringify({
    schoolName: input.schoolName.trim(),
    county: input.county.trim(),
    schoolCode: input.schoolCode?.trim() || null,
    schoolType: input.schoolType,
    classes: [...input.classes].map((value) => value.trim()).sort(),
  }))
}

export function createSchoolReviewAudit(input: SchoolReviewAuditInput, createdAt: string): SchoolReviewAuditRecord {
  const unsigned = {
    schemaVersion: 'syncsenta.school-review-audit.v1' as const,
    auditId: `school-review:${input.requestId}:${createdAt}`,
    requestId: input.requestId,
    action: input.action,
    result: input.result,
    schoolId: input.schoolId || null,
    sourceDigest: sourceDigest(input),
    reviewerRef: input.reviewerRef?.trim() ? `operator:${sha256(input.reviewerRef.trim()).slice(0, 24)}` : 'operator:unknown',
    createdAt,
  }
  return { ...unsigned, auditDigest: sha256(JSON.stringify(unsigned)) }
}
