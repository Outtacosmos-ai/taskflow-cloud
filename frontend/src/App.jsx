import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://a17c1f2f83aa44189872346ebb2bb4f6-817499296.us-east-1.elb.amazonaws.com'\;

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  const getTasks = () => {
    axios.get(`${API_URL}/api/tasks`)
      .then(res => setTasks(res.data))
      .catch(err => console.error("API Error:", err));
  };

  useEffect(() => { getTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!input) return;
    try {
      await axios.post(`${API_URL}/api/tasks`, { title: input });
      setInput('');
      getTasks();
    } catch (err) { console.error("Post error:", err); }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ color: '#2563eb' }}>🚀 TaskFlow Cloud Dashboard</h1>
      <form onSubmit={handleSubmit} style={{ margin: '30px 0' }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="New Task..." 
          style={{ padding: '12px', width: '300px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" style={{ padding: '12px 24px', marginLeft: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add Task</button>
      </form>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {tasks.map(t => (
          <div key={t._id} style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.title}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(t.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
