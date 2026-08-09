import { useFormik } from 'formik';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import { tenderIdLookupSchema } from '../schemas/clarificationSchemas';

// UC-D1: ma_staff manually (re-)triggers AI pricing-deviation detection for a
// tender. There's no tender picker UI shared across scopes yet, so the tender
// is looked up by its ref no (or internal id) - the backend resolves either.
export function DetectDeviationDialog({ open, onOpenChange, onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    initialValues: { tender_id: '' },
    validationSchema: tenderIdLookupSchema,
    onSubmit: async (values) => {
      await onSubmit(values.tender_id.trim());
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={formik.handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Detect pricing deviation</DialogTitle>
            <DialogDescription>
              Compares the tender's main and alternative offer prices via ChatGPT and flags anything past the
              tolerance threshold.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <FormField
              label="Tender Ref No"
              htmlFor="tender_id"
              error={formik.errors.tender_id}
              touched={formik.touched.tender_id}
            >
              <Input
                id="tender_id"
                name="tender_id"
                type="text"
                placeholder="TC-2026-006"
                value={formik.values.tender_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </FormField>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || formik.isSubmitting}>
              {isSubmitting ? 'Checking...' : 'Run detection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
