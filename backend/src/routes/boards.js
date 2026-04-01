const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Board = require('../models/Board');
const Task = require('../models/Task');

router.get('/current', auth, async (req, res) => {
  try {
    let board = await Board.findOne({ user: req.user.id }).populate('columns.taskOrder');
    if (!board) {
      board = new Board({
        name: 'My Workspace',
        user: req.user.id,
        columns: [
          { title: 'To Do', key: 'pending', taskOrder: [] },
          { title: 'In Progress', key: 'progress', taskOrder: [] },
          { title: 'Done', key: 'completed', taskOrder: [] },
        ],
      });
      await board.save();
    }
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.patch('/reorder', auth, async (req, res) => {
  const { boardId, sourceColKey, destColKey, sourceIndex, destIndex, taskId } = req.body;

  try {
    const board = await Board.findOne({ _id: boardId, user: req.user.id });
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    const sourceCol = board.columns.find((c) => c.key === sourceColKey);
    const destCol = board.columns.find((c) => c.key === destColKey);

    if (!sourceCol || !destCol) return res.status(404).json({ msg: 'Column not found' });

    sourceCol.taskOrder.splice(sourceIndex, 1);
    destCol.taskOrder.splice(destIndex, 0, taskId);

    if (sourceColKey !== destColKey) {
      await Task.findByIdAndUpdate(taskId, { status: destColKey });
    }

    await board.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Atomic update failed' });
  }
});

module.exports = router;