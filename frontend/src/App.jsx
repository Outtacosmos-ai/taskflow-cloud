import React, { useState, useEffect } from 'react';
import axios from 'axios';

// FINAL DEMO FIX: Direct connection to your Backend LoadBalancer
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
    <div style={{ padding: '50px', fontFamily: 'Arial', textAlign: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#1877f2' }}>🚀 TaskFlow Cloud Dashboard</h1>
      <p>PFE Cloud & DevOps - EKS Deployment</p>
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="New Task..." 
          style={{ padding: '15px', width: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '15px 25px', marginLeft: '10px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add Task</button>
      </form>
      <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {tasks.length === 0 ? <p>No tasks found. Add one above!</p> : tasks.map(t => (
          <div key={t._id} style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.title}</span>
            <span style={{ color: '#888', fontSize: '0.8em' }}>{new Date(t.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
