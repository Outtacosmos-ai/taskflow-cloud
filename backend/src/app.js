const express = require('express');
const logger = require('./config/logger');
const authRouter = require('./routes/auth');
const boardRouter = require('./routes/boards');
const taskRouter = require('./routes/tasks');
const healthRouter = require('./routes/health');

const app = express();

// NUCLEAR CORS: Manual header injection to ensure they survive a crash
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log every request to terminal
  logger.info(`${req.method} ${req.url} - Origin: ${origin}`);

  // Reflect the origin back to the browser
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle Preflight (OPTIONS) immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/boards', boardRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/health', healthRouter);

// NUCLEAR ERROR HANDLER: This is what captures the drag-and-drop crash
app.use((err, req, res, next) => {
  logger.error('!!! CRASH DETECTED !!!');
  logger.error('METHOD:', req.method, 'URL:', req.url);
  logger.error('MESSAGE:', err.message);
  logger.error('STACK:', err.stack);
  
  // Ensure CORS headers are present even on the error response
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  
  res.status(500).json({
    message: "Server internal error",
    error: err.message
  });
});

module.exports = app;