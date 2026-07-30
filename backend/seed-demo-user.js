/**
 * seed-demo-user.js
 * Run once: node seed-demo-user.js
 * Creates admin@demo.com / password123 if it doesn't already exist.
 */
const bcrypt  = require('bcryptjs');
const { User, sequelize } = require('./src/models');

(async () => {
  try {
    await sequelize.sync();

    const existing = await User.findOne({ where: { email: 'admin@demo.com' } });
    if (existing) {
      console.log('✓ Demo user already exists — email: admin@demo.com');
      return;
    }

    const password_hash = await bcrypt.hash('password123', 10);
    await User.create({
      full_name:     'Demo Admin',
      email:         'admin@demo.com',
      password_hash,
      role:          'Admin',
    });

    console.log('✓ Demo user created:');
    console.log('  Email:    admin@demo.com');
    console.log('  Password: password123');
    console.log('  Role:     Admin');
  } catch (err) {
    console.error('✗ Failed to seed demo user:', err.message);
  } finally {
    await sequelize.close();
  }
})();
