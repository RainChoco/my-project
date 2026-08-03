const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

// Use SQLite for local development so it runs instantly without requiring
// Postgres configuration. Set DB_DIALECT=postgres (with the DB_* vars below)
// to connect to a real Postgres/Neon instance instead.
const useSqlite = (process.env.DB_DIALECT || 'sqlite') === 'sqlite';

const sequelize = isTest
  ? new Sequelize('sqlite::memory:', { logging: false })
  : useSqlite
    ? new Sequelize({
        dialect: 'sqlite',
        storage: './tender_db.sqlite',
        logging: false
      })
    : new Sequelize(
        process.env.DB_NAME || 'tender_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
          host: process.env.DB_HOST || 'localhost',
          dialect: 'postgres',
          logging: false
        }
      );

module.exports = sequelize;
