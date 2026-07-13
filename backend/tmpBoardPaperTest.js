const { BoardPaper, sequelize } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const boardPaper = await BoardPaper.create({
      tenderId: 1,
      title: 'Test Board Paper',
      purpose: 'Recommendation',
      preparedBy: 'Calista'
    });
    console.log('Created:', boardPaper.toJSON());
  } catch (error) {
    console.error('CREATE ERROR', error);
  } finally {
    await sequelize.close();
  }
})();
