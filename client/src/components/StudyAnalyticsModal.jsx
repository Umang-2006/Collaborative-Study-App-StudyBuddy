import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Trophy, Clock, CheckCircle2, Flame, Award, X } from 'lucide-react';

export const StudyAnalyticsModal = ({ tasks = [], onClose }) => {
  const { activeMembers } = useSocket();
  const { user } = useAuth();

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 95,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
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
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-warning)',
            marginBottom: '0.75rem'
          }}>
            <Trophy size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Study Analytics & Leaderboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Track your room productivity and focus milestones</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <Clock size={20} color="var(--accent-primary)" style={{ marginBottom: '0.25rem' }} />
            <h4 style={{ fontSize: '1.4rem', fontWeight: '800' }}>75 m</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Focus Time</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <CheckCircle2 size={20} color="var(--accent-success)" style={{ marginBottom: '0.25rem' }} />
            <h4 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{completedCount}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tasks Done</span>
          </div>
          <div style={{ background: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <Flame size={20} color="var(--accent-secondary)" style={{ marginBottom: '0.25rem' }} />
            <h4 style={{ fontSize: '1.4rem', fontWeight: '800' }}>3</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Streak Days</span>
          </div>
        </div>

        {/* Room Leaderboard */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={16} color="var(--accent-warning)" />
            <span>Active Room Study Leaderboard</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeMembers.map((m, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: m.username === user?.username ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: m.username === user?.username ? '1px solid var(--accent-primary)' : '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: '800', width: '20px', color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : 'var(--text-muted)' }}>
                    #{index + 1}
                  </span>
                  <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.75rem', backgroundColor: m.avatarColor || '#6366f1' }}>
                    {m.username?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.username}</span>
                </div>
                <span className="badge badge-low" style={{ textTransform: 'none' }}>
                  {50 - index * 10} mins focused
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
