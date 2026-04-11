const Task = require('../models/Task');
const { sendTaskNotification } = require('../services/sqsService');

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