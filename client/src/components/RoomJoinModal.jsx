import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { PlusCircle, LogIn, Sparkles, Hash, X, Clock, ArrowRight } from 'lucide-react';

export const RoomJoinModal = ({ onClose }) => {
  const [tab, setTab] = useState('join');
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);

  const { joinRoom, currentRoom } = useSocket();

  // Load recent rooms from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('study_recent_rooms') || '[]');
      setRecentRooms(saved);
    } catch (e) {
      setRecentRooms([]);
    }
  }, []);

  const saveToRecent = (code, name) => {
    try {
      const saved = JSON.parse(localStorage.getItem('study_recent_rooms') || '[]');
      const filtered = saved.filter(r => r.code !== code);
      const updated = [{ code, name: name || `Room ${code}` }, ...filtered].slice(0, 5);
      localStorage.setItem('study_recent_rooms', JSON.stringify(updated));
      setRecentRooms(updated);
    } catch (e) {}
  };

  const handleJoin = async (e, codeToJoin = null) => {
    if (e) e.preventDefault();
    const targetCode = (codeToJoin || joinCode).trim().toUpperCase();
    if (!targetCode) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/rooms/${targetCode}`);
      if (res.data && res.data.room) {
        joinRoom(targetCode);
        saveToRecent(targetCode, res.data.room.name);
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found. Check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/rooms/create', { name: roomName, description });
      const createdCode = res.data.code;
      joinRoom(createdCode);
      saveToRecent(createdCode, roomName);
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 90,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative' }}>
        
        {/* Cancel / Close Button if current room exists or onClose passed */}
        {(currentRoom || onClose) && (
          <button
            onClick={() => { if (onClose) onClose(); }}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Cancel & return to room"
          >
            <X size={18} />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Collaborative Study Space</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Enter a room code, select a recent room, or create a new space
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '1.25rem'
        }}>
          <button
            onClick={() => { setTab('join'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'join' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'join' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Join Room
          </button>
          <button
            onClick={() => { setTab('create'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'create' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'create' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Create Room
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {tab === 'join' ? (
          <div>
            <form onSubmit={(e) => handleJoin(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                  Room Code (6 Characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. X7K9A2"
                    className="glass-input"
                    style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600' }}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.85rem' }}>
                <LogIn size={18} />
                <span>{loading ? 'Joining...' : 'Enter Study Room'}</span>
              </button>
            </form>

            {/* Recent Rooms Quick Re-join */}
            {recentRooms.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                  <Clock size={14} />
                  <span>Recent Rooms:</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {recentRooms.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => handleJoin(null, r.code)}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      <span style={{ fontWeight: '600' }}>{r.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                        <span>{r.code}</span>
                        <ArrowRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                Room Name
              </label>
              <input
                type="text"
                required
                placeholder="CS101 Final Exam Prep"
                className="glass-input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>
                Goal / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Solving practice papers & algorithms"
                className="glass-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.85rem' }}>
              <PlusCircle size={18} />
              <span>{loading ? 'Creating...' : 'Create & Join Room'}</span>
            </button>
          </form>
        )}

        {/* Back to current room button if current room exists */}
        {currentRoom && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              onClick={() => { if (onClose) onClose(); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              ← Cancel & return to current room ({currentRoom})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
