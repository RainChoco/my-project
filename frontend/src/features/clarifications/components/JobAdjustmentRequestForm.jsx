import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { createJobAdjustmentRequestSchema } from '../schemas/clarificationSchemas';

// UC-D7: vendor_liaison logs a scope/timeline/terms change implied by the
// vendor's response. is_material controls whether it needs ma_staff sign-off
// (see approval_status default in the JobAdjustmentRequestsPage/DetailPage).
export function JobAdjustmentRequestForm({ onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    initialValues: { description: '', justification: '', is_material: true },
    validationSchema: createJobAdjustmentRequestSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await onSubmit(values);
        resetForm();
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Requested change"
        htmlFor="jar-description"
        error={formik.errors.description}
        touched={formik.touched.description}
      >
        <Textarea
          id="jar-description"
          name="description"
          rows={3}
          placeholder="e.g. Extend completion date by 3 weeks to accommodate the alternative material's longer lead time."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField
        label="Justification"
        htmlFor="jar-justification"
        error={formik.errors.justification}
        touched={formik.touched.justification}
      >
        <Textarea
          id="jar-justification"
          name="justification"
          rows={3}
          placeholder="Why this change follows from the vendor's response"
          value={formik.values.justification}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <label htmlFor="jar-is-material" className="flex items-center gap-2 text-sm">
        <input
          id="jar-is-material"
          type="checkbox"
          name="is_material"
          checked={formik.values.is_material}
          onChange={formik.handleChange}
          className="h-4 w-4 rounded border-input"
        />
        This is a material change to price/scope (affects the tender's evaluation)
      </label>
      <p className="text-xs text-muted-foreground">
        Material requests need ma_staff sign-off before a follow-up notification can be sent to the vendor;
        non-material ones are approved automatically.
      </p>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || formik.isSubmitting} className="self-start">
        {isSubmitting ? 'Submitting...' : 'Log job adjustment request'}
      </Button>
    </form>
  );
}
