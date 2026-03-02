require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const logger = require('./logger');

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

let running = true;

// Graceful shutdown: allow in-flight message processing to complete
function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully…`);
  running = false;
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

async function processMessage(message) {
  let body;
  try {
    body = JSON.parse(message.Body);
  } catch {
    logger.error('Invalid JSON in message body', { messageId: message.MessageId });
    return;
  }
  logger.info('Processing message', { messageId: message.MessageId, type: body.type });
  // TODO: dispatch to handler based on body.type (e.g. send email via Nodemailer)
}

async function poll() {
  while (running) {
    const { Messages = [] } = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: Number(process.env.SQS_MAX_MESSAGES) || 10,
        WaitTimeSeconds: Number(process.env.SQS_WAIT_TIME_SECONDS) || 20,
        VisibilityTimeout: Number(process.env.SQS_VISIBILITY_TIMEOUT) || 30,
      }),
    );

    for (const msg of Messages) {
      try {
        await processMessage(msg);
        await sqs.send(
          new DeleteMessageCommand({ QueueUrl: QUEUE_URL, ReceiptHandle: msg.ReceiptHandle }),
        );
      } catch (err) {
        logger.error('Failed to process message', { messageId: msg.MessageId, error: err.message });
      }
    }
  }
  logger.info('Worker stopped.');
}

logger.info('Worker starting…');
poll().catch((err) => {
  logger.error('Worker crashed', { error: err.message });
  process.exit(1);
});
