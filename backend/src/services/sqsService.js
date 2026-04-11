const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

// Initialize the SQS Client
// It automatically uses the IAM Role attached to the EKS Pod (taskflow-sa)
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });

async function sendTaskNotification(task, action) {
  try {
    const command = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: `task_${action}`, // e.g., 'task_created', 'task_updated'
        taskId: task._id,
        title: task.title,
        priority: task.priority,
        timestamp: new Date().toISOString()
      })
    });

    const response = await sqsClient.send(command);
    console.log(`[SQS] Message sent successfully. MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error("[SQS Error] Failed to send message:", error);
    // We don't throw the error because we don't want to fail the API request 
    // just because the notification failed.
  }
}

module.exports = { sendTaskNotification };