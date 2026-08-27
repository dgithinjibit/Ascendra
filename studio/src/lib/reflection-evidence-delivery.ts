import type { ReflectionEvidencePlan } from './teacher-reflection-evidence';

export type DeliveryRecipient = 'head_progress_notifications' | 'parent_performance_reports';

export interface CanonicalEvidenceWrite {
  table: DeliveryRecipient;
  values: Record<string, unknown>;
}

export interface EvidenceDeliveryContext {
  headRecipientId: string;
  parentRecipientId?: string;
  childProfileId: string;
  consentId?: string;
  sameSchool: boolean;
}

export interface EvidenceDeliveryTransport {
  insert(write: CanonicalEvidenceWrite): Promise<void>;
}

export function buildCanonicalEvidenceWrites(
  plan: ReflectionEvidencePlan,
  context: EvidenceDeliveryContext,
): CanonicalEvidenceWrite[] {
  if (!context.headRecipientId || !context.childProfileId || !context.sameSchool) return [];

  const writes: CanonicalEvidenceWrite[] = [{
    table: 'head_progress_notifications',
    values: {
      recipient_id: context.headRecipientId,
      school_name: plan.head.schoolName,
      learner_count: plan.head.learnerCount,
      progress_band: plan.head.band,
      metric: plan.head.metric,
      aggregate_payload: {
        subject: plan.head.subject,
        message: plan.head.message,
      },
    },
  }];

  if (plan.parent && context.parentRecipientId && context.consentId) {
    writes.push({
      table: 'parent_performance_reports',
      values: {
        parent_id: context.parentRecipientId,
        child_profile_id: context.childProfileId,
        school_name: plan.parent.schoolName,
        subject: plan.parent.subject,
        mastery_percentage: plan.parent.masteryPercent,
        performance_band: plan.parent.band,
        teacher_feedback_summary: plan.parent.teacherSummary,
        next_step: plan.parent.nextStep,
        consent_id: context.consentId,
        report_payload: { source: 'teacher_reflection' },
      },
    });
  }

  return writes;
}

export async function deliverCanonicalEvidence(
  plan: ReflectionEvidencePlan,
  context: EvidenceDeliveryContext,
  transport: EvidenceDeliveryTransport,
): Promise<number> {
  const writes = buildCanonicalEvidenceWrites(plan, context);
  for (const write of writes) await transport.insert(write);
  return writes.length;
}
