const { Op } = require('sequelize');
const { Tender, ClarificationLog, ClarificationMessage, ClarificationAttachment, JobAdjustmentRequest } = require('../models');
const cloudinaryService = require('../services/cloudinaryService');
const clarificationAiService = require('../services/clarificationAiService');

// Matches the seeded demo data's assumed tolerance (see 20260101000008-demo-clarification-logs.js:
// tender 1's 3.33% deviation is 'no_action_required', tender 5's 4.35% is 'flagged').
const DEVIATION_TOLERANCE_PERCENTAGE = 4;
const FOLLOW_UP_WINDOW_DAYS = 5;
// Every status a pricing_deviation log can hold except the two "closed" ones - mirrors
// the partial unique index in the database-schema doc that blocks a second in-flight log.
const ACTIVE_PRICING_DEVIATION_STATUSES = ['flagged', 'draft_ready', 'approved', 'sent', 'responded', 'escalated'];

function addDaysAsDateOnly(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Pricing Deviation Detection
// ---------------------------------------------------------------------------

const detectDeviation = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.tenderId);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    if (tender.alternative_offer_price == null) {
      return res.status(409).json({ status: 'error', message: 'Tender has no alternative_offer_price submitted' });
    }

    const existingActive = await ClarificationLog.findOne({
      where: { tender_id: tender.id, log_type: 'pricing_deviation', status: { [Op.in]: ACTIVE_PRICING_DEVIATION_STATUSES } }
    });
    if (existingActive) {
      return res.status(409).json({ status: 'error', message: 'An active pricing_deviation log already exists for this tender' });
    }

    const mainPrice = Number(tender.main_offer_price);
    const altPrice = Number(tender.alternative_offer_price);
    const deviationAmount = Math.abs(mainPrice - altPrice);
    const deviationPercentage = Number(((deviationAmount / mainPrice) * 100).toFixed(2));
    const exceedsTolerance = deviationPercentage > DEVIATION_TOLERANCE_PERCENTAGE;

    let rationale;
    try {
      rationale = clarificationAiService.generateDeviationRationale({
        deviationPercentage,
        tolerancePercentage: DEVIATION_TOLERANCE_PERCENTAGE,
        exceedsTolerance
      });
    } catch (aiError) {
      console.error('ChatGPT rationale generation failed:', aiError);
      return res.status(502).json({ status: 'error', message: 'ChatGPT API request failed or returned an unparseable result' });
    }

    const log = await ClarificationLog.create({
      tender_id: tender.id,
      log_type: 'pricing_deviation',
      status: exceedsTolerance ? 'flagged' : 'no_action_required',
      main_offer_price_snapshot: mainPrice,
      alternative_offer_price_snapshot: altPrice,
      deviation_amount: deviationAmount,
      deviation_percentage: deviationPercentage,
      ai_rationale: rationale
    });

    return res.status(exceedsTolerance ? 201 : 200).json(log.toJSON());
  } catch (error) {
    console.error('Error in detectDeviation:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Clarification Logs
// ---------------------------------------------------------------------------

const listClarificationLogs = async (req, res) => {
  try {
    const { tender_id, log_type, status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const where = {};
    if (tender_id) where.tender_id = tender_id;
    if (log_type) where.log_type = log_type;
    if (status) where.status = status;
    if (req.query.overdue === 'true') {
      // UC-D8 dashboard filter overrides any explicit status - overdue only ever means
      // 'sent' logs past their follow-up window.
      where.status = 'sent';
      where.follow_up_due_at = { [Op.lt]: new Date().toISOString().slice(0, 10) };
    }

    const { rows, count } = await ClarificationLog.findAndCountAll({
      where,
      include: [{ model: Tender, as: 'tender', attributes: ['tender_ref_no', 'vendor_name'] }],
      offset: (page - 1) * limit,
      limit,
      order: [['updated_at', 'DESC']]
    });

    return res.status(200).json({
      data: rows.map((log) => ({
        id: log.id,
        tender_id: log.tender_id,
        tender_ref_no: log.tender?.tender_ref_no ?? null,
        vendor_name: log.tender?.vendor_name ?? null,
        log_type: log.log_type,
        status: log.status,
        deviation_percentage: log.deviation_percentage,
        follow_up_due_at: log.follow_up_due_at,
        updated_at: log.updated_at
      })),
      pagination: { page, limit, total: count }
    });
  } catch (error) {
    console.error('Error in listClarificationLogs:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const getClarificationLog = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id, {
      include: [
        { model: ClarificationMessage, as: 'messages' },
        { model: JobAdjustmentRequest, as: 'jobAdjustmentRequests' }
      ],
      order: [[{ model: ClarificationMessage, as: 'messages' }, 'created_at', 'ASC']]
    });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }

    const { jobAdjustmentRequests, messages, ...logFields } = log.toJSON();
    return res.status(200).json({ ...logFields, messages, job_adjustment_requests: jobAdjustmentRequests });
  } catch (error) {
    console.error('Error in getClarificationLog:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Draft, Review & Dispatch
// ---------------------------------------------------------------------------

const draftMessage = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id, { include: [{ model: Tender, as: 'tender' }] });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }

    if (log.log_type === 'pricing_deviation') {
      if (log.status !== 'flagged') {
        return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'flagged' to draft a message` });
      }
    } else {
      // job_adjustment_notification logs are created directly at 'draft_ready' (they skip
      // detection entirely - see database-schema.md), not 'flagged'. The API doc's
      // follow-up-notification section still points here to draft that log's first
      // message, so this branch reconciles the two docs: allow exactly one first draft on
      // a draft_ready job_adjustment_notification log with no messages yet.
      if (log.status !== 'draft_ready') {
        return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'draft_ready' to draft a follow-up message` });
      }
      const existingMessageCount = await ClarificationMessage.count({ where: { clarification_log_id: log.id } });
      if (existingMessageCount > 0) {
        return res.status(409).json({ status: 'error', message: 'This log already has a drafted message' });
      }
    }

    let draft;
    try {
      draft = clarificationAiService.generateDraftMessage({ log, tender: log.tender });
    } catch (aiError) {
      console.error('ChatGPT draft generation failed:', aiError);
      return res.status(502).json({ status: 'error', message: 'ChatGPT API request failed or timed out' });
    }

    const message = await ClarificationMessage.create({
      clarification_log_id: log.id,
      message_type: 'draft',
      subject: draft.subject,
      body: draft.body,
      ai_generated: true,
      created_by: req.user.id
    });

    if (log.status !== 'draft_ready') {
      await log.update({ status: 'draft_ready' });
    }

    return res.status(201).json(message.toJSON());
  } catch (error) {
    console.error('Error in draftMessage:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const editMessage = async (req, res) => {
  try {
    const message = await ClarificationMessage.findByPk(req.params.messageId);
    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message not found' });
    }
    if (message.message_type !== 'draft') {
      return res.status(409).json({ status: 'error', message: 'Only draft messages are editable' });
    }

    const updates = { body: req.body.body };
    if ('subject' in req.body) updates.subject = req.body.subject;

    await message.update(updates);
    return res.status(200).json(message.toJSON());
  } catch (error) {
    console.error('Error in editMessage:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const approveMessage = async (req, res) => {
  try {
    const message = await ClarificationMessage.findByPk(req.params.messageId, {
      include: [{ model: ClarificationLog, as: 'clarificationLog' }]
    });
    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message not found' });
    }
    if (message.message_type !== 'draft' || message.clarificationLog.status !== 'draft_ready') {
      return res.status(409).json({ status: 'error', message: 'Message must be a draft on a log with status draft_ready' });
    }

    await message.update({ approved_by: req.user.id, approved_at: new Date() });
    await message.clarificationLog.update({ status: 'approved' });

    return res.status(200).json(message.toJSON());
  } catch (error) {
    console.error('Error in approveMessage:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const sendClarification = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id, { include: [{ model: Tender, as: 'tender' }] });
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }
    if (log.status !== 'approved') {
      return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'approved' to send` });
    }
    // Known cross-scope gap (see design/sulaiman/database-schema.md Notes): no
    // vendor_contacts table/field exists yet on Tender. vendor_name is the only vendor
    // identifier currently available, so it stands in for "contact info on file" until
    // Scope A adds a real contact shape to reference here.
    if (!log.tender.vendor_name) {
      return res.status(409).json({ status: 'error', message: "Vendor has no contact information on file" });
    }

    const approvedDraft = await ClarificationMessage.findOne({
      where: { clarification_log_id: log.id, message_type: 'draft', approved_at: { [Op.ne]: null } },
      order: [['approved_at', 'DESC']]
    });
    if (!approvedDraft) {
      return res.status(409).json({ status: 'error', message: 'No approved draft message found for this log' });
    }

    const now = new Date();
    const sentMessage = await ClarificationMessage.create({
      clarification_log_id: log.id,
      message_type: 'sent',
      subject: approvedDraft.subject,
      body: approvedDraft.body,
      ai_generated: false,
      sent_at: now,
      dispatch_channel: req.body.dispatch_channel,
      source_draft_id: approvedDraft.id,
      created_by: req.user.id
    });

    // clarification_logs has no sent_at column (see database-schema.md) - follow_up_due_at
    // is the field UC-D8's overdue dashboard filter actually reads, so that's what gets set.
    await log.update({ status: 'sent', follow_up_due_at: addDaysAsDateOnly(now, FOLLOW_UP_WINDOW_DAYS) });

    return res.status(200).json(sentMessage.toJSON());
  } catch (error) {
    console.error('Error in sendClarification:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Vendor Responses & Attachments
// ---------------------------------------------------------------------------

const recordResponse = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }
    if (log.status !== 'sent') {
      return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'sent' to record a response` });
    }

    const message = await ClarificationMessage.create({
      clarification_log_id: log.id,
      message_type: 'vendor_response',
      subject: req.body.subject ?? null,
      body: req.body.body,
      ai_generated: false,
      created_by: req.user.id
    });

    await log.update({ status: 'responded', responded_at: new Date(), response_notes: req.body.response_notes });

    return res.status(201).json(message.toJSON());
  } catch (error) {
    console.error('Error in recordResponse:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const addAttachment = async (req, res) => {
  try {
    const message = await ClarificationMessage.findByPk(req.params.messageId, {
      include: [{ model: ClarificationLog, as: 'clarificationLog' }]
    });
    if (!message) {
      return res.status(404).json({ status: 'error', message: 'Message not found' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file attached' });
    }
    if (message.message_type !== 'vendor_response') {
      return res.status(409).json({ status: 'error', message: 'Attachments can only be added to vendor_response messages' });
    }

    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: `town-council-tender/${message.clarificationLog.tender_id}/clarifications`,
        publicId: `message-${message.id}-${Date.now()}`,
        resourceType: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return res.status(502).json({ status: 'error', message: 'Cloudinary upload failed' });
    }

    const attachment = await ClarificationAttachment.create({
      clarification_message_id: message.id,
      original_filename: req.file.originalname,
      cloudinary_public_id: uploadResult.public_id,
      file_url: uploadResult.secure_url,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format ?? null,
      file_size_bytes: req.file.size
    });

    return res.status(201).json(attachment.toJSON());
  } catch (error) {
    console.error('Error in addAttachment:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Job Adjustment Requests
// ---------------------------------------------------------------------------

const createJobAdjustmentRequest = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }

    const { source_message_id, description, justification, is_material } = req.body;

    const sourceMessage = await ClarificationMessage.findOne({
      where: { id: source_message_id, clarification_log_id: log.id }
    });
    if (!sourceMessage) {
      return res.status(404).json({ status: 'error', message: 'source_message_id does not belong to this clarification log' });
    }

    if (log.status !== 'responded') {
      return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'responded' to log a job adjustment request` });
    }

    const materialFlag = Boolean(is_material);
    const request = await JobAdjustmentRequest.create({
      clarification_log_id: log.id,
      source_message_id,
      tender_id: log.tender_id,
      description,
      justification,
      is_material: materialFlag,
      // Non-material requests skip human sign-off per UC-D7's edge case; material ones
      // stay pending_approval until routed through PATCH /job-adjustment-requests/:id.
      approval_status: materialFlag ? 'pending_approval' : 'approved',
      requested_by: req.user.id
    });

    return res.status(201).json(request.toJSON());
  } catch (error) {
    console.error('Error in createJobAdjustmentRequest:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const listJobAdjustmentRequests = async (req, res) => {
  try {
    const { tender_id, approval_status } = req.query;
    const where = {};
    if (tender_id) where.tender_id = tender_id;
    if (approval_status) where.approval_status = approval_status;
    if (req.query.is_material) where.is_material = req.query.is_material === 'true';

    const requests = await JobAdjustmentRequest.findAll({ where, order: [['created_at', 'DESC']] });
    return res.status(200).json({ data: requests.map((r) => r.toJSON()) });
  } catch (error) {
    console.error('Error in listJobAdjustmentRequests:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const updateJobAdjustmentRequest = async (req, res) => {
  try {
    const request = await JobAdjustmentRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Job adjustment request not found' });
    }
    if (request.approval_status !== 'pending_approval') {
      return res.status(409).json({ status: 'error', message: `Request is already '${request.approval_status}'` });
    }

    const updates = { approval_status: req.body.approval_status };
    if (req.body.approval_status === 'approved') {
      updates.approved_by = req.user.id;
      updates.approved_at = new Date();
    }

    await request.update(updates);
    return res.status(200).json(request.toJSON());
  } catch (error) {
    console.error('Error in updateJobAdjustmentRequest:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const createFollowUpNotification = async (req, res) => {
  try {
    const request = await JobAdjustmentRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Job adjustment request not found' });
    }
    if (request.approval_status !== 'approved') {
      return res.status(409).json({ status: 'error', message: 'Request must be approved before a follow-up notification can be created' });
    }
    if (request.follow_up_clarification_log_id) {
      return res.status(409).json({ status: 'error', message: 'A follow-up notification already exists for this request' });
    }

    const followUpLog = await ClarificationLog.create({
      tender_id: request.tender_id,
      log_type: 'job_adjustment_notification',
      status: 'draft_ready'
    });

    await request.update({ follow_up_clarification_log_id: followUpLog.id });

    return res.status(201).json(followUpLog.toJSON());
  } catch (error) {
    console.error('Error in createFollowUpNotification:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Resend, Escalate & Resolve
// ---------------------------------------------------------------------------

const resendClarification = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }
    if (log.status !== 'sent') {
      return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'sent' to resend` });
    }

    const lastDispatch = await ClarificationMessage.findOne({
      where: { clarification_log_id: log.id, message_type: { [Op.in]: ['sent', 'reminder'] } },
      order: [['created_at', 'DESC']]
    });

    const now = new Date();
    const reminder = await ClarificationMessage.create({
      clarification_log_id: log.id,
      message_type: 'reminder',
      subject: lastDispatch?.subject ?? null,
      body: lastDispatch?.body ?? '',
      ai_generated: false,
      sent_at: now,
      dispatch_channel: lastDispatch?.dispatch_channel ?? 'email',
      source_draft_id: lastDispatch?.source_draft_id ?? null,
      created_by: req.user.id
    });

    // clarification_logs has no sent_at column - follow_up_due_at is the field that
    // actually gets reset from this reminder's dispatch time (see sendClarification).
    await log.update({ follow_up_due_at: addDaysAsDateOnly(now, FOLLOW_UP_WINDOW_DAYS) });

    return res.status(201).json(reminder.toJSON());
  } catch (error) {
    console.error('Error in resendClarification:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const escalateClarification = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }
    if (log.status !== 'sent') {
      return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'sent' to escalate` });
    }

    await log.update({ status: 'escalated', escalated_by: req.user.id, escalated_at: new Date() });
    return res.status(200).json(log.toJSON());
  } catch (error) {
    console.error('Error in escalateClarification:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const resolveClarification = async (req, res) => {
  try {
    const log = await ClarificationLog.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Clarification log not found' });
    }
    if (!['responded', 'escalated'].includes(log.status)) {
      return res.status(409).json({ status: 'error', message: `Log status is '${log.status}' - must be 'responded' or 'escalated' to resolve` });
    }

    await log.update({
      status: 'resolved',
      resolved_by: req.user.id,
      resolved_at: new Date(),
      outcome_notes: req.body.outcome_notes
    });
    return res.status(200).json(log.toJSON());
  } catch (error) {
    console.error('Error in resolveClarification:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = {
  detectDeviation,
  listClarificationLogs,
  getClarificationLog,
  draftMessage,
  editMessage,
  approveMessage,
  sendClarification,
  recordResponse,
  addAttachment,
  createJobAdjustmentRequest,
  listJobAdjustmentRequests,
  updateJobAdjustmentRequest,
  createFollowUpNotification,
  resendClarification,
  escalateClarification,
  resolveClarification
};
