const yup = require('yup');

// 'revision_requested' is a third value added beyond database-schema.md/
// api-documentation.md's original ('approved','rejected') - see approvals model.
const DECISIONS = ['approved', 'rejected', 'revision_requested'];
const REMARKS_REQUIRED_DECISIONS = ['rejected', 'revision_requested'];

const approvalIdParamSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  })
});

const createApprovalSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  }),
  body: yup.object({
    decision: yup.string()
      .oneOf(DECISIONS, 'decision must be one of: ' + DECISIONS.join(', '))
      .required('decision is required'),
    remarks: yup.string().trim().when('decision', {
      is: (decision) => REMARKS_REQUIRED_DECISIONS.includes(decision),
      then: (schema) => schema.required('remarks is required when decision is "rejected" or "revision_requested"'),
      otherwise: (schema) => schema.notRequired()
    })
  })
});

module.exports = {
  DECISIONS,
  REMARKS_REQUIRED_DECISIONS,
  approvalIdParamSchema,
  createApprovalSchema
};
