const { sequelize, User, Contract, Tender } = require('../src/models');
const { seedDemoUsers } = require('../src/utils/seedDemoUsers');
const { seedDemoData } = require('../src/utils/seedDemoData');

describe('Demo data seeding', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('seeds demo users, contracts, and tenders', async () => {
        await seedDemoUsers({ UserModel: User });
        await seedDemoData({ ContractModel: Contract, TenderModel: Tender });

        const [userCount, contractCount, tenderCount] = await Promise.all([
            User.count(),
            Contract.count(),
            Tender.count(),
        ]);

        expect(userCount).toBeGreaterThanOrEqual(3);
        expect(contractCount).toBeGreaterThanOrEqual(2);
        expect(tenderCount).toBeGreaterThanOrEqual(13);

        const alice = await User.findOne({ where: { email: 'alice.tan@townms.gov.sg' } });
        expect(alice).toBeTruthy();

        const contract = await Contract.findByPk('CTR-PRPGTC-RR-22-001');
        expect(contract).toBeTruthy();
        expect(contract.name).toContain('Pasir Ris East');

        const tender = await Tender.findOne({ where: { tender_ref_no: 'TC-2026-001' } });
        expect(tender).toBeTruthy();
        expect(tender.vendor_name).toBe('BrightBuild Pte Ltd');
    });
});
