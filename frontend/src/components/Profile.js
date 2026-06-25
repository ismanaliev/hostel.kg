import React, { useState, useEffect, useCallback } from 'react';
import './Profile.css';

function Profile({ token, user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
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
          phone_number: data.phone_number || '',
          email: data.email || ''
        });
        setError(null);
      } else {
        setError('Failed to fetch profile');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

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
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
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
        await response.json();
        setProfile({ ...profile, application_status: 'pending', role: 'owner' });
        setSuccess('Owner application submitted! Please wait for approval.');
        setTimeout(() => setSuccess(null), 5000);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  if (!token) {
    return <div className="profile-container">Please login to view your profile.</div>;
  }

  if (loading) {
    return <div className="profile-container"><div className="loading">⏳ Loading profile...</div></div>;
  }

  if (!profile) {
    return <div className="profile-container">Profile not found.</div>;
  }

  const isOwner = profile.role === 'owner';
  const canApplyForOwner = !isOwner && (!profile.application_status || profile.application_status === 'none');

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="edit-btn">
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>✓ {success}</span>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">💾 Save Changes</button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditForm({
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || '',
                  phone_number: profile.phone_number || '',
                  email: profile.email || ''
                });
              }}
              className="cancel-btn"
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-content">
          <div className="profile-info-grid">
            <div className="info-card">
              <h3>Account Information</h3>
              <div className="info-item">
                <label>Username:</label>
                <span>{profile.username}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{profile.email || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{profile.phone_number || 'Not set'}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Personal Information</h3>
              <div className="info-item">
                <label>First Name:</label>
                <span>{profile.first_name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Last Name:</label>
                <span>{profile.last_name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Telegram ID:</label>
                <span>{profile.telegram_id || 'Not linked'}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>Account Status</h3>
              <div className="info-item">
                <label>User Type:</label>
                <span className={`role-badge role-${profile.role}`}>
                  {profile.role === 'owner' ? '🏢 Owner' : 
                   profile.role === 'staff' ? '👨‍💼 Staff' : '👤 Client'}
                </span>
              </div>
              <div className="info-item">
                <label>Verified:</label>
                <span className={profile.is_verified ? 'verified' : 'not-verified'}>
                  {profile.is_verified ? '✓ Verified' : '✗ Not Verified'}
                </span>
              </div>
              {profile.application_status && profile.application_status !== 'none' && (
                <div className="info-item">
                  <label>Owner Application:</label>
                  <span className={`status-badge status-${profile.application_status}`}>
                    {profile.application_status === 'pending' ? '⏳ Pending Review' :
                     profile.application_status === 'approved' ? '✓ Approved' : 
                     profile.application_status === 'rejected' ? '✗ Rejected' : profile.application_status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {canApplyForOwner && (
            <div className="owner-application-section">
              <h3>Become a Hostel Owner</h3>
              <p>Transform your hostel into a shared experience. Apply to become an owner and start managing your property.</p>
              <button onClick={handleBecomeOwner} className="become-owner-btn">
                🚀 Apply to Become Owner
              </button>
            </div>
          )}

          {profile.application_status === 'pending' && !isOwner && (
            <div className="pending-notice">
              <h3>Application Pending</h3>
              <p>Your application to become a hostel owner is under review. We'll notify you once it's processed.</p>
            </div>
          )}

          {profile.application_status === 'rejected' && (
            <div className="rejected-notice">
              <h3>Application Rejected</h3>
              <p>Unfortunately, your application was not approved. Please contact support for more information.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;