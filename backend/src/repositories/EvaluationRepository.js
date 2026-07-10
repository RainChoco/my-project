const MockEvaluationRepository = require('./MockEvaluationRepository');
// Swap this line when Jerrold's DB implementation is ready:
// const DatabaseEvaluationRepository = require('./DatabaseEvaluationRepository');

module.exports = new MockEvaluationRepository();
