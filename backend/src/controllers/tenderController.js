const { Op } = require('sequelize');
const { sequelize, Tender, TenderDocument, EligibilityCheck, BcaGradeLimit, EligibilityThreshold } = require('../models');
const cloudinaryService = require('../services/cloudinaryService');

const LOCKED_FOR_EDIT_STATUSES = ['under_evaluation', 'approved', 'rejected', 'withdrawn'];
const LOCKED_FOR_DELETE_STATUSES = ['under_evaluation', 'approved', 'rejected'];

// ---------------------------------------------------------------------------
// Tender CRUD
// ---------------------------------------------------------------------------

const createTender = async (req, res) => {
  try {
    const { tender_ref_no, vendor_name, submission_date, main_offer_price, alternative_offer_price } = req.body;

    const tender = await Tender.create({
      tender_ref_no,
      vendor_name,
      submission_date,
      main_offer_price,
      alternative_offer_price: alternative_offer_price ?? null,
      created_by: req.user.id
    });

    return res.status(201).json(tender.toJSON());
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ status: 'error', message: 'tender_ref_no already exists' });
    }
    console.error('Error in createTender:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const listTenders = async (req, res) => {
  try {
    const { status, eligibility_status, vendor_name } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const where = {};
    if (status) where.status = status;
    if (eligibility_status) where.eligibility_status = eligibility_status;

    const andConditions = [];
    if (vendor_name) {
      // LOWER()+LIKE instead of Op.iLike so this works on both Postgres and the
      // SQLite in-memory DB used in tests (Op.iLike is Postgres-only).
      andConditions.push(
        sequelize.where(sequelize.fn('LOWER', sequelize.col('vendor_name')), {
          [Op.like]: `%${vendor_name.toLowerCase()}%`
        })
      );
    }

    const { rows, count } = await Tender.findAndCountAll({
      where: andConditions.length ? { [Op.and]: [where, ...andConditions] } : where,
      offset: (page - 1) * limit,
      limit,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      data: rows.map((tender) => tender.toJSON()),
      pagination: { page, limit, total: count }
    });
  } catch (error) {
    console.error('Error in listTenders:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const getTender = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    return res.status(200).json(tender.toJSON());
  } catch (error) {
    console.error('Error in getTender:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const updateTender = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    if (LOCKED_FOR_EDIT_STATUSES.includes(tender.status)) {
      return res.status(409).json({
        status: 'error',
        message: `Tender status is '${tender.status}' - edits are locked past submission. Raise a clarification instead.`
      });
    }

    const editableFields = [
      'tender_ref_no',
      'vendor_name',
      'submission_date',
      'main_offer_price',
      'alternative_offer_price',
      'paid_up_capital',
      'bca_fm01_license_no',
      'bca_fm01_grade',
      'non_debarment_declared'
    ];
    const updates = {};
    for (const field of editableFields) {
      if (field in req.body) updates[field] = req.body[field];
    }

    await tender.update(updates);
    return res.status(200).json(tender.toJSON());
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ status: 'error', message: 'tender_ref_no already exists' });
    }
    console.error('Error in updateTender:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const deleteTender = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    if (LOCKED_FOR_DELETE_STATUSES.includes(tender.status)) {
      return res.status(409).json({
        status: 'error',
        message: `Tender status is '${tender.status}' - must be withdrawn via a status change, not deleted.`
      });
    }

    await tender.destroy(); // cascades to tender_documents / eligibility_checks at the DB level
    return res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTender:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Tender Documents
// ---------------------------------------------------------------------------

const uploadDocument = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file attached' });
    }

    const { file_type } = req.body;
    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: `town-council-tender/${tender.tender_ref_no}`,
        publicId: file_type,
        resourceType: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return res.status(502).json({ status: 'error', message: 'Cloudinary upload failed' });
    }

    const document = await TenderDocument.create({
      tender_id: tender.id,
      file_type,
      original_filename: req.file.originalname,
      cloudinary_public_id: uploadResult.public_id,
      file_url: uploadResult.secure_url,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format ?? null,
      file_size_bytes: req.file.size,
      uploaded_by: req.user.id
    });

    return res.status(201).json(document.toJSON());
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const listDocuments = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }

    const where = { tender_id: tender.id };
    if (req.query.latest_only === 'true') where.is_latest = true;

    const documents = await TenderDocument.findAll({ where, order: [['uploaded_at', 'ASC']] });
    return res.status(200).json({ data: documents.map((d) => d.toJSON()) });
  } catch (error) {
    console.error('Error in listDocuments:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const replaceDocument = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    const previousDocument = await TenderDocument.findOne({
      where: { id: req.params.documentId, tender_id: tender.id }
    });
    if (!previousDocument) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file attached' });
    }

    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: `town-council-tender/${tender.tender_ref_no}`,
        publicId: `${previousDocument.file_type}-v${previousDocument.version + 1}`,
        resourceType: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      // Prior version remains is_latest: true - no partial state written.
      return res.status(502).json({ status: 'error', message: 'Cloudinary upload failed' });
    }

    const newDocument = await sequelize.transaction(async (t) => {
      await previousDocument.update({ is_latest: false }, { transaction: t });
      return TenderDocument.create(
        {
          tender_id: tender.id,
          file_type: previousDocument.file_type,
          original_filename: req.file.originalname,
          cloudinary_public_id: uploadResult.public_id,
          file_url: uploadResult.secure_url,
          resource_type: uploadResult.resource_type,
          format: uploadResult.format ?? null,
          file_size_bytes: req.file.size,
          version: previousDocument.version + 1,
          is_latest: true,
          uploaded_by: req.user.id
        },
        { transaction: t }
      );
    });

    return res.status(201).json(newDocument.toJSON());
  } catch (error) {
    console.error('Error in replaceDocument:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const uploadTenderImage = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file attached' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ status: 'error', message: 'File must be an image' });
    }

    let uploadResult;
    try {
      // Stable public_id (unlike tender_documents' versioned ids) - a tender has exactly
      // one display image, so re-uploading overwrites the same Cloudinary asset instead
      // of accumulating orphaned ones.
      uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: `town-council-tender/${tender.tender_ref_no}`,
        publicId: 'tender-image',
        resourceType: 'image'
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return res.status(502).json({ status: 'error', message: 'Cloudinary upload failed' });
    }

    await tender.update({ image_url: uploadResult.secure_url, image_public_id: uploadResult.public_id });
    return res.status(200).json(tender.toJSON());
  } catch (error) {
    console.error('Error in uploadTenderImage:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

// Recomputes tenders.eligibility_status from its current eligibility_checks:
// 'rejected' if non_debarment fails, else 'flagged' if anything else fails, else 'eligible'.
async function recomputeEligibilityStatus(tenderId) {
  const checks = await EligibilityCheck.findAll({ where: { tender_id: tenderId } });
  const nonDebarmentCheck = checks.find((c) => c.criterion === 'non_debarment');

  let status;
  if (nonDebarmentCheck && !nonDebarmentCheck.passed) {
    status = 'rejected';
  } else if (checks.some((c) => !c.passed)) {
    status = 'flagged';
  } else if (checks.length > 0) {
    status = 'eligible';
  } else {
    status = 'pending';
  }

  await Tender.update({ eligibility_status: status }, { where: { id: tenderId } });
  return status;
}

async function getCurrentBcaGradeLimit(grade) {
  const today = new Date().toISOString().slice(0, 10);
  return BcaGradeLimit.findOne({
    where: { grade, effective_from: { [Op.lte]: today } },
    order: [['effective_from', 'DESC']]
  });
}

// NOTE: this performs only the deterministic comparison half of UC-A6 (step 3 onward).
// The AI extraction half (step 1-2: sending documents to ChatGPT to populate
// paid_up_capital/bca_fm01_license_no/bca_fm01_grade/non_debarment_declared) is not
// wired here - no ChatGPT/OpenAI integration exists in this codebase yet. This assumes
// those fields are already set on the tender row (e.g. via PATCH /api/tenders/:id).
const triggerEligibilityCheck = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }

    const documentCount = await TenderDocument.count({ where: { tender_id: tender.id } });
    if (documentCount === 0) {
      return res.status(409).json({ status: 'error', message: 'Tender has no documents uploaded yet' });
    }

    // Re-runnable: clear any prior checks for this tender before recomputing.
    await EligibilityCheck.destroy({ where: { tender_id: tender.id } });

    const minCapitalThreshold = await EligibilityThreshold.findOne({ where: { criterion_key: 'min_paid_up_capital' } });
    const checksToCreate = [];
    const summaryNotes = [];

    // 1. min_paid_up_capital
    if (tender.paid_up_capital == null || !minCapitalThreshold) {
      checksToCreate.push({
        tender_id: tender.id,
        criterion: 'min_paid_up_capital',
        threshold_value_used: minCapitalThreshold?.threshold_value ?? null,
        actual_value: tender.paid_up_capital,
        passed: false,
        notes: 'paid_up_capital could not be determined.'
      });
      summaryNotes.push('Paid-up capital could not be determined.');
    } else {
      const passed = Number(tender.paid_up_capital) >= Number(minCapitalThreshold.threshold_value);
      checksToCreate.push({
        tender_id: tender.id,
        criterion: 'min_paid_up_capital',
        threshold_value_used: minCapitalThreshold.threshold_value,
        actual_value: tender.paid_up_capital,
        passed,
        notes: passed ? null : `Declared paid-up capital below the minimum requirement of ${minCapitalThreshold.threshold_value}.`
      });
      if (!passed) summaryNotes.push('Paid-up capital is below the minimum requirement.');
    }

    // 2. bca_fm01_license_valid (presence/format check only)
    const licensePassed = Boolean(tender.bca_fm01_license_no);
    checksToCreate.push({
      tender_id: tender.id,
      criterion: 'bca_fm01_license_valid',
      threshold_value_used: null,
      actual_value: null,
      passed: licensePassed,
      notes: licensePassed ? null : 'No BCA FM01 license number could be found.'
    });
    if (!licensePassed) summaryNotes.push('No BCA FM01 license number could be found.');

    // 3. bca_fm01_tender_limit - skipped if grade is unknown (dependent check)
    if (tender.bca_fm01_grade) {
      const gradeLimit = await getCurrentBcaGradeLimit(tender.bca_fm01_grade);
      if (!gradeLimit || gradeLimit.max_tender_value == null) {
        checksToCreate.push({
          tender_id: tender.id,
          criterion: 'bca_fm01_tender_limit',
          threshold_value_used: null,
          actual_value: tender.main_offer_price,
          passed: true,
          notes: `Grade ${tender.bca_fm01_grade} has no tender value ceiling.`
        });
      } else {
        const passed = Number(tender.main_offer_price) <= Number(gradeLimit.max_tender_value);
        checksToCreate.push({
          tender_id: tender.id,
          criterion: 'bca_fm01_tender_limit',
          threshold_value_used: gradeLimit.max_tender_value,
          actual_value: tender.main_offer_price,
          passed,
          notes: passed ? null : `Main offer price exceeds the BCA FM01 Grade ${tender.bca_fm01_grade} tender value ceiling.`
        });
        if (!passed) summaryNotes.push(`Main offer price exceeds the Grade ${tender.bca_fm01_grade} tender value ceiling.`);
      }
    }

    // 4. non_debarment - self-declared for now; overridable via manual review (UC-A7)
    checksToCreate.push({
      tender_id: tender.id,
      criterion: 'non_debarment',
      threshold_value_used: null,
      actual_value: null,
      passed: Boolean(tender.non_debarment_declared),
      notes: tender.non_debarment_declared ? null : 'Non-debarment not declared - requires manual verification.'
    });
    if (!tender.non_debarment_declared) summaryNotes.push('Non-debarment declaration missing or negative.');

    await EligibilityCheck.bulkCreate(checksToCreate);
    const eligibilityStatus = await recomputeEligibilityStatus(tender.id);

    const aiEligibilitySummary = summaryNotes.length ? summaryNotes.join(' ') : 'All eligibility criteria met.';
    await tender.update({ ai_eligibility_summary: aiEligibilitySummary });

    return res.status(200).json({
      tender_id: tender.id,
      eligibility_status: eligibilityStatus,
      ai_eligibility_summary: aiEligibilitySummary,
      checks_created: checksToCreate.length
    });
  } catch (error) {
    console.error('Error in triggerEligibilityCheck:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const listEligibilityChecks = async (req, res) => {
  try {
    const tender = await Tender.findByPk(req.params.id);
    if (!tender) {
      return res.status(404).json({ status: 'error', message: 'Tender not found' });
    }
    const checks = await EligibilityCheck.findAll({ where: { tender_id: tender.id }, order: [['id', 'ASC']] });
    return res.status(200).json({ data: checks.map((c) => c.toJSON()) });
  } catch (error) {
    console.error('Error in listEligibilityChecks:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const overrideEligibilityCheck = async (req, res) => {
  try {
    const check = await EligibilityCheck.findByPk(req.params.id);
    if (!check) {
      return res.status(404).json({ status: 'error', message: 'Eligibility check not found' });
    }

    await check.update({
      passed: req.body.passed,
      notes: req.body.notes,
      source: 'manual_override',
      checked_by: req.user.id,
      checked_at: new Date()
    });

    await recomputeEligibilityStatus(check.tender_id);
    return res.status(200).json(check.toJSON());
  } catch (error) {
    console.error('Error in overrideEligibilityCheck:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ---------------------------------------------------------------------------
// Eligibility Reference Data
// ---------------------------------------------------------------------------

const listBcaGradeLimits = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const allLimits = await BcaGradeLimit.findAll({
      where: { effective_from: { [Op.lte]: today } },
      order: [['effective_from', 'DESC']]
    });

    // Keep only the most recent row per grade (first one seen, since sorted DESC).
    const currentByGrade = new Map();
    for (const limit of allLimits) {
      if (!currentByGrade.has(limit.grade)) currentByGrade.set(limit.grade, limit);
    }

    return res.status(200).json({
      data: Array.from(currentByGrade.values()).map((l) => ({ grade: l.grade, max_tender_value: l.max_tender_value }))
    });
  } catch (error) {
    console.error('Error in listBcaGradeLimits:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const updateBcaGradeLimit = async (req, res) => {
  try {
    const { grade } = req.params;
    const { max_tender_value, effective_from } = req.body;

    // Historical, append-only: (grade, effective_from) is unique, so this upserts
    // by that composite key rather than overwriting the grade's only row.
    const [limit] = await BcaGradeLimit.upsert(
      { grade, max_tender_value: max_tender_value ?? null, effective_from },
      { conflictFields: ['grade', 'effective_from'], returning: true }
    );

    return res.status(200).json(limit.toJSON());
  } catch (error) {
    console.error('Error in updateBcaGradeLimit:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const listEligibilityThresholds = async (req, res) => {
  try {
    const thresholds = await EligibilityThreshold.findAll({ order: [['criterion_key', 'ASC']] });
    return res.status(200).json({ data: thresholds.map((t) => t.toJSON()) });
  } catch (error) {
    console.error('Error in listEligibilityThresholds:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const updateEligibilityThreshold = async (req, res) => {
  try {
    const threshold = await EligibilityThreshold.findOne({ where: { criterion_key: req.params.criterionKey } });
    if (!threshold) {
      return res.status(404).json({ status: 'error', message: 'No threshold with that criterion_key' });
    }

    await threshold.update({ threshold_value: req.body.threshold_value, updated_by: req.user.id });
    return res.status(200).json(threshold.toJSON());
  } catch (error) {
    console.error('Error in updateEligibilityThreshold:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = {
  createTender,
  listTenders,
  getTender,
  updateTender,
  deleteTender,
  uploadDocument,
  listDocuments,
  replaceDocument,
  uploadTenderImage,
  triggerEligibilityCheck,
  listEligibilityChecks,
  overrideEligibilityCheck,
  listBcaGradeLimits,
  updateBcaGradeLimit,
  listEligibilityThresholds,
  updateEligibilityThreshold
};
