import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Posts from './components/Posts';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Validate token and get user info
      fetch('/api/users/profile/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setUser(data);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      });
    }
  }, [token]);

  const handleTelegramAuth = () => {
    // This would be called from Telegram Web App
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
      fetch('/api/auth/telegram/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          setUser(data.user);
          navigate('/posts');
        }
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">Hostel App</Link>
          <div className="nav-links">
            {token ? (
              <>
                <Link to="/posts">Posts</Link>
                <Link to="/profile">Profile</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <button onClick={handleTelegramAuth} className="auth-btn">
                Login with Telegram
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <div className="home">
              <h1>Welcome to Hostel Management</h1>
              <p>Manage your hostels and posts through our platform.</p>
              {!token && (
                <button onClick={handleTelegramAuth} className="cta-btn">
                  Get Started
                </button>
              )}
            </div>
          } />
          <Route path="/posts" element={<Posts token={token} user={user} />} />
          <Route path="/profile" element={<Profile token={token} user={user} setUser={setUser} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;