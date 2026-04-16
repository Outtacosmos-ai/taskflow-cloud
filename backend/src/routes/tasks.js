const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Board = require('../models/Board');
const { sendTaskNotification } = require('../services/sqsService'); 
const logger = require('../config/logger'); // Using your project's logger

// @route   GET /api/tasks
// @desc    Get all user tasks and stats
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
    logger.error('Failed to fetch tasks:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task and add to Board 'pending' column
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

    // Sync with Board: Push the new task ID to the 'pending' column taskOrder
    await Board.findOneAndUpdate(
      { user: req.user.id, 'columns.key': 'pending' },
      { $push: { 'columns.$.taskOrder': task._id } }
    );

    // Trigger SQS Notification
    try {
        await sendTaskNotification(task, 'created');
    } catch (sqsErr) {
        logger.error("SQS Notification Failed (Task Created):", sqsErr.message);
    }

    res.status(201).json(task);
  } catch (err) {
    logger.error('Task creation failed:', err.message);
    res.status(500).json({ error: 'Task creation failed' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task and remove ID from Board columns
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found in Database' });
    }

    // Security: Check user ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'User not authorized to delete this task' });
    }

    // 1. CLEANUP BOARD: Remove task ID from ANY column it might be in
    // This is vital to prevent Frontend rendering errors
    await Board.updateOne(
      { user: req.user.id },
      { $pull: { 'columns.$[].taskOrder': task._id } }
    );

    // 2. DELETE FROM DB
    const taskTitle = task.title; // Save title for notification
    await task.deleteOne();

    // 3. TRIGGER SQS NOTIFICATION
    try {
      await sendTaskNotification({ _id: req.params.id, title: taskTitle }, 'deleted');
    } catch (sqsErr) {
      logger.error("SQS Notification Failed (Task Deleted):", sqsErr.message);
    }

    res.json({ message: 'Task removed and board synced successfully' });
  } catch (err) {
    logger.error('Server error during deletion:', err.message);
    res.status(500).json({ error: 'Server error during task deletion' });
  }
});

module.exports = router;