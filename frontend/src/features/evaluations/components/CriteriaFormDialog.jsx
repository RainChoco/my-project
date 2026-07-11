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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select';
import { FormField } from './FormField';
import {
  CATEGORIES,
  createCriteriaSchema,
  updateCriteriaSchema,
} from '../schemas/evaluationCriteriaSchema';

// One dialog handles both create (ma_staff, UC-B1) and edit (UC-B2) - category
// is fixed once created, matching PUT /api/evaluation-criteria/:id which only
// accepts criteria_name/weight_percentage.
export function CriteriaFormDialog({ open, onOpenChange, mode, criterion, onSubmit, isSubmitting, submitError }) {
  const isEdit = mode === 'edit';

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      criteria_name: criterion?.criteria_name ?? '',
      category: criterion?.category ?? '',
      weight_percentage: criterion?.weight_percentage ?? '',
    },
    validationSchema: isEdit ? updateCriteriaSchema : createCriteriaSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(isEdit ? { criteria_name: values.criteria_name, weight_percentage: values.weight_percentage } : values);
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
            <DialogTitle>{isEdit ? 'Edit criterion' : 'Add evaluation criterion'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Editing never rewrites past evaluations' scores - only future evaluations use the new weight."
                : 'Active criteria weights must not exceed 100% in total.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <FormField label="Criterion name" htmlFor="criteria_name" error={formik.errors.criteria_name} touched={formik.touched.criteria_name}>
              <Input
                id="criteria_name"
                name="criteria_name"
                value={formik.values.criteria_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </FormField>

            <FormField label="Category" htmlFor="category" error={formik.errors.category} touched={formik.touched.category}>
              <Select
                value={formik.values.category}
                disabled={isEdit}
                onValueChange={(value) => formik.setFieldValue('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && <p className="text-xs text-muted-foreground">Category can't be changed after creation.</p>}
            </FormField>

            <FormField
              label="Weight percentage"
              htmlFor="weight_percentage"
              error={formik.errors.weight_percentage}
              touched={formik.touched.weight_percentage}
            >
              <Input
                id="weight_percentage"
                name="weight_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formik.values.weight_percentage}
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
