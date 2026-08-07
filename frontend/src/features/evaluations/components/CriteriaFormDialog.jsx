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
import { Textarea } from '../../../components/ui/textarea';
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
  CATEGORY_LABELS,
  createCriteriaSchema,
  updateCriteriaSchema,
} from '../schemas/evaluationCriteriaSchema';
import { cn } from '../../../lib';

const round2 = (n) => Math.round(n * 100) / 100;

// One dialog handles both create (ma_staff, UC-B1) and edit (UC-B2) - category
// is fixed once created, matching PUT /api/evaluation-criteria/:id which only
// accepts criteria_name/description/weight_percentage.
// `prefill` optionally seeds the create form from a suggested-criteria quick-add
// card - the user still has to review and press Save, nothing is inserted for them.
export function CriteriaFormDialog({ open, onOpenChange, mode, criterion, prefill, activeWeightTotal = 0, onSubmit, isSubmitting, submitError }) {
  const isEdit = mode === 'edit';

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      criteria_name: criterion?.criteria_name ?? prefill?.criteria_name ?? '',
      category: criterion?.category ?? prefill?.category ?? '',
      description: criterion?.description ?? prefill?.description ?? '',
      weight_percentage: criterion?.weight_percentage ?? '',
    },
    validationSchema: isEdit ? updateCriteriaSchema : createCriteriaSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(
          isEdit
            ? { criteria_name: values.criteria_name, description: values.description, weight_percentage: values.weight_percentage }
            : values
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Live preview only - the backend remains the source of truth for the 100% rule
  // (create: reject if it would push the total over 100%; edit: must land on
  // exactly 100% when the criterion being edited is active).
  const otherActiveTotal = round2(
    activeWeightTotal - (isEdit && criterion?.is_active ? Number(criterion.weight_percentage) : 0)
  );
  const enteredWeight = Number(formik.values.weight_percentage);
  const hasValidWeight = formik.values.weight_percentage !== '' && !Number.isNaN(enteredWeight);
  const projectedTotal = hasValidWeight ? round2(otherActiveTotal + enteredWeight) : null;
  const projectsOver100 = projectedTotal !== null && projectedTotal > 100;
  const wouldExceedOnCreate = !isEdit && projectsOver100;

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
                placeholder="e.g. Relevant Experience"
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
                      {CATEGORY_LABELS[category] ?? category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && <p className="text-xs text-muted-foreground">Category can't be changed after creation.</p>}
            </FormField>

            <FormField
              label="Description"
              htmlFor="description"
              error={formik.errors.description}
              touched={formik.touched.description}
            >
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Explain what evaluators should assess, e.g. checks whether the vendor has completed similar projects."
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
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
              {hasValidWeight && (!isEdit || criterion?.is_active) && (
                <p className={cn('text-xs', wouldExceedOnCreate ? 'text-destructive' : 'text-muted-foreground')}>
                  Active weight total after saving: {projectedTotal}%
                  {wouldExceedOnCreate && ' - this exceeds the 100% limit and will be rejected.'}
                </p>
              )}
            </FormField>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || formik.isSubmitting || wouldExceedOnCreate}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
