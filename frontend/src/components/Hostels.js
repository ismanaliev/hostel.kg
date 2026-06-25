import React, { useState, useEffect, useCallback } from 'react';
import './Hostels.css';

function Hostels({ token, user }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [newHostel, setNewHostel] = useState({
    name: '',
    description: '',
    category: 'Mixed',
    price_per_night: '',
    address: '',
    contact_phone: ''
  });

  const categories = ['Mixed', 'Female', 'Male', 'Couple', 'Family'];

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hostels/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHostels(data.results || data);
        setError(null);
      } else {
        setError('Failed to fetch hostels');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchHostels();
    }
  }, [token, fetchHostels]);

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    
    if (!newHostel.name.trim()) {
      setError('Hostel name is required');
      return;
    }

    try {
      const response = await fetch('/api/hostels/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHostel)
      });

      if (response.ok) {
        const createdHostel = await response.json();
        setHostels([createdHostel, ...hostels]);
        setNewHostel({
          name: '',
          description: '',
          category: 'Mixed',
          price_per_night: '',
          address: '',
          contact_phone: ''
        });
        setShowCreateForm(false);
        setError(null);
        alert('Hostel created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create hostel');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleDeleteHostel = async (hostelId) => {
    if (!window.confirm('Are you sure you want to delete this hostel?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hostels/${hostelId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setHostels(hostels.filter(h => h.id !== hostelId));
        setSelectedHostel(null);
        setError(null);
        alert('Hostel deleted successfully!');
      } else {
        setError('Failed to delete hostel');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const filteredHostels = hostels.filter(hostel => {
    const matchesSearch = hostel.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         hostel.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = !categoryFilter || hostel.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!token) {
    return <div className="hostels-container">Please login to view hostels.</div>;
  }

  return (
    <div className="hostels-container">
      <div className="hostels-header">
        <h1>🏢 Hostels</h1>
        {user?.role === 'owner' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="create-btn"
          >
            {showCreateForm ? '✕ Cancel' : '+ Add Hostel'}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {showCreateForm && user?.role === 'owner' && (
        <form onSubmit={handleCreateHostel} className="create-hostel-form">
          <h2>Create New Hostel</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Hostel Name *</label>
              <input
                type="text"
                placeholder="Enter hostel name"
                value={newHostel.name}
                onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newHostel.category}
                onChange={(e) => setNewHostel({ ...newHostel, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe your hostel..."
              value={newHostel.description}
              onChange={(e) => setNewHostel({ ...newHostel, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price per Night ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={newHostel.price_per_night}
                onChange={(e) => setNewHostel({ ...newHostel, price_per_night: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                placeholder="+1-234-567-8900"
                value={newHostel.contact_phone}
                onChange={(e) => setNewHostel({ ...newHostel, contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              placeholder="Enter hostel address"
              value={newHostel.address}
              onChange={(e) => setNewHostel({ ...newHostel, address: e.target.value })}
            />
          </div>

          <button type="submit" className="submit-btn">Create Hostel</button>
        </form>
      )}

      <div className="filters-section">
        <input
          type="text"
          placeholder="🔍 Search hostels..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={fetchHostels} className="refresh-btn">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="loading">⏳ Loading hostels...</div>
      ) : (
        <div className="hostels-list">
          {filteredHostels.length === 0 ? (
            <div className="empty-state">
              <p>No hostels found. {user?.role === 'owner' ? 'Create your first hostel!' : 'Check back soon!'}</p>
            </div>
          ) : (
            <div className="hostels-grid">
              {filteredHostels.map(hostel => (
                <div
                  key={hostel.id}
                  className={`hostel-card ${selectedHostel?.id === hostel.id ? 'selected' : ''}`}
                  onClick={() => setSelectedHostel(hostel)}
                >
                  <div className="hostel-card-header">
                    <h3>{hostel.name}</h3>
                    <span className={`category-badge category-${hostel.category.toLowerCase()}`}>
                      {hostel.category}
                    </span>
                  </div>
                  <p className="hostel-description">{hostel.description || 'No description'}</p>
                  <div className="hostel-meta">
                    {hostel.price_per_night && (
                      <div className="meta-item">💰 ${hostel.price_per_night}/night</div>
                    )}
                    {hostel.address && (
                      <div className="meta-item">📍 {hostel.address}</div>
                    )}
                  </div>
                  <div className="hostel-actions">
                    {user?.role === 'owner' && hostel.owner?.id === user.id && (
                      <>
                        <button className="edit-btn">✏️ Edit</button>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHostel(hostel.id);
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                    <button className="view-btn">👁️ View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Hostels;
