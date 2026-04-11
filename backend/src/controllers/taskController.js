const Task = require('../models/Task');
const { sendTaskNotification } = require('../services/sqsService');

// This fetches the tasks for your board
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({}); // Fetch everything from MongoDB
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();

    // TRIGGER THE SQS PRODUCER HERE
    await sendTaskNotification(savedTask, 'created');

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};