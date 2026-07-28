const yup = require('yup');

const getRankingsSchema = yup.object({
  query: yup.object({
    status: yup.string().optional(),
    category: yup.string().optional(),
    dateFrom: yup.date().optional(),
    dateTo: yup.date().optional(),
    contractId: yup.string().optional(),
    page: yup.number().integer().min(1).default(1),
    pageSize: yup.number().integer().min(1).max(100).default(10),
    sortBy: yup.string().oneOf(['pqmScore', 'priceScore', 'qualityScore', 'supplierName', 'rank']).default('pqmScore'),
    sortOrder: yup.string().oneOf(['asc', 'desc']).default('desc')
  })
});

describe('Yup test', () => {
  it('validates empty string', async () => {
    try {
      await getRankingsSchema.validate({
        query: {
          contractId: '123',
          status: '',
          category: '',
          dateFrom: '',
          dateTo: '',
          page: 1,
          pageSize: 10,
          sortBy: 'pqmScore',
          sortOrder: 'desc'
        }
      });
      console.log('Validation passed!');
    } catch (e) {
      console.log('Validation failed:', e.message);
    }
  });
});
