import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  const getTasks = () => {
    axios.get(`${API_URL}/api/tasks`)
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { getTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!input) return;
    await axios.post(`${API_URL}/api/tasks`, { title: input });
    setInput('');
    getTasks();
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1 style={{ color: '#2563eb' }}>🚀 TaskFlow Cloud Dashboard</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="New Task..." 
          style={{ padding: '12px', width: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px 20px', marginLeft: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add</button>
      </form>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
        {tasks.map(t => (
          <div key={t._id} style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.title}</span>
            <span style={{ fontSize: '0.8em', color: '#999' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
