import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { RoomJoinModal } from './components/RoomJoinModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { KanbanBoard } from './components/KanbanBoard';
import { SharedNotes } from './components/SharedNotes';
import { StudyChat } from './components/StudyChat';
import { AmbientAudioPlayer } from './components/AmbientAudioPlayer';
import { StudyAnalyticsModal } from './components/StudyAnalyticsModal';
import { VoiceChannel } from './components/VoiceChannel';
import { SharedWhiteboard } from './components/SharedWhiteboard';
import { RoomHistoryModal } from './components/RoomHistoryModal';
import { FlashcardsModal } from './components/FlashcardsModal';

const MainWorkspace = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentRoom, joinRoom } = useSocket();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  useEffect(() => {
    if (currentRoom && user) {
      setLoadingRoom(true);
      axios.get(`http://localhost:5000/api/rooms/${currentRoom}`)
        .then(res => setRoomData(res.data))
        .catch(err => console.error('Fetch room error:', err))
        .finally(() => setLoadingRoom(false));
    } else {
      setRoomData(null);
    }
  }, [currentRoom, user]);

  const handleHistoryJoin = async (code) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/rooms/${code}`);
      if (res.data?.room) {
        joinRoom(code);
        const saved = JSON.parse(localStorage.getItem('study_recent_rooms') || '[]');
        const filtered = saved.filter(r => r.code !== code);
        const updated = [{ code, name: res.data.room.name }, ...filtered].slice(0, 5);
        localStorage.setItem('study_recent_rooms', JSON.stringify(updated));
      }
    } catch (err) { console.error('History join error:', err); }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Loading StudyPulse Workspace...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
      />

      {!user && <AuthModal />}

      {user && (!currentRoom || isJoinModalOpen) && (
        <RoomJoinModal onClose={() => setIsJoinModalOpen(false)} />
      )}

      {isAnalyticsOpen && (
        <StudyAnalyticsModal tasks={roomData?.tasks || []} onClose={() => setIsAnalyticsOpen(false)} />
      )}

      {isWhiteboardOpen && (
        <SharedWhiteboard onClose={() => setIsWhiteboardOpen(false)} />
      )}

      {isHistoryOpen && (
        <RoomHistoryModal onClose={() => setIsHistoryOpen(false)} onJoin={handleHistoryJoin} />
      )}

      {isFlashcardsOpen && (
        <FlashcardsModal initialCards={roomData?.flashcards || []} onClose={() => setIsFlashcardsOpen(false)} />
      )}

      {user && currentRoom && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1600px', width: '100%', margin: '0 auto', padding: '0 1rem 1.5rem' }}>
          {/* Audio & Voice Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <AmbientAudioPlayer />
            <VoiceChannel />
          </div>

          <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <PomodoroTimer roomState={roomData?.room} />
              <KanbanBoard initialTasks={roomData?.tasks || []} />
            </div>
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <SharedNotes initialNotes={roomData?.room?.notes || ''} />
              <StudyChat initialMessages={roomData?.messages || []} />
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MainWorkspace />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
