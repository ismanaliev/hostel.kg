import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Posts from './components/Posts';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [manualInitData, setManualInitData] = useState('');
  const [isTelegramReady, setIsTelegramReady] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async (authToken) => {
    try {
      const response = await fetch('/api/users/profile/', {
        headers: {
          'Authorization': `Token ${authToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      setUser(data);
      return data;
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      setIsTelegramReady(true);
      const initData = window.Telegram.WebApp.initData;
      if (!token && initData) {
        handleTelegramAuth(initData);
      }
    }
  }, [token]);

  const handleTelegramAuth = (incomingInitData) => {
    const initData = incomingInitData || window.Telegram?.WebApp?.initData || manualInitData;
    if (!initData) {
      alert('Please open this app from Telegram Web App or paste initData to authenticate.');
      return;
    }

    fetch('/api/users/auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user || null);
        navigate('/posts');
      } else {
        alert(data.detail || data.error || 'Authentication failed.');
      }
    })
    .catch(() => {
      alert('Authentication failed. Please try again.');
    });
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
                <>
                  <button onClick={handleTelegramAuth} className="cta-btn">
                    Get Started
                  </button>
                  {!isTelegramReady && (
                    <div className="manual-login">
                      <p>Or paste Telegram initData here for local login:</p>
                      <textarea
                        value={manualInitData}
                        onChange={(e) => setManualInitData(e.target.value)}
                        rows={4}
                        placeholder="initData from Telegram"
                      />
                      <button onClick={() => handleTelegramAuth(manualInitData)} className="auth-btn">
                        Login with initData
                      </button>
                    </div>
                  )}
                </>
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