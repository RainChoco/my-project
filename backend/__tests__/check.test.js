const request = require('supertest');
const app = require('../src/index'); // your express app
const { sequelize, Tender, Contract } = require('../src/models');
const { generateToken } = require('../src/utils/jwtHelper');

describe('Debug getTenders', () => {
  let token;
  let contractId;

  beforeAll(async () => {
    await sequelize.sync();
    // Create a user and token
    token = generateToken({ id: 1, role: 'vendor' });

    // Find any existing contract
    const contract = await Contract.findOne();
    if (contract) {
      contractId = contract.id;
      // create a mock tender
      await Tender.create({
        contractId,
        tender_ref_no: 'TEST-999',
        vendor_name: 'Test Vendor',
        submission_date: '2026-01-01',
        main_offer_price: 1000,
        created_by: 1
      }).catch(e => console.log('Tender creation failed or already exists'));
    }
  });

  it('should fetch tenders without 500 error', async () => {
    if (!contractId) return;
    const res = await request(app)
      .get(`/api/v1/contracts/${contractId}/tenders`)
      .set('Authorization', `Bearer ${token}`);
    
    console.log('STATUS:', res.status);
    console.log('BODY:', JSON.stringify(res.body, null, 2));
    expect(res.status).toBe(200);
  });
});
