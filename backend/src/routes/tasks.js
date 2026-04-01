const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Board = require('../models/Board');

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

    await Board.findOneAndUpdate(
      { user: req.user.id, 'columns.key': 'pending' },
      { $push: { 'columns.$.taskOrder': task._id } }
    );
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Task creation failed' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await Board.findOneAndUpdate(
      { user: req.user.id, 'columns.key': task.status },
      { $pull: { 'columns.$.taskOrder': task._id } }
    );
    await Task.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;