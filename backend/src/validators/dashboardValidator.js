const yup = require('yup');

const getKPIsSchema = yup.object({
  query: yup.object({
    status: yup.string().optional(),
    category: yup.string().optional(),
    dateFrom: yup.date().transform((curr, orig) => orig === '' ? undefined : curr).optional(),
    dateTo: yup.date().transform((curr, orig) => orig === '' ? undefined : curr).optional(),
    contractId: yup.string().optional()   // Added: filter by Contract Opportunity
  })
});

const getRankingsSchema = yup.object({
  query: yup.object({
    status: yup.string().optional(),
    category: yup.string().optional(),
    dateFrom: yup.date().transform((curr, orig) => orig === '' ? undefined : curr).optional(),
    dateTo: yup.date().transform((curr, orig) => orig === '' ? undefined : curr).optional(),
    contractId: yup.string().optional(),  // Added: filter by Contract Opportunity
    page: yup.number().integer().min(1).default(1),
    pageSize: yup.number().integer().min(1).max(100).default(10), // SECURITY: Limit to max 100
    sortBy: yup.string().oneOf(['pqmScore', 'priceScore', 'qualityScore', 'supplierName', 'rank']).default('pqmScore'), // SECURITY: Whitelist sort fields
    sortOrder: yup.string().oneOf(['asc', 'desc']).default('desc')
  })
});

const archiveSchema = yup.object({
  body: yup.object({
    contractId: yup.string().optional(),           // New: preferred field
    tenderReferenceId: yup.string().optional(),    // Legacy: backward compat
    archiveReason: yup.string().max(255).optional()
  }).test('has-reference-id', 'contractId or tenderReferenceId is required', (val) => {
    return !!(val.contractId || val.tenderReferenceId);
  })
});

module.exports = {
  getKPIsSchema,
  getRankingsSchema,
  archiveSchema
};
