import * as Yup from 'yup';

// Mirrors backend/src/validators/evaluationValidator.js's scoreEntrySchema exactly.
// staff_score is nullable here because a draft save can leave criteria unscored -
// the "every criterion must have a score" rule is only enforced at submit time.
export const criterionScoreSchema = Yup.object({
  evaluation_criteria_id: Yup.number().integer().positive().required(),
  staff_score: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Cannot be below 0')
    .max(100, 'Cannot exceed 100')
    .nullable(),
  remarks: Yup.string().nullable(),
});

export const scoresFormSchema = Yup.object({
  scores: Yup.array().of(criterionScoreSchema),
});
