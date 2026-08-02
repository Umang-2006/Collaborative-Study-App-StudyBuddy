import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Users, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';

export const StudyChat = ({ initialMessages = [] }) => {
  const { socket, currentRoom, activeMembers, systemMessages } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null); // { name, type, dataUrl }
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, systemMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to base64 data URL for instant socket sharing
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileAttachment({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        dataUrl: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((!input.trim() && !fileAttachment) || !socket || !currentRoom || !user) return;

    let textToSend = input.trim();
    if (fileAttachment) {
      if (fileAttachment.type === 'image') {
        textToSend += `\n![Attachment](${fileAttachment.dataUrl})`;
      } else {
        textToSend += `\n📎 [File: ${fileAttachment.name}](${fileAttachment.dataUrl})`;
      }
    }

    socket.emit('send_message', {
      roomCode: currentRoom,
      text: textToSend,
      sender: user.username,
      senderColor: user.avatarColor
    });

    setInput('');
    setFileAttachment(null);
  };

  const addEmoji = (emoji) => {
    setInput((prev) => prev + ' ' + emoji);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
      {/* Header & Presence */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="var(--accent-secondary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Room Chat</h3>
        </div>

        {/* Member Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Active Study Members">
          <Users size={14} color="var(--text-muted)" style={{ marginRight: '0.2rem' }} />
          {activeMembers.map((m, idx) => (
            <div
              key={idx}
              className="avatar-circle"
              style={{
                width: '26px',
                height: '26px',
                fontSize: '0.75rem',
                backgroundColor: m.avatarColor || '#6366f1',
                border: '2px solid var(--bg-primary)'
              }}
              title={m.username}
            >
              {m.username?.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px', marginBottom: '0.85rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
            No messages yet. Say hello or share notes with your group! 👋
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.sender === user?.username;
          const isImage = msg.text.includes('![Attachment](');
          const isDoc = msg.text.includes('📎 [File:');

          return (
            <div
              key={msg._id || index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: '600', color: msg.senderColor || 'var(--accent-primary)' }}>{msg.sender}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div style={{
                maxWidth: '88%',
                padding: '0.65rem 0.9rem',
                borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: isMe ? 'linear-gradient(135deg, var(--accent-primary), #4338ca)' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.88rem',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {/* Parse Image vs Document vs Plain Text */}
                {isImage ? (
                  <div>
                    <p style={{ marginBottom: '0.4rem' }}>{msg.text.split('![Attachment](')[0]}</p>
                    <img
                      src={msg.text.split('![Attachment](')[1].slice(0, -1)}
                      alt="Attachment"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '0.25rem' }}
                    />
                  </div>
                ) : isDoc ? (
                  <div>
                    <p style={{ marginBottom: '0.4rem' }}>{msg.text.split('📎 [File:')[0]}</p>
                    <a
                      href={msg.text.substring(msg.text.indexOf('](') + 2, msg.text.length - 1)}
                      download="attachment"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        color: 'var(--accent-info)',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      <FileText size={16} /> Download File
                    </a>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* File Attachment Chip */}
      {fileAttachment && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(99, 102, 241, 0.15)',
          padding: '0.4rem 0.75rem',
          borderRadius: '8px',
          marginBottom: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--accent-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {fileAttachment.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
            <span style={{ fontWeight: '600' }}>{fileAttachment.name}</span>
          </div>
          <button onClick={() => setFileAttachment(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Emoji Quick Actions & File Attach */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {['👍', '🎯', '🔥', '👏', '💡'].map((e) => (
            <button
              key={e}
              onClick={() => addEmoji(e)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          title="Attach Image or Document"
        >
          <Paperclip size={14} /> Attach File
        </button>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Ask a question or send a note..."
          className="glass-input"
          style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0.6rem 0.85rem' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
