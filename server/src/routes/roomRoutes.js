const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Flashcard = require('../models/Flashcard');
const auth = require('../middleware/auth');

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Create a new study room
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    let code = generateRoomCode();
    while (await Room.findOne({ code })) code = generateRoomCode();

    const room = new Room({
      code,
      name,
      description: description || 'Collaborative Study Session',
      createdBy: req.user.userId
    });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Error creating study room' });
  }
});

// Get room details by code (join)
router.get('/:code', auth, async (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    const room = await Room.findOne({ code: roomCode }).populate('createdBy', 'username avatarColor');
    if (!room) return res.status(404).json({ message: 'Study room not found' });

    const tasks = await Task.find({ roomCode }).sort({ createdAt: -1 });
    const messages = await Message.find({ roomCode }).sort({ createdAt: 1 }).limit(100);
    const flashcards = await Flashcard.find({ roomCode }).sort({ createdAt: 1 });

    res.json({ room, tasks, messages, flashcards });
  } catch (error) {
    console.error('Fetch room error:', error);
    res.status(500).json({ message: 'Error loading room data' });
  }
});

// List rooms this user has visited (history via query param codes[])
router.post('/history', auth, async (req, res) => {
  try {
    const { codes } = req.body; // array of room codes from localStorage
    if (!codes || !codes.length) return res.json([]);

    const upperCodes = codes.map(c => c.toUpperCase());
    const rooms = await Room.find({ code: { $in: upperCodes } })
      .select('code name description createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room history' });
  }
});

// List most recent public rooms (discovery)
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ updatedAt: -1 }).limit(20).populate('createdBy', 'username');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// --- Flashcard CRUD ---
// Get flashcards for a room
router.get('/:code/flashcards', auth, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ roomCode: req.params.code.toUpperCase() }).sort({ createdAt: 1 });
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flashcards' });
  }
});

// Create a flashcard
router.post('/:code/flashcards', auth, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer required' });

    const card = new Flashcard({
      roomCode: req.params.code.toUpperCase(),
      question,
      answer,
      createdBy: req.user.username
    });
    await card.save();
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Error creating flashcard' });
  }
});

// Delete a flashcard
router.delete('/:code/flashcards/:cardId', auth, async (req, res) => {
  try {
    await Flashcard.findByIdAndDelete(req.params.cardId);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting flashcard' });
  }
});

module.exports = router;
