import { useFormik } from 'formik';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { FormField } from './FormField';
import { confirmInputsSchema } from '../schemas/evaluationSchema';

// UC-B4 step 5 -> UC-B5: evaluator reviews/corrects the AI-extracted inputs and
// confirms them, which triggers deterministic backend PQM computation. Only
// these three raw inputs are ever sent - price_score/quality_score/pqm_score
// are always computed server-side, never accepted from this form.
export function ConfirmInputsForm({ initialInputs, onSubmit, isSubmitting, submitError }) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      main_offer_price: initialInputs?.main_offer_price ?? '',
      alternative_offer_price: initialInputs?.alternative_offer_price ?? '',
      technical_proposal_score_raw: initialInputs?.technical_proposal_score_raw ?? '',
    },
    validationSchema: confirmInputsSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = {
        main_offer_price: values.main_offer_price === '' ? null : Number(values.main_offer_price),
        alternative_offer_price: values.alternative_offer_price === '' ? null : Number(values.alternative_offer_price),
        technical_proposal_score_raw: values.technical_proposal_score_raw === '' ? null : Number(values.technical_proposal_score_raw),
      };
      try {
        await onSubmit(payload);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Main offer price"
        htmlFor="main_offer_price"
        error={formik.errors.main_offer_price}
        touched={formik.touched.main_offer_price}
      >
        <Input
          id="main_offer_price"
          name="main_offer_price"
          type="number"
          min="0"
          step="0.01"
          value={formik.values.main_offer_price}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      <FormField
        label="Alternative offer price (optional)"
        htmlFor="alternative_offer_price"
        error={formik.errors.alternative_offer_price}
        touched={formik.touched.alternative_offer_price}
      >
        <Input
          id="alternative_offer_price"
          name="alternative_offer_price"
          type="number"
          min="0"
          step="0.01"
          value={formik.values.alternative_offer_price}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      <FormField
        label="Technical proposal score (0-100)"
        htmlFor="technical_proposal_score_raw"
        error={formik.errors.technical_proposal_score_raw}
        touched={formik.touched.technical_proposal_score_raw}
      >
        <Input
          id="technical_proposal_score_raw"
          name="technical_proposal_score_raw"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formik.values.technical_proposal_score_raw}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || formik.isSubmitting} className="self-start">
        {isSubmitting ? 'Confirming...' : 'Confirm inputs & compute PQM score'}
      </Button>
    </form>
  );
}
