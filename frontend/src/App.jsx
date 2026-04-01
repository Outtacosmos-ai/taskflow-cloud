import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://aa8dc67a7c9d349849492cf0406cef72-517214794.us-east-1.elb.amazonaws.com';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const getTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks`, authHeader);
      setTasks(res.data.tasks || []);
    } catch (err) { 
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => { if (token) getTasks(); }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/${isLogin ? 'login' : 'register'}`, form);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } catch (err) { alert("Authentication Failed."); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if(!input) return;
    await axios.post(`${API_URL}/api/tasks`, { title: input, status: 'pending' }, authHeader);
    setInput('');
    getTasks();
  };

  const moveTask = async (id, newStatus) => {
    await axios.put(`${API_URL}/api/tasks/${id}`, { status: newStatus }, authHeader);
    getTasks();
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API_URL}/api/tasks/${id}`, authHeader);
    getTasks();
  };

  const logout = () => { localStorage.removeItem('token'); setToken(null); };

  if (!token) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', width: '350px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#172b4d' }}>{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && <input placeholder="Name" onChange={e => setForm({...form, name: e.target.value})} style={{ padding: '10px' }} />}
          <input placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} style={{ padding: '10px' }} />
          <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '12px', background: '#0052cc', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{isLogin ? 'Enter' : 'Join'}</button>
        </form>
        <p onClick={() => setIsLogin(!isLogin)} style={{ textAlign: 'center', cursor: 'pointer', color: '#0052cc', marginTop: '15px', fontSize: '0.8rem' }}>Toggle Login/Register</p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f4f5f7', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ backgroundColor: '#0747a6', padding: '10px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🚀 TaskFlow Agile</h2>
        <button onClick={logout} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '3px', cursor: 'pointer' }}>Logout</button>
      </nav>
      <div style={{ padding: '20px' }}>
        <form onSubmit={addTask} style={{ marginBottom: '30px', textAlign: 'center' }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="What needs to be done?" style={{ padding: '10px', width: '300px', borderRadius: '3px', border: '1px solid #ddd' }} />
          <button type="submit" style={{ padding: '10px 20px', background: '#0052cc', color: 'white', border: 'none', marginLeft: '5px', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>Create Issue</button>
        </form>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { l: 'TODO', k: 'pending', next: 'progress', nL: 'Start' },
            { l: 'IN PROGRESS', k: 'progress', next: 'completed', nL: 'Finish' },
            { l: 'DONE', k: 'completed', next: null, nL: '' }
          ].map(col => (
            <div key={col.k} style={{ background: '#ebecf0', padding: '10px', borderRadius: '3px', minHeight: '60vh' }}>
              <h4 style={{ color: '#5e6c84', fontSize: '0.75rem', marginBottom: '15px', fontWeight: 'bold' }}>{col.l}</h4>
              {tasks.filter(t => t.status === col.k).map(t => (
                <div key={t._id} style={{ background: 'white', padding: '10px', marginBottom: '8px', borderRadius: '3px', boxShadow: '0 1px 0 rgba(9,30,66,.25)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{t.title}</div>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    {col.next && <button onClick={() => moveTask(t._id, col.next)} style={{ fontSize: '0.7rem', color: '#0052cc', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{col.nL} →</button>}
                    <button onClick={() => deleteTask(t._id)} style={{ fontSize: '0.7rem', color: '#de350b', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default App;