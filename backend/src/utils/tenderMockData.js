// TEMPORARY STUB - mirrors backend/src/seeders/2026010100000{1-6}-*.js exactly.
// Import this directly into route handlers/controllers while Sequelize models
// and the real database connection are still being wired up. Delete once the
// real queries (via models/) are in place - do not let this drift from the
// seeders as the schema evolves.

const users = [
  { id: 1, full_name: 'Zheng Hong', email: 'zheng.hong@townms.gov.sg', role: 'ma_staff', avatar_url: null },
  { id: 2, full_name: 'Jerrold', email: 'jerrold@townms.gov.sg', role: 'evaluator', avatar_url: null },
  { id: 3, full_name: 'Kai Xuan', email: 'kai.xuan@townms.gov.sg', role: 'management', avatar_url: null },
];

const bcaGradeLimits = [
  { id: 1, grade: 'L1', max_tender_value: 1500000.00, effective_from: '2024-01-01' },
  { id: 2, grade: 'L2', max_tender_value: 6000000.00, effective_from: '2024-01-01' },
  { id: 3, grade: 'L3', max_tender_value: 16000000.00, effective_from: '2024-01-01' },
  { id: 4, grade: 'L4', max_tender_value: 40000000.00, effective_from: '2024-01-01' },
  { id: 5, grade: 'L5', max_tender_value: 85000000.00, effective_from: '2024-01-01' },
  { id: 6, grade: 'L6', max_tender_value: null, effective_from: '2024-01-01' },
];

const eligibilityThresholds = [
  {
    id: 1,
    criterion_key: 'min_paid_up_capital',
    threshold_value: 2000000.00,
    description: 'Minimum paid-up capital required for tender eligibility (project-requirements.md).',
    updated_by: 3,
  },
];

const tenders = [
  {
    id: 1,
    tender_ref_no: 'TC-2026-001',
    vendor_name: 'BrightBuild Pte Ltd',
    submission_date: '2026-05-10',
    main_offer_price: 45000000.00,
    alternative_offer_price: 43500000.00,
    paid_up_capital: 5000000.00,
    bca_fm01_license_no: 'BCA-FM01-00123',
    bca_fm01_grade: 'L5',
    non_debarment_declared: true,
    eligibility_status: 'eligible',
    ai_eligibility_summary: 'All eligibility criteria met: capital, licensing, tender-value ceiling, and non-debarment declaration all pass.',
    status: 'approved',
    created_by: 1,
  },
  {
    id: 2,
    tender_ref_no: 'TC-2026-002',
    vendor_name: 'QuickFix Engineering Pte Ltd',
    submission_date: '2026-05-12',
    main_offer_price: 7200000.00,
    alternative_offer_price: null,
    paid_up_capital: 1200000.00,
    bca_fm01_license_no: 'BCA-FM01-00456',
    bca_fm01_grade: 'L2',
    non_debarment_declared: true,
    eligibility_status: 'flagged',
    ai_eligibility_summary: 'Declared paid-up capital is below the S$2M minimum, and the main offer price exceeds the BCA FM01 Grade L2 tender value ceiling.',
    status: 'under_evaluation',
    created_by: 1,
  },
  {
    id: 3,
    tender_ref_no: 'TC-2026-003',
    vendor_name: 'ShadyCorp Pte Ltd',
    submission_date: '2026-05-14',
    main_offer_price: 3000000.00,
    alternative_offer_price: null,
    paid_up_capital: 2500000.00,
    bca_fm01_license_no: 'BCA-FM01-00789',
    bca_fm01_grade: 'L3',
    non_debarment_declared: false,
    eligibility_status: 'rejected',
    ai_eligibility_summary: 'Capital and licensing checks pass, but the vendor was manually confirmed against the debarment list and found ineligible.',
    status: 'rejected',
    created_by: 1,
  },
  {
    id: 4,
    tender_ref_no: 'TC-2026-004',
    vendor_name: 'GreenScape Facilities Pte Ltd',
    submission_date: '2026-05-30',
    main_offer_price: 12000000.00,
    alternative_offer_price: null,
    paid_up_capital: null,
    bca_fm01_license_no: null,
    bca_fm01_grade: null,
    non_debarment_declared: false,
    eligibility_status: 'pending',
    ai_eligibility_summary: null,
    status: 'draft',
    created_by: 1,
  },
  {
    id: 5,
    tender_ref_no: 'TC-2026-005',
    vendor_name: 'MegaWorks Holdings Pte Ltd',
    submission_date: '2026-06-01',
    main_offer_price: 92000000.00,
    alternative_offer_price: 88000000.00,
    paid_up_capital: 20000000.00,
    bca_fm01_license_no: 'BCA-FM01-00999',
    bca_fm01_grade: 'L6',
    non_debarment_declared: true,
    eligibility_status: 'eligible',
    ai_eligibility_summary: 'All eligibility criteria met. Note: a S$4M gap between main and alternative offer was detected for the clarification workflow.',
    status: 'submitted',
    created_by: 1,
  },
  {
    id: 6,
    tender_ref_no: 'TC-2026-006',
    vendor_name: 'Uncertain Builders LLP',
    submission_date: '2026-06-02',
    main_offer_price: 5000000.00,
    alternative_offer_price: null,
    paid_up_capital: 3000000.00,
    bca_fm01_license_no: null,
    bca_fm01_grade: null,
    non_debarment_declared: true,
    eligibility_status: 'flagged',
    ai_eligibility_summary: 'No BCA FM01 license number could be found in the submitted documents.',
    status: 'submitted',
    created_by: 1,
  },
];

const tenderDocuments = [
  { id: 1, tender_id: 1, file_type: 'main_offer', original_filename: 'brightbuild-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-001/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-001/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 2458112, version: 1, is_latest: true, uploaded_by: 1 },
  { id: 2, tender_id: 1, file_type: 'license', original_filename: 'brightbuild-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-001/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-001/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 512340, version: 1, is_latest: true, uploaded_by: 1 },
  { id: 3, tender_id: 1, file_type: 'other', original_filename: 'brightbuild-non-debarment-declaration.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-001/non-debarment', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-001/non-debarment.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 98214, version: 1, is_latest: true, uploaded_by: 1 },

  { id: 4, tender_id: 2, file_type: 'main_offer', original_filename: 'quickfix-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-002/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-002/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 1874421, version: 1, is_latest: true, uploaded_by: 1 },
  { id: 5, tender_id: 2, file_type: 'license', original_filename: 'quickfix-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-002/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-002/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 433221, version: 1, is_latest: true, uploaded_by: 1 },

  { id: 6, tender_id: 3, file_type: 'main_offer', original_filename: 'shadycorp-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-003/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-003/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 1204552, version: 1, is_latest: true, uploaded_by: 1 },
  { id: 7, tender_id: 3, file_type: 'license', original_filename: 'shadycorp-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-003/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-003/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 389012, version: 1, is_latest: true, uploaded_by: 1 },

  { id: 8, tender_id: 4, file_type: 'main_offer', original_filename: 'greenscape-main-offer-draft.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-004/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-004/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 998211, version: 1, is_latest: true, uploaded_by: 1 },

  { id: 9, tender_id: 5, file_type: 'main_offer', original_filename: 'megaworks-main-offer-v1.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/main-offer-v1', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/main-offer-v1.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 3021044, version: 1, is_latest: false, uploaded_by: 1 },
  { id: 10, tender_id: 5, file_type: 'main_offer', original_filename: 'megaworks-main-offer-v2-corrected.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/main-offer-v2', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/main-offer-v2.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 3054981, version: 2, is_latest: true, uploaded_by: 1 },
  { id: 11, tender_id: 5, file_type: 'alternative_offer', original_filename: 'megaworks-alternative-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/alternative-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/alternative-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 2887123, version: 1, is_latest: true, uploaded_by: 1 },
  { id: 12, tender_id: 5, file_type: 'license', original_filename: 'megaworks-bca-fm01-license.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-005/license', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-005/license.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 601234, version: 1, is_latest: true, uploaded_by: 1 },

  { id: 13, tender_id: 6, file_type: 'main_offer', original_filename: 'uncertain-builders-main-offer.pdf', cloudinary_public_id: 'town-council-tender/tc-2026-006/main-offer', file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/town-council-tender/tc-2026-006/main-offer.pdf', resource_type: 'raw', format: 'pdf', file_size_bytes: 1543098, version: 1, is_latest: true, uploaded_by: 1 },
];

const eligibilityChecks = [
  { id: 1, tender_id: 1, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 5000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 2, tender_id: 1, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 3, tender_id: 1, criterion: 'bca_fm01_tender_limit', threshold_value_used: 85000000.00, actual_value: 45000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 4, tender_id: 1, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },

  { id: 5, tender_id: 2, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 1200000.00, passed: false, source: 'ai_extracted', notes: 'Declared paid-up capital below the S$2M minimum requirement.', checked_by: null },
  { id: 6, tender_id: 2, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 7, tender_id: 2, criterion: 'bca_fm01_tender_limit', threshold_value_used: 6000000.00, actual_value: 7200000.00, passed: false, source: 'ai_extracted', notes: 'Main offer price exceeds BCA FM01 Grade L2 tender value ceiling.', checked_by: null },
  { id: 8, tender_id: 2, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },

  { id: 9, tender_id: 3, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 2500000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 10, tender_id: 3, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 11, tender_id: 3, criterion: 'bca_fm01_tender_limit', threshold_value_used: 16000000.00, actual_value: 3000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 12, tender_id: 3, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: false, source: 'manual_override', notes: 'Vendor found on debarment list during manual verification.', checked_by: 2 },

  { id: 13, tender_id: 5, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 20000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 14, tender_id: 5, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 15, tender_id: 5, criterion: 'bca_fm01_tender_limit', threshold_value_used: null, actual_value: 92000000.00, passed: true, source: 'ai_extracted', notes: 'Grade L6 has no tender value ceiling.', checked_by: null },
  { id: 16, tender_id: 5, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },

  { id: 17, tender_id: 6, criterion: 'min_paid_up_capital', threshold_value_used: 2000000.00, actual_value: 3000000.00, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
  { id: 18, tender_id: 6, criterion: 'bca_fm01_license_valid', threshold_value_used: null, actual_value: null, passed: false, source: 'ai_extracted', notes: 'No BCA FM01 license number found in submitted documents.', checked_by: null },
  { id: 19, tender_id: 6, criterion: 'non_debarment', threshold_value_used: null, actual_value: null, passed: true, source: 'ai_extracted', notes: null, checked_by: null },
];

module.exports = {
  users,
  bcaGradeLimits,
  eligibilityThresholds,
  tenders,
  tenderDocuments,
  eligibilityChecks,
};
