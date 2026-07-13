import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { recordResponseSchema } from '../schemas/clarificationSchemas';

// UC-D5: log the vendor's reply (confirmation, revised offer, or justification)
// to a sent clarification. response_notes is the internal summary the audit
// trail and UC-D9's resolution rely on - kept distinct from the vendor's raw body.
export function RecordResponseForm({ onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    initialValues: { subject: '', body: '', response_notes: '' },
    validationSchema: recordResponseSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await onSubmit({ subject: values.subject || null, body: values.body, response_notes: values.response_notes });
        resetForm();
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Subject (optional)"
        htmlFor="response-subject"
        error={formik.errors.subject}
        touched={formik.touched.subject}
      >
        <Input
          id="response-subject"
          name="subject"
          value={formik.values.subject}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField label="Vendor's message" htmlFor="response-body" error={formik.errors.body} touched={formik.touched.body}>
        <Textarea
          id="response-body"
          name="body"
          rows={4}
          placeholder="What the vendor said, verbatim or summarised"
          value={formik.values.body}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField
        label="Internal outcome notes"
        htmlFor="response-notes"
        error={formik.errors.response_notes}
        touched={formik.touched.response_notes}
      >
        <Textarea
          id="response-notes"
          name="response_notes"
          rows={3}
          placeholder='e.g. "Vendor confirms deviation is a bulk-discount, no revised price submitted."'
          value={formik.values.response_notes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || formik.isSubmitting} className="self-start">
        {isSubmitting ? 'Saving...' : 'Log vendor response'}
      </Button>
    </form>
  );
}
