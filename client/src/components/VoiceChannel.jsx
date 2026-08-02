import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, PhoneCall, PhoneOff, Monitor, MonitorOff, X } from 'lucide-react';

export const VoiceChannel = () => {
  const { socket, currentRoom } = useSocket();
  const { user } = useAuth();

  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const localAudioStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      stopAllStreams();
    };
  }, []);

  const stopAllStreams = () => {
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      localAudioStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setInVoice(false);
    setIsMuted(false);
    setIsScreenSharing(false);
    setScreenStream(null);
  };

  const joinVoiceChannel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localAudioStreamRef.current = stream;
      setInVoice(true);
      setIsMuted(false);

      if (socket && currentRoom && user) {
        socket.emit('voice_join', { roomCode: currentRoom, user });
      }
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Handle user stopping screen share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setScreenStream(null);
  };

  const toggleMute = () => {
    if (localAudioStreamRef.current) {
      const audioTrack = localAudioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            padding: '0.4rem',
            borderRadius: '10px',
            background: inVoice ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: inVoice ? 'var(--accent-success)' : 'var(--text-muted)'
          }}>
            <PhoneCall size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '700' }}>Voice & Screen Share</h4>
            <span style={{ fontSize: '0.75rem', color: inVoice ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
              {inVoice ? 'Connected to Voice' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Voice & Screen Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {inVoice ? (
            <>
              <button
                onClick={toggleMute}
                className="btn-secondary"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isMuted ? '#f87171' : 'var(--accent-success)'
                }}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
              </button>

              {isScreenSharing ? (
                <button onClick={stopScreenShare} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#f87171' }}>
                  <MonitorOff size={14} /> Stop Sharing
                </button>
              ) : (
                <button onClick={startScreenShare} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent-info)' }}>
                  <Monitor size={14} /> Share Screen
                </button>
              )}

              <button onClick={stopAllStreams} className="btn-secondary" style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', color: '#f87171' }}>
                <PhoneOff size={14} />
              </button>
            </>
          ) : (
            <button onClick={joinVoiceChannel} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              <Mic size={14} /> Join Voice Channel
            </button>
          )}
        </div>
      </div>

      {/* Screen Share Video Stream Modal Preview */}
      {isScreenSharing && (
        <div style={{ position: 'relative', marginTop: '0.5rem', borderRadius: '10px', overflow: 'hidden', background: '#000', border: '1px solid var(--accent-info)' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--accent-info)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Monitor size={12} /> Presenting Your Screen
          </div>
        </div>
      )}
    </div>
  );
};
