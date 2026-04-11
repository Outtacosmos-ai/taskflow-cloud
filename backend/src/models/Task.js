const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 1000 },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'progress', 'completed'], // Must match your Board keys
    default: 'pending' 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  category: { type: String, trim: true, default: 'general' },
  dueDate: { type: Date },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);