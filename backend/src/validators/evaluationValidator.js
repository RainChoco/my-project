const yup = require('yup');

const documentIdsSchema = yup.array()
  .of(yup.number().integer().positive())
  .min(1, 'document_ids must contain at least one document id')
  .required('document_ids is required');

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
  }),
  body: yup.object({
    document_ids: documentIdsSchema
  })
});

const confirmInputsSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  }),
  body: yup.object({
    ai_extracted_inputs: yup.object({
      main_offer_price: yup.number().min(0, 'main_offer_price cannot be below 0').nullable(),
      alternative_offer_price: yup.number().min(0, 'alternative_offer_price cannot be below 0').nullable(),
      technical_proposal_score_raw: yup.number()
        .min(0, 'technical_proposal_score_raw cannot be below 0')
        .max(100, 'technical_proposal_score_raw cannot exceed 100')
        .nullable()
    }).required('ai_extracted_inputs is required')
  })
});

const reprocessSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  }),
  body: yup.object({
    document_ids: documentIdsSchema
  })
});

module.exports = {
  idParamSchema,
  tenderIdParamSchema,
  createEvaluationSchema,
  confirmInputsSchema,
  reprocessSchema
};
