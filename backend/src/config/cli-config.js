require('dotenv').config();
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './tender_db.sqlite'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  }
};
