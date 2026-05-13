import React, { useState, useEffect } from 'react';
import './Profile.css';

function Profile({ token, user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          email: data.email || ''
        });
      } else {
        setError('Failed to fetch profile');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setUser(updatedProfile);
        setEditing(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleBecomeOwner = async () => {
    try {
      const response = await fetch('/api/users/become-owner/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({ ...profile, application_status: 'pending' });
        alert('Owner application submitted successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to submit application');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (!token) {
    return <div className="profile-container">Please login to view your profile.</div>;
  }

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-container">Profile not found.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="edit-btn">
            Edit Profile
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {editing ? (
        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-btn">Save Changes</button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditForm({
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || '',
                  phone: profile.phone || '',
                  email: profile.email || ''
                });
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="info-item">
            <label>Username:</label>
            <span>{profile.username}</span>
          </div>
          <div className="info-item">
            <label>First Name:</label>
            <span>{profile.first_name || 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>Last Name:</label>
            <span>{profile.last_name || 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{profile.phone || 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{profile.email || 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>User Type:</label>
            <span>{profile.is_owner ? 'Owner' : 'Regular User'}</span>
          </div>
          {profile.application_status && (
            <div className="info-item">
              <label>Owner Application:</label>
              <span className={`status-${profile.application_status}`}>
                {profile.application_status === 'pending' ? 'Pending Review' :
                 profile.application_status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
            </div>
          )}
          {!profile.is_owner && !profile.application_status && (
            <div className="owner-application">
              <button onClick={handleBecomeOwner} className="become-owner-btn">
                Apply to Become Owner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;