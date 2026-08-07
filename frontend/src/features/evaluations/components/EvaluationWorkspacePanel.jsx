import { useFormik } from 'formik';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { EvaluationStatusBadge } from './StatusBadge';
import { EvaluationProgressTracker } from './EvaluationProgressTracker';
import { scoresFormSchema } from '../schemas/evaluationSchema';

const round2 = (n) => Math.round(n * 100) / 100;

function hasValue(v) {
  return v !== '' && v !== null && v !== undefined;
}

function InfoField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

// The main working area once an evaluation exists for the selected tender -
// embedded on the Evaluations page (not a separate route) so Create/Continue/
// View Evaluation never navigate away. Read-only once the evaluation has left
// 'processing', matching EvaluationDetailPage.jsx's existing canScore rule.
export function EvaluationWorkspacePanel({
  tender,
  evaluation,
  criteriaDescriptions,
  canScore,
  onSaveDraft,
  onSubmitFinal,
  isSavingDraft,
  isSubmitting,
  saveError,
  submitError,
}) {
  const criterionScores = evaluation.criterion_scores;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      scores: criterionScores.map((c) => ({
        evaluation_criteria_id: c.evaluation_criteria_id,
        staff_score: c.staff_score ?? '',
        remarks: c.remarks ?? '',
      })),
    },
    validationSchema: scoresFormSchema,
    onSubmit: () => {},
  });

  const rows = formik.values.scores;
  const scoredFlags = rows.map((row) => hasValue(row.staff_score));
  const remarkedFlags = rows.map((row) => hasValue(row.remarks) && String(row.remarks).trim() !== '');
  const allScored = scoredFlags.every(Boolean);
  const allRemarked = remarkedFlags.every(Boolean);

  const totalWeight = round2(criterionScores.reduce((sum, c) => sum + Number(c.weight_percentage), 0));
  const weightIsExact = Math.abs(totalWeight - 100) <= 0.01;

  const liveWeightedSum = round2(
    rows.reduce((sum, row, i) => {
      if (!scoredFlags[i]) return sum;
      return sum + (Number(row.staff_score) / 100) * Number(criterionScores[i].weight_percentage);
    }, 0)
  );

  const completedCount = scoredFlags.filter(Boolean).length;
  const totalCount = criterionScores.length;
  const completionPct = totalCount > 0 ? round2((completedCount / totalCount) * 100) : 0;

  const missingScoreNames = criterionScores.filter((_, i) => !scoredFlags[i]).map((c) => c.criteria_name);
  const missingRemarkNames = criterionScores.filter((_, i) => !remarkedFlags[i]).map((c) => c.criteria_name);

  const canSubmit = canScore && allScored && allRemarked && weightIsExact;

  const toPayload = () =>
    rows.map((row) => ({
      evaluation_criteria_id: row.evaluation_criteria_id,
      staff_score: row.staff_score === '' ? null : Number(row.staff_score),
      remarks: row.remarks === '' ? null : row.remarks,
    }));

  const isProcessing = evaluation.status === 'processing';
  const currentPqmScore = isProcessing ? liveWeightedSum : evaluation.pqm_score;

  const steps = [
    { label: 'Tender Selected', state: 'done' },
    { label: 'Evaluation Created', state: 'done' },
    { label: 'Criteria Scored', state: allScored ? 'done' : 'current' },
    {
      label: 'Submitted',
      state: !isProcessing ? 'done' : allScored ? 'current' : 'pending',
    },
    {
      label: 'Manager Approval',
      state:
        evaluation.status === 'approved'
          ? 'done'
          : evaluation.status === 'rejected'
            ? 'failed'
            : evaluation.status === 'scored'
              ? 'current'
              : 'pending',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tender Evaluation</CardTitle>
        <CardDescription>
          {canScore
            ? 'Enter a score (0-100) and remarks for every active criterion, then submit for manager approval.'
            : 'Criteria, weights, and scores as recorded on this evaluation attempt.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <EvaluationProgressTracker steps={steps} />

        <div className="grid grid-cols-2 gap-4 rounded-md border p-3 sm:grid-cols-3 lg:grid-cols-6">
          <InfoField label="Tender Reference">{tender?.tender_ref_no ?? `#${evaluation.tender_id}`}</InfoField>
          <InfoField label="Vendor">{tender?.vendor_name ?? evaluation.vendor_name ?? '-'}</InfoField>
          <InfoField label="Contract">{tender?.contract?.name ?? '-'}</InfoField>
          <InfoField label="Evaluator">{evaluation.evaluated_by ? `Evaluator #${evaluation.evaluated_by}` : '-'}</InfoField>
          <InfoField label="Current Status"><EvaluationStatusBadge status={evaluation.status} /></InfoField>
          <InfoField label="Current PQM Score">{currentPqmScore ?? '-'}</InfoField>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="flex flex-col gap-3">
            {criterionScores.map((criterion, index) => {
              const row = rows[index];
              const staffScore = hasValue(row?.staff_score) ? Number(row.staff_score) : null;
              const weightedPreview = staffScore === null ? null : round2((staffScore / 100) * Number(criterion.weight_percentage));
              const fieldError = formik.errors.scores?.[index]?.staff_score;

              return (
                <Card key={criterion.evaluation_criteria_id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{criterion.criteria_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {criteriaDescriptions?.[criterion.evaluation_criteria_id] ?? 'No description configured for this criterion.'}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{criterion.weight_percentage}% weight</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted-foreground">Staff Score (0-100)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={!canScore}
                          name={`scores[${index}].staff_score`}
                          value={row?.staff_score ?? ''}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-1">
                        <label className="text-xs text-muted-foreground">Remarks</label>
                        <Textarea
                          rows={1}
                          className="min-h-9"
                          disabled={!canScore}
                          name={`scores[${index}].remarks`}
                          value={row?.remarks ?? ''}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted-foreground">Weighted Score</label>
                        <Input value={weightedPreview ?? 'Auto-calculated'} disabled readOnly className="bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-base">Live PQM summary</CardTitle>
              <CardDescription>Updates instantly as scores are entered.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current PQM Score</span>
                <span className="font-semibold">{currentPqmScore ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed Criteria</span>
                <span className="font-semibold">{completedCount}/{totalCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining Criteria</span>
                <span className="font-semibold">{totalCount - completedCount}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-semibold">{completionPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Evaluation Status</span>
                <EvaluationStatusBadge status={evaluation.status} />
              </div>

              {canScore && (
                <>
                  <div className="my-1 h-px bg-border" />

                  {(!allScored || !allRemarked || !weightIsExact) && (
                    <div className="flex flex-col gap-1.5 rounded-md border border-amber-500 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <p className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Before you can submit:
                      </p>
                      {!allScored && <p>- Score still needed for: {missingScoreNames.join(', ')}.</p>}
                      {!allRemarked && <p>- Remarks still needed for: {missingRemarkNames.join(', ')}.</p>}
                      {!weightIsExact && <p>- Active weight total is {totalWeight}%, it must equal exactly 100%.</p>}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSavingDraft}
                      onClick={() => onSaveDraft(toPayload())}
                    >
                      {isSavingDraft ? 'Saving...' : 'Save draft'}
                    </Button>
                    <Button
                      type="button"
                      disabled={!canSubmit || isSubmitting}
                      onClick={() => onSubmitFinal(toPayload())}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                    </Button>
                  </div>

                  {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                  {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
