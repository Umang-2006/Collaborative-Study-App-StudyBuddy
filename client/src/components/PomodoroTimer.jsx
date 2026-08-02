import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Coffee, Moon, Settings, Check, X } from 'lucide-react';

export const PomodoroTimer = ({ roomState }) => {
  const { socket, currentRoom } = useSocket();
  const [timerState, setTimerState] = useState(roomState?.timerState || {
    mode: 'work',
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    timeLeft: 25 * 60,
    isRunning: false
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [workMin, setWorkMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {}
  };

  useEffect(() => {
    if (roomState?.timerState) {
      setTimerState(roomState.timerState);
      setWorkMin(Math.floor((roomState.timerState.workDuration || 25 * 60) / 60));
      setShortBreakMin(Math.floor((roomState.timerState.shortBreakDuration || 5 * 60) / 60));
      setLongBreakMin(Math.floor((roomState.timerState.longBreakDuration || 15 * 60) / 60));
    }
  }, [roomState]);

  useEffect(() => {
    if (!socket) return;

    const handleTick = (newTimerState) => setTimerState(newTimerState);
    const handleUpdate = (newTimerState) => setTimerState(newTimerState);
    const handleCompleted = () => playChime();

    socket.on('timer_tick', handleTick);
    socket.on('timer_update', handleUpdate);
    socket.on('timer_completed', handleCompleted);

    return () => {
      socket.off('timer_tick', handleTick);
      socket.off('timer_update', handleUpdate);
      socket.off('timer_completed', handleCompleted);
    };
  }, [socket, soundEnabled]);

  const handleAction = (action, mode = null, customDurations = null) => {
    if (socket && currentRoom) {
      socket.emit('timer_action', { roomCode: currentRoom, action, mode, customDurations });
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    handleAction('update_durations', null, {
      work: Number(workMin) || 25,
      shortBreak: Number(shortBreakMin) || 5,
      longBreak: Number(longBreakMin) || 15
    });
    setIsSettingsOpen(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (timerState.mode === 'work') return timerState.workDuration || 25 * 60;
    if (timerState.mode === 'shortBreak') return timerState.shortBreakDuration || 5 * 60;
    return timerState.longBreakDuration || 15 * 60;
  };

  const total = getTotalDuration();
  const progress = total > 0 ? ((total - timerState.timeLeft) / total) * 100 : 0;
  const strokeDashoffset = 440 - (440 * progress) / 100;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {/* Settings & Sound Toggles */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          title="Custom Session Durations"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{ background: 'none', border: 'none', color: soundEnabled ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
          title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Mode Selector */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '4px',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => handleAction('change_mode', 'work')}
          className="btn-secondary"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            border: 'none',
            background: timerState.mode === 'work' ? 'var(--accent-primary)' : 'transparent',
            color: timerState.mode === 'work' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Flame size={14} /> Focus ({Math.floor((timerState.workDuration || 1500) / 60)}m)
        </button>
        <button
          onClick={() => handleAction('change_mode', 'shortBreak')}
          className="btn-secondary"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            border: 'none',
            background: timerState.mode === 'shortBreak' ? 'var(--accent-success)' : 'transparent',
            color: timerState.mode === 'shortBreak' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Coffee size={14} /> Short ({Math.floor((timerState.shortBreakDuration || 300) / 60)}m)
        </button>
        <button
          onClick={() => handleAction('change_mode', 'longBreak')}
          className="btn-secondary"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            border: 'none',
            background: timerState.mode === 'longBreak' ? 'var(--accent-info)' : 'transparent',
            color: timerState.mode === 'longBreak' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Moon size={14} /> Long ({Math.floor((timerState.longBreakDuration || 900) / 60)}m)
        </button>
      </div>

      {/* Radial Progress Circle */}
      <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <svg width="180" height="180" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r="70" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="10" fill="transparent" />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke={timerState.mode === 'work' ? 'var(--accent-primary)' : timerState.mode === 'shortBreak' ? 'var(--accent-success)' : 'var(--accent-info)'}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>

        {/* Time Text */}
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
            {formatTime(timerState.timeLeft)}
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {timerState.mode === 'work' ? 'Focus Session' : timerState.mode}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {timerState.isRunning ? (
          <button onClick={() => handleAction('pause')} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
            <Pause size={18} /> Pause
          </button>
        ) : (
          <button onClick={() => handleAction('start')} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
            <Play size={18} /> Start
          </button>
        )}
        <button onClick={() => handleAction('reset')} className="btn-secondary" style={{ padding: '0.6rem 1rem' }} title="Reset Timer">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Custom Timer Settings Modal */}
      {isSettingsOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 85
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '360px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Custom Timer Durations</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Focus Session (Minutes)</label>
                <input type="number" min="1" max="180" className="glass-input" value={workMin} onChange={(e) => setWorkMin(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Short Break (Minutes)</label>
                <input type="number" min="1" max="60" className="glass-input" value={shortBreakMin} onChange={(e) => setShortBreakMin(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Long Break (Minutes)</label>
                <input type="number" min="1" max="60" className="glass-input" value={longBreakMin} onChange={(e) => setLongBreakMin(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Check size={16} /> Save & Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
