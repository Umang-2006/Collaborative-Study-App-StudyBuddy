const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String,
    default: 'Unknown'
  }
}, { timestamps: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);
