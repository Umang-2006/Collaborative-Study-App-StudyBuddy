import React, { useRef, useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Edit2, Eraser, Trash2, Download, Palette, X } from 'lucide-react';

export const SharedWhiteboard = ({ onClose }) => {
  const { socket, currentRoom } = useSocket();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil'); // 'pencil', 'eraser'
  const [color, setColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(3);
  const prevPosRef = useRef({ x: 0, y: 0 });

  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ffffff', '#000000'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fill background dark glass
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const drawFromSocket = (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.strokeStyle = data.isEraser ? '#111827' : data.color;
      ctx.lineWidth = data.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(data.fromX, data.fromY);
      ctx.lineTo(data.toX, data.toY);
      ctx.stroke();
    };

    const clearFromSocket = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw_line', drawFromSocket);
    socket.on('clear_canvas', clearFromSocket);

    return () => {
      socket.off('draw_line', drawFromSocket);
      socket.off('clear_canvas', clearFromSocket);
    };
  }, [socket]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    prevPosRef.current = coords;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const isEraser = tool === 'eraser';
    const activeColor = isEraser ? '#111827' : color;
    const activeWidth = isEraser ? lineWidth * 4 : lineWidth;

    ctx.beginPath();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = activeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(prevPosRef.current.x, prevPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Broadcast draw event via socket
    if (socket && currentRoom) {
      socket.emit('draw_line', {
        roomCode: currentRoom,
        drawData: {
          fromX: prevPosRef.current.x,
          fromY: prevPosRef.current.y,
          toX: coords.x,
          toY: coords.y,
          color: activeColor,
          lineWidth: activeWidth,
          isEraser
        }
      });
    }

    prevPosRef.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (socket && currentRoom) {
      socket.emit('clear_canvas', { roomCode: currentRoom });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `study_whiteboard_${currentRoom}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 92,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '1.25rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Header & Tools Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Palette size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Collaborative Whiteboard</h3>
          </div>

          {/* Canvas Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => setTool('pencil')}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                background: tool === 'pencil' ? 'var(--accent-primary)' : 'transparent',
                color: tool === 'pencil' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              <Edit2 size={14} /> Pencil
            </button>
            <button
              onClick={() => setTool('eraser')}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                background: tool === 'eraser' ? 'var(--accent-secondary)' : 'transparent',
                color: tool === 'eraser' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              <Eraser size={14} /> Eraser
            </button>

            {/* Color Palette */}
            {tool === 'pencil' && (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            )}

            <button onClick={handleClear} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#f87171' }}>
              <Trash2 size={14} /> Clear
            </button>
            <button onClick={handleDownload} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--accent-info)' }}>
              <Download size={14} /> Export PNG
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <canvas
          ref={canvasRef}
          width={860}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            width: '100%',
            height: '500px',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair'
          }}
        />
      </div>
    </div>
  );
};
