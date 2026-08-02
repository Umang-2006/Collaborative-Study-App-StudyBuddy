const Room = require('../models/Room');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Flashcard = require('../models/Flashcard');

const roomMembers = new Map();
const roomTimers = new Map();

const setupStudySocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('join_room', async ({ roomCode, user }) => {
      const code = roomCode.toUpperCase();
      socket.join(code);
      socket.roomCode = code;
      socket.userData = user;

      if (!roomMembers.has(code)) roomMembers.set(code, new Map());
      roomMembers.get(code).set(socket.id, user);

      io.to(code).emit('presence_update', Array.from(roomMembers.get(code).values()));
      io.to(code).emit('system_message', { text: `${user.username} joined the study room.`, timestamp: new Date() });
    });

    socket.on('leave_room', () => {
      const code = socket.roomCode;
      if (code && roomMembers.has(code)) {
        const user = socket.userData;
        roomMembers.get(code).delete(socket.id);
        if (roomMembers.get(code).size === 0) roomMembers.delete(code);
        else io.to(code).emit('presence_update', Array.from(roomMembers.get(code).values()));
        if (user) io.to(code).emit('system_message', { text: `${user.username} left the study room.`, timestamp: new Date() });
        socket.leave(code);
        socket.roomCode = null;
      }
    });

    // ── POMODORO TIMER ──────────────────────────────────────────
    socket.on('timer_action', async ({ roomCode, action, mode, customDurations }) => {
      const code = roomCode.toUpperCase();
      const room = await Room.findOne({ code });
      if (!room) return;
      let timer = room.timerState;

      if (action === 'update_durations' && customDurations) {
        timer.workDuration = customDurations.work * 60;
        timer.shortBreakDuration = customDurations.shortBreak * 60;
        timer.longBreakDuration = customDurations.longBreak * 60;
        if (timer.mode === 'work') timer.timeLeft = timer.workDuration;
        else if (timer.mode === 'shortBreak') timer.timeLeft = timer.shortBreakDuration;
        else timer.timeLeft = timer.longBreakDuration;
        timer.isRunning = false;
        clearInterval(roomTimers.get(code)); roomTimers.delete(code);
      } else if (action === 'change_mode') {
        timer.mode = mode;
        if (mode === 'work') timer.timeLeft = timer.workDuration;
        else if (mode === 'shortBreak') timer.timeLeft = timer.shortBreakDuration;
        else timer.timeLeft = timer.longBreakDuration;
        timer.isRunning = false;
        clearInterval(roomTimers.get(code)); roomTimers.delete(code);
      } else if (action === 'start') {
        timer.isRunning = true;
        if (!roomTimers.has(code)) {
          const timerId = setInterval(async () => {
            const cur = await Room.findOne({ code });
            if (!cur || !cur.timerState.isRunning) { clearInterval(roomTimers.get(code)); roomTimers.delete(code); return; }
            if (cur.timerState.timeLeft > 0) {
              cur.timerState.timeLeft -= 1;
              cur.timerState.lastUpdated = new Date();
              await cur.save();
              io.to(code).emit('timer_tick', cur.timerState);
            } else {
              cur.timerState.isRunning = false;
              await cur.save();
              clearInterval(roomTimers.get(code)); roomTimers.delete(code);
              io.to(code).emit('timer_completed', { mode: cur.timerState.mode });
            }
          }, 1000);
          roomTimers.set(code, timerId);
        }
      } else if (action === 'pause') {
        timer.isRunning = false;
        clearInterval(roomTimers.get(code)); roomTimers.delete(code);
      } else if (action === 'reset') {
        timer.isRunning = false;
        clearInterval(roomTimers.get(code)); roomTimers.delete(code);
        if (timer.mode === 'work') timer.timeLeft = timer.workDuration;
        else if (timer.mode === 'shortBreak') timer.timeLeft = timer.shortBreakDuration;
        else timer.timeLeft = timer.longBreakDuration;
      }

      timer.lastUpdated = new Date();
      await room.save();
      io.to(code).emit('timer_update', room.timerState);
    });

    // ── WEBRTC SIGNALING ────────────────────────────────────────
    socket.on('voice_join', ({ roomCode, user }) => {
      socket.to(roomCode.toUpperCase()).emit('user_joined_voice', { socketId: socket.id, user });
    });
    socket.on('voice_signal', ({ toSocketId, signal }) => {
      io.to(toSocketId).emit('voice_signal', { fromSocketId: socket.id, signal });
    });
    socket.on('voice_leave', ({ roomCode }) => {
      if (roomCode) socket.to(roomCode.toUpperCase()).emit('user_left_voice', { socketId: socket.id });
    });

    // ── WHITEBOARD ──────────────────────────────────────────────
    socket.on('draw_line', ({ roomCode, drawData }) => {
      socket.to(roomCode.toUpperCase()).emit('draw_line', drawData);
    });
    socket.on('clear_canvas', ({ roomCode }) => {
      socket.to(roomCode.toUpperCase()).emit('clear_canvas');
    });

    // ── KANBAN TASKS ────────────────────────────────────────────
    socket.on('task_create', async (taskData) => {
      try {
        const newTask = new Task(taskData);
        await newTask.save();
        io.to(taskData.roomCode.toUpperCase()).emit('task_created', newTask);
      } catch (err) { console.error('Task create error:', err); }
    });
    socket.on('task_update_status', async ({ taskId, status, roomCode }) => {
      try {
        const updated = await Task.findByIdAndUpdate(taskId, { status }, { returnDocument: 'after' });
        io.to(roomCode.toUpperCase()).emit('task_updated', updated);
      } catch (err) { console.error('Task update error:', err); }
    });
    socket.on('task_delete', async ({ taskId, roomCode }) => {
      try {
        await Task.findByIdAndDelete(taskId);
        io.to(roomCode.toUpperCase()).emit('task_deleted', taskId);
      } catch (err) { console.error('Task delete error:', err); }
    });

    // ── SHARED NOTES ────────────────────────────────────────────
    socket.on('notes_update', async ({ roomCode, notes }) => {
      const code = roomCode.toUpperCase();
      socket.to(code).emit('notes_sync', notes);
      try { await Room.findOneAndUpdate({ code }, { notes }); } catch (err) { console.error('Notes error:', err); }
    });

    // ── CHAT ────────────────────────────────────────────────────
    socket.on('send_message', async ({ roomCode, text, sender, senderColor }) => {
      try {
        const code = roomCode.toUpperCase();
        const msg = new Message({ roomCode: code, sender, senderColor: senderColor || '#6366f1', text });
        await msg.save();
        io.to(code).emit('new_message', msg);
      } catch (err) { console.error('Message error:', err); }
    });

    // ── FLASHCARDS ───────────────────────────────────────────────
    socket.on('flashcard_create', async ({ roomCode, question, answer, createdBy }) => {
      try {
        const code = roomCode.toUpperCase();
        const card = new Flashcard({ roomCode: code, question, answer, createdBy });
        await card.save();
        io.to(code).emit('flashcard_created', card);
      } catch (err) { console.error('Flashcard create error:', err); }
    });
    socket.on('flashcard_delete', async ({ cardId, roomCode }) => {
      try {
        await Flashcard.findByIdAndDelete(cardId);
        io.to(roomCode.toUpperCase()).emit('flashcard_deleted', cardId);
      } catch (err) { console.error('Flashcard delete error:', err); }
    });

    // ── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      const code = socket.roomCode;
      if (code && roomMembers.has(code)) {
        const user = socket.userData;
        roomMembers.get(code).delete(socket.id);
        if (roomMembers.get(code).size === 0) roomMembers.delete(code);
        else io.to(code).emit('presence_update', Array.from(roomMembers.get(code).values()));
        if (user) {
          io.to(code).emit('system_message', { text: `${user.username} disconnected.`, timestamp: new Date() });
          socket.to(code).emit('user_left_voice', { socketId: socket.id });
        }
      }
    });
  });
};

module.exports = setupStudySocket;
