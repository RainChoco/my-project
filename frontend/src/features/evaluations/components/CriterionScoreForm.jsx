import { useFormik } from 'formik';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { scoresFormSchema } from '../schemas/evaluationSchema';

const round2 = (n) => Math.round(n * 100) / 100;

// Staff enters a 0-100 score + optional remarks per active criterion snapshot
// on this evaluation. The weighted contribution shown here is a client-side
// estimate only - the backend always recomputes and persists the real value,
// both on draft save and on final submit.
export function CriterionScoreForm({
  criterionScores,
  onSaveDraft,
  onSubmitFinal,
  isSavingDraft,
  isSubmitting,
  saveError,
  submitError,
}) {
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

  const allScored = formik.values.scores.every(
    (row) => row.staff_score !== '' && row.staff_score !== null && row.staff_score !== undefined
  );

  return (
    <div className="flex flex-col gap-4">
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
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {weightedPreview ?? '-'} {weightedPreview !== null && <span className="text-xs">(est.)</span>}
                </TableCell>
                <TableCell>
                  <Input
                    className="w-48"
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
          disabled={!allScored || isSubmitting}
          onClick={() => onSubmitFinal(toPayload())}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for scoring'}
        </Button>
        {!allScored && (
          <p className="text-xs text-muted-foreground">Every criterion needs a staff score before this evaluation can be submitted.</p>
        )}
      </div>
    </div>
  );
}
