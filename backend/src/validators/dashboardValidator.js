const yup = require('yup');

const getRankingsSchema = yup.object({
  query: yup.object({
    status: yup.string().optional(),
    category: yup.string().optional(),
    dateFrom: yup.date().optional(),
    dateTo: yup.date().optional(),
    page: yup.number().integer().min(1).default(1),
    pageSize: yup.number().integer().min(1).max(100).default(10), // SECURITY: Limit to max 100
    sortBy: yup.string().oneOf(['pqmScore', 'vendorName', 'rank']).default('pqmScore'), // SECURITY: Whitelist sort fields
    sortOrder: yup.string().oneOf(['asc', 'desc']).default('desc')
  })
});

const archiveSchema = yup.object({
  body: yup.object({
    tenderReferenceId: yup.string().required('Tender Reference ID is required'),
    archiveReason: yup.string().max(255).optional()
  })
});

module.exports = {
  getRankingsSchema,
  archiveSchema
};
