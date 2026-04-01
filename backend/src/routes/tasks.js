const express = require('express');
const router = express.Router();
// const auth = require('../middleware/auth'); // Commented out
const Task = require('../models/Task');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({ region: process.env.AWS_REGION });

// We need a dummy user ID to satisfy MongoDB and a dummy email for SQS
const DUMMY_USER_ID = "60d0fe4f5311236168a109ca"; 
const DUMMY_EMAIL = "mohamed@example.com";

router.get('/', async (req, res) => {
    try {
        // Use the hardcoded ID instead of req.user.id
        const tasks = await Task.find({ user: DUMMY_USER_ID }).sort({ createdAt: -1 });
        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            completed: tasks.filter(t => t.status === 'completed').length
        };
        res.json({ tasks, stats });
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/', async (req, res) => {
    try {
        // Use hardcoded data here too
        const newTask = new Task({ ...req.body, user: DUMMY_USER_ID });
        const task = await newTask.save();
        
        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify({ 
                taskId: task._id, 
                email: DUMMY_EMAIL, 
                action: 'CREATED' 
            }),
        }));
        res.json(task);
    } catch (err) { res.status(500).send('Processing Error'); }
});

module.exports = router;