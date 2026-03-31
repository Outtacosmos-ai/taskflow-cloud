import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks`);
      setTasks(res.data);
    } catch (err) { console.error("Error fetching tasks", err); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    await axios.post(`${API_URL}/api/tasks`, { title });
    setTitle('');
    fetchTasks();
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <h1>✅ TaskFlow Cloud</h1>
      <form onSubmit={addTask} style={{ marginBottom: '20px' }}>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="What needs to be done?" 
          style={{ padding: '12px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px 20px', marginLeft: '10px', cursor: 'pointer' }}>Add Task</button>
      </form>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        {tasks.length === 0 ? <p>No tasks yet. Add one above!</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map(t => <li key={t._id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>{t.title}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;