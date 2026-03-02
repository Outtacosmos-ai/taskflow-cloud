const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(err.status || 500).json({ error: message });
});

module.exports = app;
