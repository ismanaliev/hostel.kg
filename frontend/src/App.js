import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Listings from './components/Listings';
import ListingDetail from './components/ListingDetail';
import HostelDetail from './components/HostelDetail';
import Posts from './components/Posts';
import Hostels from './components/Hostels';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [manualInitData, setManualInitData] = useState('');
  const [isTelegramReady, setIsTelegramReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
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

  const handleTelegramAuth = useCallback((incomingInitData) => {
    let initData = incomingInitData || window.Telegram?.WebApp?.initData || manualInitData;

    const buildQueryString = (obj) => {
      const params = new URLSearchParams();
      Object.entries(obj).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        params.append(key, String(value));
      });
      return params.toString();
    };

    if (typeof initData === 'string') {
      const trimmed = initData.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed === 'object' && parsed !== null) {
            initData = buildQueryString(parsed);
          }
        } catch (e) {
          // not JSON, leave as string
        }
      }
    }

    if (typeof initData === 'object' && initData !== null) {
      initData = buildQueryString(initData);
    }

    if (!initData || initData === '{}') {
      alert('Please open this app from Telegram Web App or paste initData to authenticate.');
      return;
    }

    fetch('/api/users/auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData: String(initData).trim() })
    })
    .then(async (res) => {
      const responseText = await res.text();
      let data = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Keep responseText for error display
      }

      if (res.ok && data && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user || null);
        setAuthError(null);
        setShowOwnerLogin(false);
        navigate('/manage/listings');
      } else {
        const errorMessage = data?.detail || data?.error || responseText || `Authentication failed (status ${res.status})`;
        setAuthError(errorMessage);
      }
    })
    .catch((err) => {
      setAuthError('Authentication failed. ' + (err.message || 'Please try again.'));
    });
  }, [manualInitData, navigate]);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      setIsTelegramReady(true);
      const initData = window.Telegram.WebApp.initData;
      if (!token && initData) {
        handleTelegramAuth(initData);
      }
    }
  }, [token, handleTelegramAuth]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const isOwner = user?.role === 'owner' || user?.role === 'staff';

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">🛏 hostel.kg</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Listings</Link>
            {token && isOwner ? (
              <>
                <Link to="/manage/hostels" className="nav-link">My Hostels</Link>
                <Link to="/manage/listings" className="nav-link">My Listings</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <button
                onClick={() => setShowOwnerLogin((v) => !v)}
                className="auth-btn"
              >
                Owner login
              </button>
            )}
          </div>
        </div>
      </nav>

      {showOwnerLogin && !token && (
        <div className="owner-login-panel">
          <p>Are you a hostel owner? Log in with Telegram to manage your listings.</p>
          <button onClick={() => handleTelegramAuth()} className="cta-btn">
            Login with Telegram
          </button>
          {!isTelegramReady && (
            <div className="manual-login">
              <p>Or paste Telegram initData here for local login:</p>
              <textarea
                value={manualInitData}
                onChange={(e) => setManualInitData(e.target.value)}
                rows={3}
                placeholder="initData from Telegram"
              />
              <button onClick={() => handleTelegramAuth(manualInitData)} className="auth-btn">
                Login with initData
              </button>
            </div>
          )}
          {authError && (
            <div className="error-message auth-error">
              <span>⚠ {authError}</span>
              <button onClick={() => setAuthError(null)}>Dismiss</button>
            </div>
          )}
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/hostels/:id" element={<HostelDetail />} />
          <Route
            path="/manage/hostels"
            element={<Hostels token={token} user={user} />}
          />
          <Route
            path="/manage/listings"
            element={<Posts token={token} user={user} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
