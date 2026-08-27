/**
 * LessonPlanDialog Component
 * 
 * Generates and displays detailed per-lesson plans for individual SchemeRow objects.
 * Includes lesson structure: title, duration, objectives, activities, assessment.
 * Supports on-demand generation and DOCX export.
 * 
 * Requirements: 5.3, 5.6, 5.7, 9.6
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Download, FileDown, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SchemeRow } from '@/types/curriculum';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api-config';
import {
  DifferentiationRenderer,
  type Differentiation,
} from '@/components/teacher/differentiation-renderer';

interface LessonPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: SchemeRow;
  grade: string;
  subject: string;
  term?: string;
  teacherId?: string;
  schemeId?: string;
}

interface LessonPlan {
  title: string;
  grade: string;
  subject: string;
  strand: string;
  subStrand: string;
  duration: string;
  objectives: string[];
  keyInquiryQuestion: string;
  introduction: { duration: string; activities: string[] };
  development: { duration: string; activities: string[] };
  conclusion: { duration: string; activities: string[] };
  assessment: string[];
  differentiation: { advanced: string; struggling: string };
  resources: string[];
  teacherReflection: string;
}

/**
 * Kiswahili subjects that should use Kiswahili UI text
 */
const KISWAHILI_SUBJECTS = [
  'Kiswahili',
  'Kiswahili Language Activities',
  'Lugha ya Kiswahili',
];

function isKiswahiliSubject(subject: string): boolean {
  return KISWAHILI_SUBJECTS.some(
    (kswSubject) => subject.toLowerCase().includes(kswSubject.toLowerCase())
  );
}

export default function LessonPlanDialog({
  open,
  onOpenChange,
  row,
  grade,
  subject,
  term,
  teacherId,
  schemeId,
}: LessonPlanDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  // Tier 2 differentiation — generated lazily on demand from the open plan.
  // We keep it as a sibling state rather than nested in `plan` so a
  // regenerate of the plan doesn't accidentally retain stale tiers.
  const [differentiation, setDifferentiation] = useState<Differentiation | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const isSw = isKiswahiliSubject(subject);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Repointed from the legacy Rust route to the Python ai-agents endpoint
      // ported from scheme-scribe-ai. Returns the LessonPlan camelCase shape
      // this component already renders against.
      const response = await fetch(
        '/api/generate/lesson-plan',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: teacherId ?? 'unknown',
            scheme_id: schemeId,
            week: row.week ?? 1,
            lesson: row.lesson ?? 1,
            row,
            grade,
            subject,
            term,
            language: isSw ? 'kiswahili' : 'english',
            additional_notes: additionalNotes || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'Failed to generate lesson plan');
      }

      const data = await response.json();
      // Python endpoint returns { success, lesson_plan, lesson_plan_id, source }.
      setPlan(data.lesson_plan ?? data.plan);
      setPlanId(data.lesson_plan_id ?? null);
      // Clear any previous tiers — they were generated against the old plan.
      setDifferentiation(null);
      setStep('preview');

      toast({ title: 'Lesson Plan Generated!' });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate lesson plan.';
      toast({
        title: 'Generation Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDifferentiate = async () => {
    if (!plan) return;
    setDiffLoading(true);
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.LESSON_ARCHITECT_GENERATE_DIFFERENTIATION),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: teacherId ?? 'unknown',
            // Pass the camelCase plan straight through — the backend's
            // _required_lesson_plan_keys guard reads grade/subject/strand/
            // subStrand/objectives from the same shape this component
            // already holds.
            lesson_plan: plan,
            lesson_plan_id: planId ?? undefined,
            language: isSw ? 'kiswahili' : 'english',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || error.error || 'Failed to generate differentiation'
        );
      }

      const data = await response.json();
      setDifferentiation(data.differentiation ?? null);

      toast({
        title: isSw ? 'Tofautisha Tayari!' : 'Differentiation Ready!',
        description: isSw
          ? 'Mikakati ya tabaka tatu imezalishwa'
          : 'Three-tier strategies generated against this lesson',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate differentiation.';
      toast({
        title: 'Generation Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDiffLoading(false);
    }
  };

  const handlePrint = () => {
    if (!plan) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Print preview blocked', description: 'Allow pop-ups for SyncSenta, then try Print / PDF again.', variant: 'destructive' });
      return;
    }
    const esc = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
    const list = (items: string[]) => items.map((item) => `<li>${esc(item)}</li>`).join('');
    const sourceRows = [
      ['Week', row.week], ['Lesson', row.lesson], ['Strand', row.strand], ['Sub-Strand', row.subStrand],
      ['Specific Learning Outcome', row.specificLearningOutcome], ['Learning Experiences', row.learningExperiences],
      ['Key Inquiry Question', row.keyInquiryQuestion], ['Learning Resources', row.learningResources],
      ['Assessment Methods', row.assessmentMethods], ['Reflection', row.reflection || ''],
    ];
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(plan.title)}</title><style>
      @page{size:landscape;margin:10mm}*{box-sizing:border-box}body{margin:0;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:8.5pt}.sheet{width:100%}h1{font-size:16pt;margin:0 0 3px}.muted{color:#555}.header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:7px}.meta,.source,.plan{width:100%;border-collapse:collapse;table-layout:fixed}.meta{margin:6px 0}.meta td,.source th,.source td,.plan th,.plan td{border:1px solid #555;padding:3px 4px;vertical-align:top;overflow-wrap:anywhere}.meta .label,.source th,.plan th{background:#ededed;font-weight:700}.meta .label{width:11%}.meta .value{width:22%}.source{font-size:7pt;margin-bottom:8px}.source th:nth-child(1){width:6%}.source th:nth-child(2){width:10%}.source th:nth-child(3){width:12%}.source th:nth-child(4){width:12%}.source th:nth-child(5){width:20%}.source th:nth-child(6){width:20%}.source th:nth-child(7){width:20%}.plan{font-size:7.5pt}.plan th{width:16.66%}.plan td{height:42px}.plan ul{margin:0;padding-left:14px}.reflection{min-height:48px;border:1px dashed #555;padding:5px}.footer{margin-top:7px;display:flex;justify-content:space-between;font-size:7pt;color:#555}@media print{.sheet{break-inside:avoid}}
    </style></head><body><main class="sheet"><header class="header"><div><h1>${esc(plan.title)}</h1><div class="muted">${esc(grade)} · ${esc(subject)} · ${esc(term || '')} · ${esc(plan.duration)}</div><div class="muted">${isSw ? 'Mpango wa Somo — CBC Kenya' : 'Lesson Plan — Kenyan CBC'}</div></div><div class="muted">Generated ${esc(new Date().toLocaleDateString('en-KE'))}</div></header>
      <table class="meta"><tr><td class="label">Grade</td><td class="value">${esc(grade)}</td><td class="label">Subject</td><td class="value">${esc(subject)}</td><td class="label">Term</td><td class="value">${esc(term || '')}</td></tr><tr><td class="label">Week</td><td class="value">${esc(row.week)}</td><td class="label">Lesson</td><td class="value">${esc(row.lesson)}</td><td class="label">Scheme ID</td><td class="value">${esc(schemeId || 'Generated row')}</td></tr></table>
      <table class="source"><thead><tr>${sourceRows.map(([label]) => `<th>${esc(label)}</th>`).join('')}</tr></thead><tbody><tr>${sourceRows.map(([, value]) => `<td>${esc(value)}</td>`).join('')}</tr></tbody></table>
      <table class="plan"><thead><tr><th>Objectives</th><th>Introduction</th><th>Development</th><th>Conclusion</th><th>Assessment</th><th>Differentiation & Resources</th></tr></thead><tbody><tr><td><ul>${list(plan.objectives)}</ul></td><td><strong>${esc(plan.introduction.duration)}</strong><ul>${list(plan.introduction.activities)}</ul></td><td><strong>${esc(plan.development.duration)}</strong><ul>${list(plan.development.activities)}</ul></td><td><strong>${esc(plan.conclusion.duration)}</strong><ul>${list(plan.conclusion.activities)}</ul></td><td><ul>${list(plan.assessment)}</ul><p><strong>KIQ:</strong> ${esc(plan.keyInquiryQuestion)}</p></td><td><strong>Advanced:</strong> ${esc(plan.differentiation.advanced)}<br><strong>Support:</strong> ${esc(plan.differentiation.struggling)}<br><strong>Resources:</strong> ${esc(plan.resources.join(', '))}</td></tr></tbody></table>
      <div class="reflection"><strong>Teacher reflection:</strong> ${esc(plan.teacherReflection)}<br><br><br></div><footer class="footer"><span>Teacher signature: __________________________</span><span>Head of school: __________________________</span><span>Landscape CBC lesson-plan print</span></footer></main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => { printWindow.print(); }, 350);
  };

  const resetDialog = () => {
    setPlan(null);
    setPlanId(null);
    setDifferentiation(null);
    setStep('input');
    setAdditionalNotes('');
  };

  return (
    <>
      <div id="lesson-plan-print" className="hidden print:block" />
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) resetDialog();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {step === 'input'
                ? isSw
                  ? 'Tengeneza Mpango wa Somo'
                  : 'Generate Lesson Plan'
                : isSw
                ? 'Mpango wa Somo'
                : 'Lesson Plan'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            {step === 'input' && (
              <div className="space-y-4 py-2">
                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Grade:</span> {grade}
                  </p>
                  <p>
                    <span className="font-medium">Subject:</span> {subject}
                  </p>
                  <p>
                    <span className="font-medium">Strand:</span> {row.strand}
                  </p>
                  <p>
                    <span className="font-medium">Sub-Strand:</span>{' '}
                    {row.subStrand}
                  </p>
                  <p>
                    <span className="font-medium">Lesson {row.lesson}:</span>{' '}
                    Week {row.week}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {isSw
                      ? 'Maelezo ya ziada (si lazima)'
                      : 'Additional notes for this lesson (optional)'}
                  </label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder={
                      isSw
                        ? 'k.m., mahitaji maalum, muda wa somo, muktadha wa darasa...'
                        : 'e.g., specific needs, lesson duration, class context, available materials...'
                    }
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading
                    ? isSw
                      ? 'Inatengeneza...'
                      : 'Generating...'
                    : isSw
                    ? 'Tengeneza Mpango wa Somo'
                    : 'Generate Lesson Plan'}
                </Button>
              </div>
            )}

            {step === 'preview' && plan && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <h3 className="font-serif text-lg font-bold">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {grade} — {subject} — {plan.duration}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Strand
                    </p>
                    <p className="text-sm">{plan.strand}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Sub-Strand
                    </p>
                    <p className="text-sm">{plan.subStrand}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Key Inquiry Question
                    </p>
                    <p className="text-sm">{plan.keyInquiryQuestion}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <h4 className="text-sm font-semibold">Learning Objectives</h4>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {plan.objectives.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>

                {[
                  {
                    label: 'Introduction',
                    data: plan.introduction,
                    color: 'bg-primary/5',
                  },
                  {
                    label: 'Lesson Development',
                    data: plan.development,
                    color: 'bg-secondary/50',
                  },
                  {
                    label: 'Conclusion',
                    data: plan.conclusion,
                    color: 'bg-muted/50',
                  },
                ].map(({ label, data, color }) => (
                  <div
                    key={label}
                    className={`rounded-lg border p-3 space-y-2 ${color}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{label}</h4>
                      <span className="text-xs text-muted-foreground">
                        {data.duration}
                      </span>
                    </div>
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      {data.activities.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="rounded-lg border p-3 space-y-2">
                  <h4 className="text-sm font-semibold">Assessment</h4>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {plan.assessment.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <h4 className="text-sm font-semibold">Differentiation</h4>
                  <p className="text-sm">
                    <span className="font-medium">Advanced learners:</span>{' '}
                    {plan.differentiation.advanced}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Struggling learners:</span>{' '}
                    {plan.differentiation.struggling}
                  </p>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <h4 className="text-sm font-semibold">Resources</h4>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    {plan.resources.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <h4 className="text-sm font-semibold">
                    Teacher's Reflection
                  </h4>
                  <p className="text-sm text-muted-foreground italic">
                    {plan.teacherReflection}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPlan(null);
                      setPlanId(null);
                      setDifferentiation(null);
                      setStep('input');
                    }}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDifferentiate}
                    disabled={diffLoading}
                    className="gap-2"
                  >
                    {diffLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                    {diffLoading
                      ? isSw
                        ? 'Inazalisha tabaka...'
                        : 'Generating tiers...'
                      : differentiation
                      ? isSw
                        ? 'Zalisha tena tabaka'
                        : 'Re-differentiate'
                      : isSw
                      ? 'Tofautisha'
                      : 'Differentiate'}
                  </Button>
                  <Button onClick={handlePrint} className="gap-2 ml-auto">
                    <Download className="w-4 h-4" /> Export PDF
                  </Button>
                </div>

                {differentiation && (
                  <div className="pt-4 border-t mt-4">
                    <DifferentiationRenderer differentiation={differentiation} />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
