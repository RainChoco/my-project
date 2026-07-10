const MockTenderRepository = require('./MockTenderRepository');
// Swap this line when Zheng Hong's DB implementation is ready:
// const DatabaseTenderRepository = require('./DatabaseTenderRepository');

module.exports = new MockTenderRepository();
