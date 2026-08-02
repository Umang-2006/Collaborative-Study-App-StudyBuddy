import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, Copy, Check, LogOut, Users, Radio, Trophy, Palette, Edit, History, Brain } from 'lucide-react';

export const Navbar = ({ onOpenJoinModal, onOpenAnalytics, onOpenWhiteboard, onOpenHistory, onOpenFlashcards }) => {
  const { user, logout } = useAuth();
  const { currentRoom, isConnected, activeMembers } = useSocket();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const themes = [
    { id: 'dark', label: '🌑 Dark Glass' },
    { id: 'cyberpunk', label: '⚡ Cyberpunk' },
    { id: 'emerald', label: '🌿 Emerald' },
    { id: 'sunset', label: '🌅 Sunset Gold' },
    { id: 'light', label: '☀️ Light Mode' }
  ];

  return (
    <header className="glass-panel" style={{ margin: '1rem', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', zIndex: 10, flexWrap: 'wrap' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}>
          <BookOpen size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '800', background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyPulse</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: isConnected ? '#34d399' : '#f87171' }}>
            <Radio size={11} />
            <span>{isConnected ? 'Realtime Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Room controls */}
      {currentRoom ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Room:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--accent-primary)', letterSpacing: '1px' }}>{currentRoom}</strong>
            <button onClick={handleCopyCode} title="Copy Code" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {copied ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
            </button>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Users size={14} color="var(--accent-info)" /> {activeMembers.length}
          </div>
          <button onClick={onOpenWhiteboard} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
            <Edit size={13} /> Whiteboard
          </button>
          <button onClick={onOpenFlashcards} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--accent-info)' }}>
            <Brain size={13} /> Flashcards
          </button>
          <button onClick={onOpenAnalytics} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--accent-warning)' }}>
            <Trophy size={13} /> Stats
          </button>
          <button onClick={onOpenJoinModal} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
            Switch Room
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onOpenJoinModal} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
            Join / Create Room
          </button>
          <button onClick={onOpenHistory} className="btn-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem' }} title="Room History">
            <History size={16} />
          </button>
        </div>
      )}

      {/* Right: Theme + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* History button (always available once logged in) */}
        {user && currentRoom && (
          <button onClick={onOpenHistory} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }} title="Room History">
            <History size={15} />
          </button>
        )}

        {/* Theme picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.55rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          <Palette size={14} color="var(--accent-primary)" />
          <select value={theme} onChange={e => setTheme(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none', cursor: 'pointer', fontWeight: '500' }}>
            {themes.map(t => (
              <option key={t.id} value={t.id} style={{ background: '#111827', color: '#fff' }}>{t.label}</option>
            ))}
          </select>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.82rem', backgroundColor: user.avatarColor || '#6366f1' }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600', fontSize: '0.82rem' }}>{user.username}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user.email}</span>
              </div>
            </div>
            <button onClick={logout} className="btn-secondary" title="Logout" style={{ padding: '0.4rem' }}>
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
