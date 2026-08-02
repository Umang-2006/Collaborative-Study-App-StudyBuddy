import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Edit3, Check, Copy, Sparkles, FileText, Download } from 'lucide-react';

export const SharedNotes = ({ initialNotes = '' }) => {
  const { socket, currentRoom } = useSocket();
  const [notes, setNotes] = useState(initialNotes);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    if (!socket) return;

    const handleNotesSync = (updatedNotes) => {
      setNotes(updatedNotes);
    };

    socket.on('notes_sync', handleNotesSync);

    return () => {
      socket.off('notes_sync', handleNotesSync);
    };
  }, [socket]);

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    setIsTyping(true);

    if (socket && currentRoom) {
      socket.emit('notes_update', { roomCode: currentRoom, notes: val });
    }

    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `StudyNotes_${currentRoom || 'Session'}.md`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleExportDoc = () => {
    const formattedText = `STUDY PULSE NOTES - ROOM ${currentRoom}\nDate: ${new Date().toLocaleDateString()}\n----------------------------------------\n\n${notes}`;
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `StudyNotes_${currentRoom || 'Session'}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const insertTemplate = (templateText) => {
    const updated = notes ? `${notes}\n\n${templateText}` : templateText;
    setNotes(updated);
    if (socket && currentRoom) {
      socket.emit('notes_update', { roomCode: currentRoom, notes: updated });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit3 size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Shared Study Notes</h3>
          <span style={{ fontSize: '0.75rem', color: isTyping ? 'var(--accent-warning)' : 'var(--accent-success)', marginLeft: '0.5rem' }}>
            ● {isTyping ? 'Broadcasting...' : 'Synced'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={handleCopy} className="btn-secondary" style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }} title="Copy Notes">
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
          </button>
          <button onClick={handleExportMarkdown} className="btn-secondary" style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: 'var(--accent-primary)' }} title="Export .md">
            <Download size={14} /> .md
          </button>
          <button onClick={handleExportDoc} className="btn-secondary" style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: 'var(--accent-info)' }} title="Export .txt">
            <Download size={14} /> .txt
          </button>
        </div>
      </div>

      {/* Quick Templates */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => insertTemplate('📌 **Session Goals:**\n- [ ] Task 1\n- [ ] Task 2')}
          className="btn-secondary"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        >
          <Sparkles size={12} /> Goals Template
        </button>
        <button
          onClick={() => insertTemplate('📐 **Key Formulas / Concepts:**\n- `Formula 1`:\n- `Formula 2`:')}
          className="btn-secondary"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        >
          <FileText size={12} /> Cheat Sheet
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Type shared notes, summaries, or questions for the group here..."
        className="glass-input"
        style={{
          flex: 1,
          resize: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          padding: '1rem',
          minHeight: '220px'
        }}
      />
    </div>
  );
};
