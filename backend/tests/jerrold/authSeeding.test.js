const bcrypt = require('bcrypt');
const { sequelize, User } = require('../../src/models');
const { seedDemoUsers } = require('../../src/utils/seedDemoUsers');

describe('Demo user seeding', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('creates the Alice Tan demo account with the expected password', async () => {
        await seedDemoUsers({ UserModel: User });

        const user = await User.findOne({ where: { email: 'alice.tan@townms.gov.sg' } });

        expect(user).toBeTruthy();
        expect(user.full_name).toBe('Alice Tan');
        expect(user.role).toBe('ma_staff');
        expect(await bcrypt.compare('DevPass123!', user.password_hash)).toBe(true);
    });
});
