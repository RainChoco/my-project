const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);

// Sync db and start server
sequelize.sync().then(() => {
  console.log('Database synced');
  
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log('Server running on port ' + PORT);
    });
  }
}).catch(err => {
  console.error('Failed to sync database:', err);
});

module.exports = app;
