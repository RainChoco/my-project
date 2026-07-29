const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5050;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);

// Sync database schema and start server
sequelize.authenticate().then(() => {
  console.log('Database synced');

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Run: taskkill /F /IM node.exe`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });

}).catch(err => {
  console.error('Failed to sync database:', err);
});

module.exports = app;




