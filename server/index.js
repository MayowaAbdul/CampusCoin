const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('./database');
const seedData = require('./seed');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const transactionsRoutes = require('./routes/transactions');
const budgetsRoutes = require('./routes/budgets');
const insightsRoutes = require('./routes/insights');
const tipsRoutes = require('./routes/tips');
const aiRoutes = require('./routes/ai');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// Healthcheck / API status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Campus Coin API', timestamp: new Date() });
});

// Serve frontend static files in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    next();
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    await seedData();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  Campus Coin Backend Server Running on Port ${PORT}`);
      console.log(`  API Base URL: http://localhost:${PORT}/api`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
