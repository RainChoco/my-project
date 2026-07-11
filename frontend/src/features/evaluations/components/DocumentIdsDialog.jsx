import { useFormik } from 'formik';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { FormField } from './FormField';
import { processEvaluationSchema } from '../schemas/evaluationSchema';

// Shared by "open the Processing Tender Form" (UC-B4) and "re-process a
// rejected evaluation" (UC-B11) - both endpoints take the same { document_ids }
// body shape. document_ids is free text here since there's no document picker
// UI yet (Zheng Hong's Scope A tender documents).
export function DocumentIdsDialog({ open, onOpenChange, title, description, onSubmit, isSubmitting, submitError, submitLabel }) {
  const formik = useFormik({
    initialValues: { document_ids_text: '' },
    validate: (values) => {
      const parsed = values.document_ids_text
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);
      try {
        processEvaluationSchema.validateSync({ document_ids: parsed }, { abortEarly: false });
      } catch (validationError) {
        return { document_ids_text: validationError.errors[0] };
      }
      return {};
    },
    onSubmit: async (values, { setSubmitting }) => {
      const documentIds = values.document_ids_text.split(/[\s,]+/).filter(Boolean).map(Number);
      try {
        await onSubmit(documentIds);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={formik.handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <FormField
              label="Document IDs"
              htmlFor="document_ids_text"
              error={formik.errors.document_ids_text}
              touched={formik.touched.document_ids_text}
            >
              <Input
                id="document_ids_text"
                name="document_ids_text"
                placeholder="e.g. 9, 10, 11"
                value={formik.values.document_ids_text}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated tender_documents ids ChatGPT should read (main offer, alternative offer, license).
              </p>
            </FormField>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || formik.isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
