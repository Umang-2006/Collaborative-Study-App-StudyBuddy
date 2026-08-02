import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { History, Clock, Users, ArrowRight, Trash2, X } from 'lucide-react';

export const RoomHistoryModal = ({ onClose, onJoin }) => {
  const { currentRoom } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const savedCodes = JSON.parse(localStorage.getItem('study_recent_rooms') || '[]').map(r => r.code);
      if (!savedCodes.length) { setRooms([]); setLoading(false); return; }

      const res = await axios.post('http://localhost:5000/api/rooms/history', { codes: savedCodes });
      // Sort in localStorage order (most recent first)
      const sorted = savedCodes
        .map(code => res.data.find(r => r.code === code))
        .filter(Boolean);
      setRooms(sorted);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (code) => {
    try {
      const saved = JSON.parse(localStorage.getItem('study_recent_rooms') || '[]');
      const updated = saved.filter(r => r.code !== code);
      localStorage.setItem('study_recent_rooms', JSON.stringify(updated));
      setRooms(prev => prev.filter(r => r.code !== code));
    } catch {}
  };

  const handleClearAll = () => {
    localStorage.removeItem('study_recent_rooms');
    setRooms([]);
  };

  const handleJoin = (code) => {
    onJoin(code);
    onClose();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 93, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', position: 'relative' }}>
        {/* Header */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <History size={22} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Study Room History</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your recently visited study rooms — rejoin with one click.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading history...</div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <History size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <p>No room history yet.<br />Join a study room to start building your history.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
              {rooms.map((room) => (
                <div key={room.code} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: room.code === currentRoom ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: room.code === currentRoom ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                  borderRadius: '12px', gap: '0.75rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{room.name}</span>
                      {room.code === currentRoom && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.3)', color: 'var(--accent-primary)', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: '600' }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-primary)', letterSpacing: '1px' }}>{room.code}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {formatDate(room.updatedAt)}
                      </span>
                    </div>
                    {room.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>{room.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {room.code !== currentRoom && (
                      <button onClick={() => handleJoin(room.code)} className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                        <ArrowRight size={14} /> Rejoin
                      </button>
                    )}
                    <button onClick={() => handleRemove(room.code)} className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: '#f87171' }} title="Remove from history">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={handleClearAll} className="btn-secondary" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.3rem 0.65rem' }}>
                Clear All History
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
