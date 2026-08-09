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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from './FormField';
import { tenderIdLookupSchema } from '../schemas/clarificationSchemas';

// UC-D1: ma_staff manually (re-)triggers AI pricing-deviation detection for a
// tender, picked from a dropdown of real tenders (tenders/isTendersLoading come
// from ClarificationLogsPage's own tender-filter query, reused here instead of
// fetching a second time).
export function DetectDeviationDialog({ open, onOpenChange, onSubmit, isSubmitting, submitError, tenders = [], isTendersLoading = false }) {
  const formik = useFormik({
    initialValues: { tender_id: '' },
    validationSchema: tenderIdLookupSchema,
    onSubmit: async (values) => {
      await onSubmit(Number(values.tender_id));
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
              label="Tender"
              htmlFor="tender_id"
              error={formik.errors.tender_id}
              touched={formik.touched.tender_id}
            >
              <Select
                value={formik.values.tender_id ? String(formik.values.tender_id) : ''}
                onValueChange={(value) => {
                  formik.setFieldValue('tender_id', value);
                  formik.setFieldTouched('tender_id', true);
                }}
                disabled={isTendersLoading}
              >
                <SelectTrigger id="tender_id">
                  <SelectValue placeholder={isTendersLoading ? 'Loading tenders...' : 'Select a tender'} />
                </SelectTrigger>
                <SelectContent>
                  {tenders.map((tender) => (
                    <SelectItem key={tender.id} value={String(tender.id)}>
                      {tender.tender_ref_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
