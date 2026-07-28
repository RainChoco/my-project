const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

// Switch to SQLite for local development so it runs instantly without requiring Postgres configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : './tender_db.sqlite',
  logging: false
});

module.exports = sequelize;
