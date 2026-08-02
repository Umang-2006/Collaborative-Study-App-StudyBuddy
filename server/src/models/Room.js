const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: 'A collaborative study room'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timerState: {
    mode: { type: String, enum: ['work', 'shortBreak', 'longBreak'], default: 'work' },
    workDuration: { type: Number, default: 25 * 60 },
    shortBreakDuration: { type: Number, default: 5 * 60 },
    longBreakDuration: { type: Number, default: 15 * 60 },
    timeLeft: { type: Number, default: 25 * 60 },
    isRunning: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  notes: {
    type: String,
    default: '# 📝 Shared Study Notes\n\n- Write down your goals here!\n- Share useful resources or code snippets.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
