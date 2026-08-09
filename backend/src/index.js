require('dotenv').config();
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize, User, Contract, Tender } = require('./models');
const { seedDemoUsers } = require('./utils/seedDemoUsers');
const { seedDemoData } = require('./utils/seedDemoData');

const app = express();
const PORT = process.env.PORT || 5000;

// Local dev origins always allowed; FRONTEND_URL adds the deployed Vercel origin(s)
// in production (comma-separated if there's more than one, e.g. a prod + preview URL).
const localOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const exactOrigins = [...localOrigins, ...configuredOrigins];

// Vercel gives every preview deployment its own randomly-hashed URL
// (my-project-<hash>-<team>.vercel.app), so FRONTEND_URL's exact-match list can
// only ever cover the production URL - every preview would otherwise fail CORS.
// Match any Vercel URL for this project by prefix instead of requiring it to be
// pre-registered exactly.
const VERCEL_PREVIEW_PATTERN = /^https:\/\/my-project-[a-z0-9-]+\.vercel\.app$/i;

const corsOptions = {
  origin: (origin, callback) => {
    // No Origin header (e.g. curl, server-to-server) - allow, matching cors'
    // own default behaviour for non-browser requests.
    if (!origin || exactOrigins.includes(origin) || VERCEL_PREVIEW_PATTERN.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
sequelize.sync().then(async () => {
  try {
    await seedDemoUsers({ UserModel: User });
    console.log('Demo users seeded');
  } catch (seedError) {
    console.error('Failed to seed demo users:', seedError.message);
  }

  try {
    await seedDemoData({ ContractModel: Contract, TenderModel: Tender });
    console.log('Demo contracts and tenders seeded');
  } catch (seedError) {
    console.error('Failed to seed demo contracts or tenders:', seedError.message);
  }

  console.log('Database synced');

  if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, '0.0.0.0', () => {
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
  }
}).catch(err => {
  console.error('Failed to sync database:', err);
});

module.exports = app;
