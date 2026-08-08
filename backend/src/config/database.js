const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL || process.env.NODE_ENV === 'production') {
  // Production / Neon PostgreSQL connection
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Neon SSL connections
      }
    },
    logging: false
  });
} else if (process.env.NODE_ENV === 'test') {
  // Unit testing throwaway in-memory database
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false
  });
} else {
  // Local development fallback: SQLite file
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './tender_db.sqlite',
    logging: false
  });
}

module.exports = sequelize;
