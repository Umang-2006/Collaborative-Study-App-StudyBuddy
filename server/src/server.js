require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const setupStudySocket = require('./sockets/studySocket');

const app = express();
const server = http.createServer(app);

// Accept any localhost port (handles Vite picking 5173/5174/5175/etc.)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    // Allow any localhost port
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Socket.io — also allow any localhost port
const io = socketIo(server, {
  cors: {
    origin: /^http:\/\/localhost:\d+$/,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupStudySocket(io);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/collaborative_study_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    server.listen(PORT, () => {
      console.log(`🚀 Collaborative Study Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    server.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT} (MongoDB offline)`);
    });
  });
