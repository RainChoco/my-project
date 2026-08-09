const bcrypt = require('bcrypt');

const DEV_PASSWORD = 'DevPass123!';
const DEMO_USERS = [
    {
        full_name: 'Alice Tan',
        email: 'alice.tan@townms.gov.sg',
        role: 'ma_staff',
    },
    {
        full_name: 'Ben Ong',
        email: 'ben.ong@townms.gov.sg',
        role: 'evaluator',
    },
    {
        full_name: 'Cheryl Lim',
        email: 'cheryl.lim@townms.gov.sg',
        role: 'management',
    },
    {
        full_name: 'Calista Tan',
        email: 'calista@townms.gov.sg',
        role: 'report_preparer',
    },
];

async function seedDemoUsers({ UserModel }) {
    if (!UserModel) {
        throw new Error('UserModel is required');
    }

    const password_hash = await bcrypt.hash(DEV_PASSWORD, 10);

    for (const userData of DEMO_USERS) {
        const existing = await UserModel.findOne({ where: { email: userData.email } });
        if (!existing) {
            await UserModel.create({
                ...userData,
                password_hash,
                avatar_url: null,
            });
        } else if (!existing.password_hash || !(await bcrypt.compare(DEV_PASSWORD, existing.password_hash))) {
            await existing.update({ password_hash });
        }
    }
}

module.exports = { seedDemoUsers, DEV_PASSWORD };
