import { useState } from 'react';
import { useFormik } from 'formik';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { scoresFormSchema } from '../schemas/evaluationSchema';

const round2 = (n) => Math.round(n * 100) / 100;

// Staff enters a 0-100 score + optional remarks per active criterion snapshot
// on this evaluation. The weighted contribution and PQM subtotal shown here are
// client-side estimates only - the backend always recomputes and persists the
// real value, both on draft save and on final submit.
export function CriterionScoreForm({
  criterionScores,
  onSaveDraft,
  onSubmitFinal,
  isSavingDraft,
  isSubmitting,
  saveError,
  submitError,
}) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

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

  const toPayload = () =>
    formik.values.scores.map((row) => ({
      evaluation_criteria_id: row.evaluation_criteria_id,
      staff_score: row.staff_score === '' ? null : Number(row.staff_score),
      remarks: row.remarks === '' ? null : row.remarks,
    }));

  const scoredFlags = formik.values.scores.map(
    (row) => row.staff_score !== '' && row.staff_score !== null && row.staff_score !== undefined
  );
  const allScored = scoredFlags.every(Boolean);
  const missingCriteriaNames = criterionScores.filter((_, i) => !scoredFlags[i]).map((c) => c.criteria_name);

  const totalWeight = round2(criterionScores.reduce((sum, c) => sum + Number(c.weight_percentage), 0));
  const liveSubtotal = round2(
    formik.values.scores.reduce((sum, row, i) => {
      if (!scoredFlags[i]) return sum;
      return sum + (Number(row.staff_score) / 100) * Number(criterionScores[i].weight_percentage);
    }, 0)
  );

  const handleSubmitClick = () => {
    if (!allScored) {
      setAttemptedSubmit(true);
      return;
    }
    onSubmitFinal(toPayload());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total active weight</span>
          <Badge variant="outline" className={totalWeight === 100 ? 'border-green-500 text-green-700 dark:text-green-400' : 'border-amber-500 text-amber-700 dark:text-amber-400'}>
            {totalWeight}%
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estimated PQM score (live)</span>
          <Badge variant="outline">{liveSubtotal}{!allScored && ' (partial)'}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">Recalculated and persisted by the backend on save/submit.</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Criterion</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Staff score (0-100)</TableHead>
            <TableHead>Weighted contribution</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {criterionScores.map((criterion, index) => {
            const row = formik.values.scores[index];
            const staffScore = row?.staff_score === '' || row?.staff_score == null ? null : Number(row.staff_score);
            const weightedPreview = staffScore === null
              ? null
              : round2((staffScore / 100) * Number(criterion.weight_percentage));
            const error = formik.errors.scores?.[index]?.staff_score;
            const showRequired = attemptedSubmit && staffScore === null;

            return (
              <TableRow key={criterion.evaluation_criteria_id}>
                <TableCell className="font-medium">{criterion.criteria_name}</TableCell>
                <TableCell className="capitalize">{criterion.category}</TableCell>
                <TableCell>{criterion.weight_percentage}%</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-24"
                    name={`scores[${index}].staff_score`}
                    value={row?.staff_score ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  {!error && showRequired && <p className="text-xs text-destructive">Required</p>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {weightedPreview ?? '-'} {weightedPreview !== null && <span className="text-xs">(est.)</span>}
                </TableCell>
                <TableCell>
                  <Textarea
                    className="min-h-9 w-56"
                    rows={1}
                    name={`scores[${index}].remarks`}
                    value={row?.remarks ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {attemptedSubmit && !allScored && (
        <p className="text-sm text-destructive">
          Still need a score for: {missingCriteriaNames.join(', ')}.
        </p>
      )}

      <div className="flex items-center gap-2">
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
          disabled={isSubmitting}
          onClick={handleSubmitClick}
        >
          {isSubmitting ? 'Submitting...' : 'Submit evaluation'}
        </Button>
        {!allScored && !attemptedSubmit && (
          <p className="text-xs text-muted-foreground">Every criterion needs a staff score before this evaluation can be submitted.</p>
        )}
      </div>
    </div>
  );
}
