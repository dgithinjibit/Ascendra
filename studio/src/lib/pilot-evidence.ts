import { createHash } from 'node:crypto'
import type { ChildFacingRole } from './child-facing-readiness'

const ROLES: ChildFacingRole[] = ['student', 'teacher', 'head', 'parent']
const SAFE_REF = /^[A-Za-z0-9._:/-]{1,160}$/

export interface PilotEvidenceRecord {
  role: ChildFacingRole
  status: 'pass' | 'fail'
  environment: 'staging'
  httpStatus: number
  checkedAt: string
  routeRef: string
  testRefs: string[]
  synthetic: false
}

export interface PilotEvidencePackage {
  schemaVersion: 'syncsenta.pilot-evidence.v1'
  packageId: string
  environment: 'staging'
  createdAt: string
  records: PilotEvidenceRecord[]
  packageDigest: string
}

function digestPackage(unsigned: Omit<PilotEvidencePackage, 'packageDigest'>): string {
  return createHash('sha256').update(JSON.stringify(unsigned)).digest('hex')
}

export function verifyPilotEvidencePackage(pkg: PilotEvidencePackage): boolean {
  if (pkg.schemaVersion !== 'syncsenta.pilot-evidence.v1' || pkg.environment !== 'staging') return false
  if (pkg.records.length !== ROLES.length || new Set(pkg.records.map((record) => record.role)).size !== ROLES.length) return false
  if (pkg.records.some((record) => record.environment !== 'staging' || record.synthetic !== false || record.httpStatus < 100 || record.httpStatus > 599)) return false
  if (pkg.records.some((record) => !SAFE_REF.test(record.routeRef) || record.testRefs.some((ref) => !SAFE_REF.test(ref)))) return false
  const { packageDigest, ...unsigned } = pkg
  return /^[a-f0-9]{64}$/.test(packageDigest) && digestPackage(unsigned) === packageDigest
}

export function summarizePilotEvidence(pkg: PilotEvidencePackage) {
  const verified = verifyPilotEvidencePackage(pkg)
  const requiredRoles = ROLES.length
  const passedRoles = pkg.records.filter((record) => record.status === 'pass' && record.httpStatus === 200).length
  return {
    status: verified && passedRoles === requiredRoles ? 'ready' as const : 'blocked' as const,
    evidenceValid: verified,
    passedRoles,
    requiredRoles,
    blockingRoles: ROLES.filter((role) => !pkg.records.some((record) => record.role === role && record.status === 'pass' && record.httpStatus === 200)),
  }
}
