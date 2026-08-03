const yup = require('yup');

const CATEGORY_VALUES = ['Cleaning', 'Maintenance', 'Landscaping', 'Lift Maintenance', 'Pest Control', 'Repair & Redecoration (R&R)', 'Upgrading Works'];
const STATUS_VALUES = ['Draft', 'Open', 'Evaluating', 'Awarded', 'Closed', 'Archived', 'Cancelled'];

const idParams = yup.object({ id: yup.string().trim().required() });

// -- Contract Terms & Legal Framework (all optional) --
const contractTermsFields = {
  securityDepositAmount: yup
    .number()
    .typeError('securityDepositAmount must be a number')
    .positive('securityDepositAmount must be a positive number')
    .nullable()
    .optional(),
  bankGuaranteeTerms: yup.string().trim().nullable().optional(),
  publicLiabilityInsuranceMin: yup
    .number()
    .typeError('publicLiabilityInsuranceMin must be a number')
    .positive('publicLiabilityInsuranceMin must be a positive number')
    .nullable()
    .optional(),
  publicLiabilityInsuranceMax: yup
    .number()
    .typeError('publicLiabilityInsuranceMax must be a number')
    .positive('publicLiabilityInsuranceMax must be a positive number')
    .nullable()
    .optional()
    .test(
      'gte-min',
      'publicLiabilityInsuranceMax must be greater than or equal to publicLiabilityInsuranceMin',
      function (value) {
        const { publicLiabilityInsuranceMin } = this.parent;
        if (value == null || publicLiabilityInsuranceMin == null) return true;
        return value >= publicLiabilityInsuranceMin;
      }
    ),
  monthlyManagementFeeRate: yup
    .number()
    .typeError('monthlyManagementFeeRate must be a number')
    .positive('monthlyManagementFeeRate must be a positive number')
    .nullable()
    .optional(),
  contractStartDate: yup.date().typeError('contractStartDate must be a valid date').nullable().optional(),
  contractEndDate: yup
    .date()
    .typeError('contractEndDate must be a valid date')
    .nullable()
    .optional()
    .test('after-start', 'contractEndDate must be after contractStartDate', function (value) {
      const { contractStartDate } = this.parent;
      if (!value || !contractStartDate) return true;
      return new Date(value) > new Date(contractStartDate);
    }),
  optionToExtend: yup.boolean().optional(),
  defectsLiabilityPeriodMonths: yup
    .number()
    .typeError('defectsLiabilityPeriodMonths must be a number')
    .integer('defectsLiabilityPeriodMonths must be a whole number')
    .positive('defectsLiabilityPeriodMonths must be a positive number')
    .nullable()
    .optional(),
  terminationNoticePeriodDays: yup
    .number()
    .typeError('terminationNoticePeriodDays must be a number')
    .integer('terminationNoticePeriodDays must be a whole number')
    .positive('terminationNoticePeriodDays must be a positive number')
    .nullable()
    .optional()
};

const createContractSchema = yup.object({
  body: yup.object({
    name: yup.string().trim().required('name is required'),
    category: yup.string().trim().required('category is required'),
    description: yup.string().trim().nullable().optional(),
    budgetLimit: yup
      .number()
      .typeError('budgetLimit must be a number')
      .positive('budgetLimit must be a positive number')
      .required('budgetLimit is required'),
    openingDate: yup.date().typeError('openingDate must be a valid date').required('openingDate is required'),
    closingDate: yup.date().typeError('closingDate must be a valid date').required('closingDate is required'),
    status: yup.string().oneOf(STATUS_VALUES, 'invalid status').optional(),
    ...contractTermsFields
  })
});

const updateContractSchema = yup.object({
  params: idParams,
  body: yup.object({
    name: yup.string().trim().optional(),
    category: yup.string().trim().optional(),
    description: yup.string().trim().nullable().optional(),
    budgetLimit: yup.number().typeError('budgetLimit must be a number').positive('budgetLimit must be a positive number').optional(),
    openingDate: yup.date().typeError('openingDate must be a valid date').optional(),
    closingDate: yup.date().typeError('closingDate must be a valid date').optional(),
    status: yup.string().oneOf(STATUS_VALUES, 'invalid status').optional(),
    ...contractTermsFields
  })
});

const contractIdParamsSchema = yup.object({ params: idParams });

module.exports = {
  CATEGORY_VALUES,
  STATUS_VALUES,
  createContractSchema,
  updateContractSchema,
  contractIdParamsSchema
};
