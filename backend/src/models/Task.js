const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 200 
  },
  description: { 
    type: String, 
    default: '', 
    maxlength: 1000 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  // ADDED: Missing fields from your technical documentation
  category: { 
    type: String, 
    trim: true,
    default: 'general'
  },
  dueDate: { 
    type: Date 
  },
  // Assuming you have user authentication
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // Set to true if auth is fully implemented
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);