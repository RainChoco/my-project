import { useFormik } from 'formik';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { FormField } from './FormField';
import { DECISIONS, createApprovalSchema } from '../schemas/approvalSchema';

const DECISION_LABELS = {
  approved: 'Approve',
  rejected: 'Reject',
  revision_requested: 'Request revision',
};

// UC-B9: management logs a go/no-go (or revision-request) decision. Remarks
// become required the moment the decision isn't 'approved' - Formik re-runs
// validation on every decision change since validateOnChange defaults to true.
export function ApprovalForm({ onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    initialValues: { decision: '', remarks: '' },
    validationSchema: createApprovalSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
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
      <FormField label="Decision" htmlFor="decision" error={formik.errors.decision} touched={formik.touched.decision}>
        <Select value={formik.values.decision} onValueChange={(value) => formik.setFieldValue('decision', value)}>
          <SelectTrigger id="decision">
            <SelectValue placeholder="Select a decision" />
          </SelectTrigger>
          <SelectContent>
            {DECISIONS.map((decision) => (
              <SelectItem key={decision} value={decision}>
                {DECISION_LABELS[decision]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label={formik.values.decision === 'approved' ? 'Remarks (optional)' : 'Remarks'}
        htmlFor="remarks"
        error={formik.errors.remarks}
        touched={formik.touched.remarks}
      >
        <Textarea
          id="remarks"
          name="remarks"
          rows={3}
          value={formik.values.remarks}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || formik.isSubmitting} className="self-start">
        {isSubmitting ? 'Submitting...' : 'Log decision'}
      </Button>
    </form>
  );
}
