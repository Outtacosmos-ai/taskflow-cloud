const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// Get all tasks for user
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ tasks });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Create task
router.post('/', auth, async (req, res) => {
    try {
        const newTask = new Task({ ...req.body, user: req.user.id });
        const task = await newTask.save();
        res.json(task);
    } catch (err) { res.status(500).send('Creation Error'); }
});

// Update task status (The "Agile" move)
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: { status: req.body.status } },
            { new: true }
        );
        res.json(task);
    } catch (err) { res.status(500).send('Update Error'); }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
    try {
        await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ msg: 'Task removed' });
    } catch (err) { res.status(500).send('Delete Error'); }
});

module.exports = router;
