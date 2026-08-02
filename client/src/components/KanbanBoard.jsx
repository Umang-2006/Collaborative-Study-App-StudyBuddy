import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, Clock, ListTodo, GripVertical } from 'lucide-react';

export const KanbanBoard = ({ initialTasks = [] }) => {
  const { socket, currentRoom } = useSocket();
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState(user?.username || 'Unassigned');

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newTask) => {
      setTasks((prev) => [newTask, ...prev]);
    };

    const handleUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    };

    const handleDeleted = (deletedId) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedId));
    };

    socket.on('task_created', handleCreated);
    socket.on('task_updated', handleUpdated);
    socket.on('task_deleted', handleDeleted);

    return () => {
      socket.off('task_created', handleCreated);
      socket.off('task_updated', handleUpdated);
      socket.off('task_deleted', handleDeleted);
    };
  }, [socket]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!title || !currentRoom || !socket) return;

    socket.emit('task_create', {
      roomCode: currentRoom,
      title,
      description,
      priority,
      assignedTo: assignedTo || user?.username || 'Unassigned',
      createdBy: user?.id
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    if (socket && currentRoom) {
      socket.emit('task_update_status', { taskId, status: newStatus, roomCode: currentRoom });
    }
  };

  const handleDeleteTask = (taskId) => {
    if (socket && currentRoom) {
      socket.emit('task_delete', { taskId, roomCode: currentRoom });
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleUpdateStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const columns = [
    { key: 'todo', title: 'To Do', icon: ListTodo, color: '#6366f1' },
    { key: 'in_progress', title: 'In Progress', icon: Clock, color: '#f59e0b' },
    { key: 'completed', title: 'Completed', icon: CheckCircle2, color: '#10b981' }
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Collaborative Task Board</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Drag and drop tasks across status columns</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', flex: 1, overflowY: 'auto' }}>
        {columns.map((col) => {
          const ColumnIcon = col.icon;
          const colTasks = tasks.filter((t) => t.status === col.key);

          return (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                transition: 'background 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.85rem', color: col.color }}>
                  <ColumnIcon size={16} />
                  <span>{col.title}</span>
                </div>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    className="glass-panel"
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: 'rgba(31, 41, 55, 0.7)',
                      cursor: 'grab',
                      opacity: draggedTaskId === task._id ? 0.4 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: 1.3 }}>{task.title}</h4>
                      </div>
                      <button onClick={() => handleDeleteTask(task._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', paddingLeft: '1.2rem' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        👤 {task.assignedTo || 'Unassigned'}
                      </span>
                    </div>

                    {/* Quick Move Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {col.key !== 'todo' && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, col.key === 'completed' ? 'in_progress' : 'todo')}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          title="Move Left"
                        >
                          <ArrowLeft size={12} />
                        </button>
                      )}
                      {col.key !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, col.key === 'todo' ? 'in_progress' : 'completed')}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          title="Move Right"
                        >
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 80
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>Create New Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Title</label>
                <input type="text" required placeholder="Study Chapter 4" className="glass-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Description</label>
                <input type="text" placeholder="Solve exercise problems" className="glass-input" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Priority</label>
                  <select className="glass-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low" style={{ background: '#1f2937' }}>Low</option>
                    <option value="medium" style={{ background: '#1f2937' }}>Medium</option>
                    <option value="high" style={{ background: '#1f2937' }}>High</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Assign To</label>
                  <input type="text" placeholder="Username" className="glass-input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
