const yup = require('yup');

const LOG_TYPE_VALUES = ['pricing_deviation', 'job_adjustment_notification'];
const LOG_STATUS_VALUES = [
  'flagged',
  'no_action_required',
  'draft_ready',
  'approved',
  'sent',
  'responded',
  'escalated',
  'resolved'
];
const DISPATCH_CHANNEL_VALUES = ['email', 'manual'];
const APPROVAL_STATUS_VALUES = ['pending_approval', 'approved', 'rejected'];
const BOOLEAN_STRING_VALUES = ['true', 'false'];

const tenderIdParams = yup.object({ tenderId: yup.number().integer().required() });
const logIdParams = yup.object({ id: yup.number().integer().required() });
const messageIdParams = yup.object({ messageId: yup.number().integer().required() });
const jobAdjustmentIdParams = yup.object({ id: yup.number().integer().required() });

// --- Pricing Deviation Detection ---

const detectDeviationSchema = yup.object({ params: tenderIdParams });

// --- Clarification Logs ---

const listClarificationLogsSchema = yup.object({
  query: yup.object({
    tender_id: yup.number().integer().optional(),
    log_type: yup.string().oneOf(LOG_TYPE_VALUES, 'invalid log_type').optional(),
    status: yup.string().oneOf(LOG_STATUS_VALUES, 'invalid status').optional(),
    overdue: yup.string().oneOf(BOOLEAN_STRING_VALUES, 'overdue must be true or false').optional(),
    page: yup.number().integer().min(1).optional(),
    limit: yup.number().integer().min(1).max(100).optional()
  })
});

const clarificationLogIdParamsSchema = yup.object({ params: logIdParams });

// --- Draft, Review & Dispatch ---

const draftMessageSchema = yup.object({ params: logIdParams });

const editMessageSchema = yup.object({
  params: messageIdParams,
  body: yup.object({
    subject: yup.string().trim().nullable().optional(),
    body: yup.string().trim().min(1, 'body is required').required('body is required')
  })
});

const approveMessageSchema = yup.object({ params: messageIdParams });

const sendClarificationSchema = yup.object({
  params: logIdParams,
  body: yup.object({
    dispatch_channel: yup
      .string()
      .oneOf(DISPATCH_CHANNEL_VALUES, 'dispatch_channel must be one of: ' + DISPATCH_CHANNEL_VALUES.join(', '))
      .required('dispatch_channel is required')
  })
});

// --- Vendor Responses & Attachments ---

const recordResponseSchema = yup.object({
  params: logIdParams,
  body: yup.object({
    subject: yup.string().trim().nullable().optional(),
    body: yup.string().trim().min(1, 'body is required').required('body is required'),
    response_notes: yup.string().trim().min(1, 'response_notes is required').required('response_notes is required')
  })
});

const addAttachmentSchema = yup.object({ params: messageIdParams });

// --- Job Adjustment Requests ---

const createJobAdjustmentRequestSchema = yup.object({
  params: logIdParams,
  body: yup.object({
    source_message_id: yup.number().integer().required('source_message_id is required'),
    description: yup.string().trim().min(1, 'description is required').required('description is required'),
    justification: yup.string().trim().min(1, 'justification is required').required('justification is required'),
    is_material: yup.boolean().optional().default(false)
  })
});

const listJobAdjustmentRequestsSchema = yup.object({
  query: yup.object({
    tender_id: yup.number().integer().optional(),
    approval_status: yup.string().oneOf(APPROVAL_STATUS_VALUES, 'invalid approval_status').optional(),
    is_material: yup.string().oneOf(BOOLEAN_STRING_VALUES, 'is_material must be true or false').optional()
  })
});

const updateJobAdjustmentRequestSchema = yup.object({
  params: jobAdjustmentIdParams,
  body: yup.object({
    approval_status: yup
      .string()
      .oneOf(['approved', 'rejected'], 'approval_status must be one of: approved, rejected')
      .required('approval_status is required')
  })
});

const jobAdjustmentIdParamsSchema = yup.object({ params: jobAdjustmentIdParams });

// --- Resend, Escalate & Resolve ---

const resendSchema = yup.object({ params: logIdParams });

const escalateSchema = yup.object({ params: logIdParams });

const resolveSchema = yup.object({
  params: logIdParams,
  body: yup.object({
    outcome_notes: yup.string().trim().min(1, 'outcome_notes is required').required('outcome_notes is required')
  })
});

module.exports = {
  LOG_TYPE_VALUES,
  LOG_STATUS_VALUES,
  DISPATCH_CHANNEL_VALUES,
  APPROVAL_STATUS_VALUES,
  detectDeviationSchema,
  listClarificationLogsSchema,
  clarificationLogIdParamsSchema,
  draftMessageSchema,
  editMessageSchema,
  approveMessageSchema,
  sendClarificationSchema,
  recordResponseSchema,
  addAttachmentSchema,
  createJobAdjustmentRequestSchema,
  listJobAdjustmentRequestsSchema,
  updateJobAdjustmentRequestSchema,
  jobAdjustmentIdParamsSchema,
  resendSchema,
  escalateSchema,
  resolveSchema
};
