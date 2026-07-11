import { useFormik } from 'formik';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from './NativeSelect';
import { Textarea } from '@/components/ui/textarea';
import { eligibilityOverrideSchema } from '../schemas';

function OverrideCheckDialog({ check, isPending, onSubmit, onCancel }) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      passed: check ? String(check.passed) : 'true',
      notes: '',
    },
    validationSchema: eligibilityOverrideSchema,
    onSubmit: (values) => {
      onSubmit(eligibilityOverrideSchema.cast(values));
    },
  });

  return (
    <Dialog open={Boolean(check)} onOpenChange={(open) => !open && onCancel()}>
      {check && (
        <DialogContent>
          <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Manual review - {check.criterion}</DialogTitle>
              <DialogDescription>
                Record the verified outcome. A documented reason is required for every manual override (UC-A7).
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="override-passed">Outcome</Label>
              <NativeSelect
                id="override-passed"
                name="passed"
                value={formik.values.passed}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="true">Passed</option>
                <option value="false">Failed</option>
              </NativeSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="override-notes">Notes</Label>
              <Textarea
                id="override-notes"
                name="notes"
                rows={3}
                placeholder="Explain what was manually verified and why..."
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.notes && formik.errors.notes && (
                <p className="text-xs text-destructive">{formik.errors.notes}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Override'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default OverrideCheckDialog;
