const yup = require('yup');

const idParamSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  })
});

const tenderIdParamSchema = yup.object({
  params: yup.object({
    tenderId: yup.number().integer().positive().required()
  })
});

const createEvaluationSchema = yup.object({
  params: yup.object({
    tenderId: yup.number().integer().positive().required()
  })
});

const scoreEntrySchema = yup.object({
  evaluation_criteria_id: yup.number().integer().positive().required('evaluation_criteria_id is required'),
  staff_score: yup.number()
    .min(0, 'staff_score cannot be below 0')
    .max(100, 'staff_score cannot exceed 100')
    .nullable(),
  remarks: yup.string().nullable().optional()
});

const saveScoresSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  }),
  body: yup.object({
    scores: yup.array().of(scoreEntrySchema).min(1, 'scores must contain at least one entry').required('scores is required')
  })
});

const submitSchema = idParamSchema;

const reprocessSchema = idParamSchema;

const listCompletedSchema = yup.object({
  query: yup.object({
    tender_id: yup.number().integer().positive().optional()
  })
});

module.exports = {
  idParamSchema,
  tenderIdParamSchema,
  createEvaluationSchema,
  saveScoresSchema,
  submitSchema,
  reprocessSchema,
  listCompletedSchema
};
