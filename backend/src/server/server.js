const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('../config/db');
const bankRoutes = require('../routes/bankRoutes');
const authRoutes = require('../routes/authRoutes');
const customerRoutes = require('../routes/customerRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const reportRoutes = require('../routes/reportRoutes');
const { createPerEmployeeRateLimiter } = require('../middlewares/rateLimiter');
const { notFoundHandler, errorHandler } = require('../middlewares/errorHandler');

// Load backend-specific .env to ensure vars are available when started from different cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Fallback: if important vars are still missing, try reading the backend .env directly
const fs = require('fs');
try {
  const envFile = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts.shift().trim();
        const value = parts.join('=').trim();
        if (key && !process.env[key]) process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.error('Failed to parse backend .env fallback:', err && err.message);
}

const app = express();

connectDB();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
// Apply per-employee rate limiting to sensitive routes
app.use('/api/bank', createPerEmployeeRateLimiter({ windowMs: 60 * 1000, max: 120 }), bankRoutes);
app.use('/api/customers', createPerEmployeeRateLimiter({ windowMs: 60 * 1000, max: 120 }), customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error && error.message);
    process.exit(1);
  }
};

startServer();
