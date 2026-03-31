const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const taskRouter = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/tasks', taskRouter);

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
