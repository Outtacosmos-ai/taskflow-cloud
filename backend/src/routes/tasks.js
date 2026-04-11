const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Board = require('../models/Board');
const { sendTaskNotification } = require('../services/sqsService'); // Import SQS

// GET TASKS
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      progress: tasks.filter((t) => t.status === 'progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
    res.json({ tasks, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// CREATE TASK
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      user: req.user.id,
      status: 'pending',
    });

    const task = await newTask.save();

    // 1. Update the Board so the task actually appears in the UI
    await Board.findOneAndUpdate(
      { user: req.user.id, 'columns.key': 'pending' },
      { $push: { 'columns.$.taskOrder': task._id } }
    );

    // 2. Trigger SQS Notification (The logic you had in your controller)
    try {
        await sendTaskNotification(task, 'created');
    } catch (sqsErr) {
        console.error("SQS Failed but task was saved:", sqsErr);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Task creation failed' });
  }
});

module.exports = router;