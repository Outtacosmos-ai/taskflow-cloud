require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

// Force explicit MongoDB connection logging
if (!process.env.MONGODB_URI) {
  logger.error('CRITICAL: MONGODB_URI is not defined in environment variables!');
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MONGODB CONNECTED SUCCESSFULLY'))
  .catch(err => logger.error('MONGODB CONNECTION ATTEMPT FAILED:', err.message));

mongoose.connection.on('error', err => {
  logger.error('!!! MONGODB RUNTIME ERROR:', err);
});

app.listen(PORT, () => {
  logger.info(`REAL-TIME CHECK v1.4: Server active on port ${PORT}`);
  logger.info(`VITE_URL_ALLOWED: http://ad8f2626aa11c4c4ea728e7becf19d6d-1806174027.us-east-1.elb.amazonaws.com`);
});