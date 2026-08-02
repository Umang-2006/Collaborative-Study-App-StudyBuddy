import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Waves, Coffee, Music, Play, Square } from 'lucide-react';

export const AmbientAudioPlayer = () => {
  const [activeSound, setActiveSound] = useState(null); // 'rain', 'waves', 'cafe', 'lofi'
  const [volume, setVolume] = useState(0.4);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Stop current audio generator
  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setActiveSound(null);
  };

  // Generate Web Audio API noise (Rain / Pink Noise / Waves)
  const startSound = (type) => {
    stopAudio();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Pink / Brown noise synthesis
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain') {
        b0 = 0.99 * b0 + white * 0.05;
        output[i] = b0;
      } else if (type === 'waves') {
        b0 = 0.95 * b0 + white * 0.1;
        output[i] = b0 * Math.sin(i / (ctx.sampleRate * 0.5));
      } else {
        // Cafe / Pink Noise
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = b0 + b1 + b2;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    // Filter node for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'rain' ? 800 : type === 'waves' ? 400 : 1200;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNodeRef.current = gainNode;

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start();
    noiseNodeRef.current = whiteNoise;
    setActiveSound(type);
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const sounds = [
    { id: 'rain', label: 'Rain', icon: CloudRain },
    { id: 'waves', label: 'Ocean Waves', icon: Waves },
    { id: 'cafe', label: 'Cafe Hum', icon: Coffee }
  ];

  return (
    <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Music size={18} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Ambient Focus Sounds:</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {sounds.map((s) => {
          const Icon = s.icon;
          const isActive = activeSound === s.id;
          return (
            <button
              key={s.id}
              onClick={() => isActive ? stopAudio() : startSound(s.id)}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#fff' : 'var(--text-secondary)'
              }}
            >
              <Icon size={14} />
              <span>{s.label}</span>
            </button>
          );
        })}

        {activeSound && (
          <button onClick={stopAudio} className="btn-secondary" style={{ padding: '0.35rem', color: '#f87171' }} title="Stop Audio">
            <Square size={14} />
          </button>
        )}
      </div>

      {/* Volume Slider */}
      {activeSound && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px' }}>
          <Volume2 size={16} color="var(--text-secondary)" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
          />
        </div>
      )}
    </div>
  );
};
