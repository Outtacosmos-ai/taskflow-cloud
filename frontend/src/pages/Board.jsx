import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#ff4757' },
  high:   { label: 'High',   color: '#ff6b35' },
  medium: { label: 'Medium', color: '#ffa502' },
  low:    { label: 'Low',    color: '#2ed573' },
};

const COL_ACCENT = {
  pending:   '#6c63ff',
  progress:  '#f7a23b',
  completed: '#2ed573',
};

function TaskModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(task._id, form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-tag">TF-{task._id.slice(-5).toUpperCase()}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="field-group">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="modal-input" />
        </div>
        <div className="field-group">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Add details..." className="modal-input modal-textarea" />
        </div>
        <div className="field-group">
          <label>Priority</label>
          <div className="priority-picker">
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <button key={key} className={`priority-chip ${form.priority === key ? 'active' : ''}`} style={{ '--chip-color': cfg.color }} onClick={() => setForm({ ...form, priority: key })}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-danger" onClick={() => { onDelete(task._id); onClose(); }}>Delete</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function CreateTaskForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.post('/tasks', { title: title.trim(), priority });
      setTitle('');
      setPriority('medium');
      setExpanded(false);
      onCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="create-row">
        <input placeholder="New task title…" value={title} onChange={(e) => setTitle(e.target.value)} onFocus={() => setExpanded(true)} className="create-input" />
        <button type="submit" className="btn-primary" disabled={creating || !title.trim()}>{creating ? '…' : '+ Add'}</button>
      </div>
      {expanded && (
        <div className="create-extras">
          <span className="create-label">Priority:</span>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button key={key} type="button" className={`priority-chip sm ${priority === key ? 'active' : ''}`} style={{ '--chip-color': cfg.color }} onClick={() => setPriority(key)}>
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

export default function Board() {
  const { user, logout } = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get('/boards/current');
      setBoard(res.data);
    } catch {
      // 401 handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const prev = JSON.parse(JSON.stringify(board));
    const next = JSON.parse(JSON.stringify(board));
    const sCol = next.columns.find((c) => c.key === source.droppableId);
    const dCol = next.columns.find((c) => c.key === destination.droppableId);
    const [moved] = sCol.taskOrder.splice(source.index, 1);
    dCol.taskOrder.splice(destination.index, 0, moved);
    setBoard(next);

    try {
      await api.patch('/boards/reorder', {
        boardId: board._id,
        sourceColKey: source.droppableId,
        destColKey: destination.droppableId,
        sourceIndex: source.index,
        destIndex: destination.index,
        taskId: draggableId,
      });
    } catch {
      setBoard(prev);
    }
  };

  const handleTaskSave = async (taskId, updates) => {
    await api.patch(`/tasks/${taskId}`, updates);
    await fetchBoard();
  };

  const handleTaskDelete = async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    await fetchBoard();
  };

  const totalTasks = board?.columns.reduce((s, c) => s + c.taskOrder.length, 0) || 0;

  if (loading) {
    return (
      <div className="board-loading">
        <div className="spinner large" />
        <p>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className={`board-root ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⬡</span>
          {sidebarOpen && <span className="logo-text">TaskFlow</span>}
        </div>
        {sidebarOpen && (
          <nav className="sidebar-nav">
            <div className="nav-item active"><span className="nav-icon">▦</span><span>Sprint Board</span></div>
            <div className="nav-section">WORKSPACE</div>
            <div className="nav-stat"><span>Total Tasks</span><span className="nav-badge">{totalTasks}</span></div>
            {board?.columns.map((col) => (
              <div className="nav-stat" key={col.key}>
                <span style={{ color: COL_ACCENT[col.key] }}>{col.title}</span>
                <span className="nav-badge" style={{ background: COL_ACCENT[col.key] + '22', color: COL_ACCENT[col.key] }}>{col.taskOrder.length}</span>
              </div>
            ))}
          </nav>
        )}
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-chip">
              <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? '◀' : '▶'}</button>
          <button className="btn-logout" onClick={logout} title="Sign out">⎋</button>
        </div>
      </aside>

      <main className="board-main">
        <header className="board-header">
          <div>
            <h1 className="board-title">{board?.name}</h1>
            <p className="board-subtitle">Sprint Board · {totalTasks} tasks</p>
          </div>
          <CreateTaskForm onCreated={fetchBoard} />
        </header>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="columns-grid">
            {board?.columns.map((col) => (
              <div className="column" key={col.key}>
                <div className="col-header" style={{ '--col-accent': COL_ACCENT[col.key] }}>
                  <div className="col-dot" />
                  <span className="col-title">{col.title}</span>
                  <span className="col-count">{col.taskOrder.length}</span>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={`col-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}>
                      {col.taskOrder.map((task, index) => (
                        <Draggable draggableId={task._id} index={index} key={task._id}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              style={{ ...provided.draggableProps.style, '--card-accent': COL_ACCENT[col.key] }}
                              onClick={() => setSelectedTask(task)}>
                              <div className="task-priority-bar" style={{ background: PRIORITY_CONFIG[task.priority]?.color }} />
                              <div className="task-body">
                                <p className="task-title">{task.title}</p>
                                {task.description && <p className="task-desc">{task.description}</p>}
                                <div className="task-meta">
                                  <span className="task-id">TF-{task._id.slice(-5).toUpperCase()}</span>
                                  <span className="task-badge" style={{ background: PRIORITY_CONFIG[task.priority]?.color + '22', color: PRIORITY_CONFIG[task.priority]?.color }}>
                                    {PRIORITY_CONFIG[task.priority]?.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.taskOrder.length === 0 && <div className="col-empty">Drop tasks here</div>}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </main>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onSave={handleTaskSave} onDelete={handleTaskDelete} />
      )}
    </div>
  );
}