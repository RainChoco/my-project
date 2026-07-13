import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { editMessageSchema } from '../schemas/clarificationSchemas';

// UC-D2/UC-D3: shows the AI-drafted (or previously edited) message and lets
// ma_staff/vendor_liaison correct tone/figures before approving it for dispatch.
// Approve is disabled while there are unsaved edits - per UC-D3's edge case, a
// draft can't be approved unchanged once staff has started correcting it.
export function EditDraftForm({ message, onSave, onApprove, isSaving, isApproving, saveError, approveError }) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { subject: message.subject ?? '', body: message.body ?? '' },
    validationSchema: editMessageSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSave({ subject: values.subject || null, body: values.body });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField label="Subject" htmlFor="draft-subject" error={formik.errors.subject} touched={formik.touched.subject}>
        <Input
          id="draft-subject"
          name="subject"
          value={formik.values.subject}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField label="Body" htmlFor="draft-body" error={formik.errors.body} touched={formik.touched.body}>
        <Textarea
          id="draft-body"
          name="body"
          rows={6}
          value={formik.values.body}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="outline" disabled={isSaving || formik.isSubmitting}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
        <Button type="button" onClick={onApprove} disabled={isApproving || formik.dirty}>
          {isApproving ? 'Approving...' : 'Approve for dispatch'}
        </Button>
        {formik.dirty && (
          <p className="text-xs text-muted-foreground">Save your edits before approving.</p>
        )}
      </div>

      {approveError && <p className="text-sm text-destructive">{approveError}</p>}
    </form>
  );
}
