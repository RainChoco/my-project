import * as Yup from 'yup';

// Mirrors backend/src/validators/approvalValidator.js exactly, including the
// 'revision_requested' decision added beyond the original design docs.
export const DECISIONS = ['approved', 'rejected', 'revision_requested'];
const REMARKS_REQUIRED_DECISIONS = ['rejected', 'revision_requested'];

export const createApprovalSchema = Yup.object({
  decision: Yup.string()
    .oneOf(DECISIONS, 'decision must be one of: ' + DECISIONS.join(', '))
    .required('decision is required'),
  remarks: Yup.string().trim().when('decision', {
    is: (decision) => REMARKS_REQUIRED_DECISIONS.includes(decision),
    then: (schema) => schema.required('remarks is required when decision is "rejected" or "revision_requested"'),
    otherwise: (schema) => schema.notRequired(),
  }),
});
