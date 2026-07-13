import { useFormik } from 'formik';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from './FormField';
import { sendClarificationSchema } from '../schemas/clarificationSchemas';
import { DISPATCH_CHANNEL_VALUES, DISPATCH_CHANNEL_LABELS } from '../constants';

// UC-D4: dispatch the approved draft to the vendor - email (system-sent) or
// manual (staff sent it outside the system and is logging the dispatch here).
export function SendForm({ onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    initialValues: { dispatch_channel: '' },
    validationSchema: sendClarificationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values.dispatch_channel);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Dispatch channel"
        htmlFor="dispatch_channel"
        error={formik.errors.dispatch_channel}
        touched={formik.touched.dispatch_channel}
      >
        <Select
          value={formik.values.dispatch_channel}
          onValueChange={(value) => formik.setFieldValue('dispatch_channel', value)}
        >
          <SelectTrigger id="dispatch_channel">
            <SelectValue placeholder="How was/will this be sent?" />
          </SelectTrigger>
          <SelectContent>
            {DISPATCH_CHANNEL_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {DISPATCH_CHANNEL_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || formik.isSubmitting} className="self-start">
        {isSubmitting ? 'Sending...' : 'Send to vendor'}
      </Button>
    </form>
  );
}
