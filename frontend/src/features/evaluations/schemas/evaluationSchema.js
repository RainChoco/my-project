import * as Yup from 'yup';

// Mirrors backend/src/validators/evaluationValidator.js exactly.

// document_ids is entered as free text (comma/space separated) since there is
// no document picker UI yet (Zheng Hong's Scope A tender documents) - the form
// parses it into an array of numbers before this schema validates it.
export const documentIdsSchema = Yup.array()
  .of(Yup.number().typeError('Document ids must be numbers').integer().positive())
  .min(1, 'Enter at least one document id')
  .required('document_ids is required');

export const processEvaluationSchema = Yup.object({
  document_ids: documentIdsSchema,
});

export const reprocessSchema = Yup.object({
  document_ids: documentIdsSchema,
});

export const confirmInputsSchema = Yup.object({
  main_offer_price: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be below 0')
    .nullable(),
  alternative_offer_price: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be below 0')
    .nullable(),
  technical_proposal_score_raw: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be below 0')
    .max(100, 'Cannot exceed 100')
    .nullable(),
});
