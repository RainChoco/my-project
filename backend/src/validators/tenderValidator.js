const yup = require('yup');

const STATUS_VALUES = ['draft', 'submitted', 'under_evaluation', 'approved', 'rejected', 'withdrawn'];
const ELIGIBILITY_STATUS_VALUES = ['pending', 'eligible', 'flagged', 'rejected'];
const FILE_TYPE_VALUES = ['main_offer', 'alternative_offer', 'license', 'other'];
const BCA_GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

const idParams = yup.object({ id: yup.number().integer().required() });
const idAndDocumentIdParams = yup.object({
  id: yup.number().integer().required(),
  documentId: yup.number().integer().required()
});

const createTenderSchema = yup.object({
  body: yup.object({
    tender_ref_no: yup.string().trim().required('tender_ref_no is required'),
    vendor_name: yup.string().trim().required('vendor_name is required'),
    submission_date: yup.date().required('submission_date is required'),
    main_offer_price: yup
      .number()
      .typeError('main_offer_price must be a number')
      .positive('main_offer_price must be a positive number')
      .required('main_offer_price is required'),
    alternative_offer_price: yup
      .number()
      .typeError('alternative_offer_price must be a number')
      .positive('alternative_offer_price must be a positive number')
      .nullable()
      .optional()
  })
});

const listTendersSchema = yup.object({
  query: yup.object({
    status: yup.string().oneOf(STATUS_VALUES, 'invalid status').optional(),
    eligibility_status: yup.string().oneOf(ELIGIBILITY_STATUS_VALUES, 'invalid eligibility_status').optional(),
    vendor_name: yup.string().optional(),
    page: yup.number().integer().min(1).optional(),
    limit: yup.number().integer().min(1).max(100).optional()
  })
});

const tenderIdParamsSchema = yup.object({ params: idParams });

const updateTenderSchema = yup.object({
  params: idParams,
  body: yup.object({
    tender_ref_no: yup.string().trim().optional(),
    vendor_name: yup.string().trim().optional(),
    submission_date: yup.date().optional(),
    main_offer_price: yup.number().typeError('main_offer_price must be a number').positive().optional(),
    alternative_offer_price: yup.number().typeError('alternative_offer_price must be a number').positive().nullable().optional(),
    paid_up_capital: yup.number().typeError('paid_up_capital must be a number').positive().nullable().optional(),
    bca_fm01_license_no: yup.string().nullable().optional(),
    bca_fm01_grade: yup.string().oneOf(BCA_GRADES, 'invalid bca_fm01_grade').nullable().optional(),
    non_debarment_declared: yup.boolean().optional()
  })
});

const uploadDocumentSchema = yup.object({
  params: idParams,
  body: yup.object({
    file_type: yup.string().oneOf(FILE_TYPE_VALUES, 'file_type must be one of: ' + FILE_TYPE_VALUES.join(', ')).required('file_type is required')
  })
});

const listDocumentsSchema = yup.object({
  params: idParams,
  query: yup.object({
    latest_only: yup.string().oneOf(['true', 'false'], 'latest_only must be true or false').optional()
  })
});

const replaceDocumentSchema = yup.object({
  params: idAndDocumentIdParams
});

const eligibilityCheckIdParamsSchema = yup.object({ params: idParams });

const eligibilityOverrideSchema = yup.object({
  params: idParams,
  body: yup.object({
    passed: yup.boolean().required('passed is required'),
    notes: yup.string().trim().min(1, 'notes is required').required('notes is required')
  })
});

const bcaGradeParamsSchema = yup.object({
  params: yup.object({ grade: yup.string().oneOf(BCA_GRADES, 'invalid grade').required() })
});

const bcaGradeLimitUpdateSchema = yup.object({
  params: yup.object({ grade: yup.string().oneOf(BCA_GRADES, 'invalid grade').required() }),
  body: yup.object({
    max_tender_value: yup.number().typeError('max_tender_value must be a number').positive().nullable().optional(),
    effective_from: yup.date().required('effective_from is required')
  })
});

const eligibilityThresholdUpdateSchema = yup.object({
  params: yup.object({ criterionKey: yup.string().required() }),
  body: yup.object({
    threshold_value: yup
      .number()
      .typeError('threshold_value must be a number')
      .positive('threshold_value must be a positive number')
      .required('threshold_value is required')
  })
});

module.exports = {
  STATUS_VALUES,
  ELIGIBILITY_STATUS_VALUES,
  FILE_TYPE_VALUES,
  BCA_GRADES,
  createTenderSchema,
  listTendersSchema,
  tenderIdParamsSchema,
  updateTenderSchema,
  uploadDocumentSchema,
  listDocumentsSchema,
  replaceDocumentSchema,
  eligibilityCheckIdParamsSchema,
  eligibilityOverrideSchema,
  bcaGradeParamsSchema,
  bcaGradeLimitUpdateSchema,
  eligibilityThresholdUpdateSchema
};
