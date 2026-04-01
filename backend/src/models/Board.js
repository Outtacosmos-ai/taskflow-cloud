const mongoose = require('mongoose');

const ColumnSchema = new mongoose.Schema({
  title: { type: String, required: true },
  key: { type: String, required: true }, // e.g., 'pending', 'progress', 'completed'
  taskOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

const BoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  columns: [ColumnSchema]
}, { timestamps: true });

module.exports = mongoose.model('Board', BoardSchema);