import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { resolveSchema } from '../schemas/clarificationSchemas';

// UC-D9: close a clarification once the vendor response (and any resulting
// adjustment) has been reviewed. outcome_notes is mandatory - the backend
// rejects an empty resolution outright since it's what the audit trail relies on.
export function ResolveForm({ onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    initialValues: { outcome_notes: '' },
    validationSchema: resolveSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values.outcome_notes);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Outcome notes"
        htmlFor="outcome_notes"
        error={formik.errors.outcome_notes}
        touched={formik.touched.outcome_notes}
      >
        <Textarea
          id="outcome_notes"
          name="outcome_notes"
          rows={3}
          placeholder='e.g. "Deviation justified, no change" / "Price revised and accepted" / "Vendor declined to adjust"'
          value={formik.values.outcome_notes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || formik.isSubmitting} className="self-start">
        {isSubmitting ? 'Resolving...' : 'Resolve & close'}
      </Button>
    </form>
  );
}
