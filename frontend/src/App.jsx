import React, { useState, useEffect } from 'react';
import axios from 'axios';

// SENIOR FIX: Hardcoding the ELB URL for the PFE Demo to ensure connectivity
const API_URL = 'http://a17c1f2f83aa44189872346ebb2bb4f6-817499296.us-east-1.elb.amazonaws.com'\;

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  const getTasks = () => {
    axios.get(`${API_URL}/api/tasks`)
      .then(res => setTasks(res.data))
      .catch(err => console.error("Fetch error:", err));
  };

  useEffect(() => { getTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!input) return;
    try {
      await axios.post(`${API_URL}/api/tasks`, { title: input });
      setInput('');
      getTasks();
    } catch (err) {
      console.error("Post error:", err);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ color: '#2563eb', fontSize: '2.5rem' }}>🚀 TaskFlow Cloud</h1>
      <p style={{ color: '#64748b' }}>DevOps Certification Project - Simplon Maghreb</p>
      
      <form onSubmit={handleSubmit} style={{ margin: '30px 0' }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a task (e.g. Test SQS Worker)..." 
          style={{ padding: '15px', width: '350px', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '15px 30px', marginLeft: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          Add Task
        </button>
      </form>

      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
        {tasks.length === 0 ? (
          <p style={{ padding: '20px', color: '#94a3b8' }}>No tasks found in MongoDB. Start by adding one!</p>
        ) : (
          tasks.map(t => (
            <div key={t._id} style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', color: '#1e293b' }}>{t.title}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                {new Date(t.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
