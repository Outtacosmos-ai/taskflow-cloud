const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const boardRouter = require('./routes/boards');
const taskRouter = require('./routes/tasks');
const healthRouter = require('./routes/health');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/boards', boardRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/health', healthRouter);

module.exports = app;
