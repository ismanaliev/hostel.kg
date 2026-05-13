import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BecomeOwnerStepper from './become_owner_stepper';

const PROFILE_URL = '/api/users/profile/';
const BECOME_OWNER_URL = '/api/users/become-owner/';

function fetchWithToken(url, token, options = {}) {
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : undefined,
    },
    ...options,
  });
}

export function ProfilePageWithSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [navigate, token]);

  const loadProfile = async () => {
    try {
      const response = await fetchWithToken(PROFILE_URL, token);
      if (!response.ok) {
        throw new Error('Unable to load profile');
      }
      const data = await response.json();
      setProfile(data);
      setFormState({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
      });

      const statusResponse = await fetchWithToken(BECOME_OWNER_URL, token);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setApplicationStatus(statusData);
      }
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setStatusMessage('Saving...');
    const response = await fetchWithToken(PROFILE_URL, token, {
      method: 'PATCH',
      body: JSON.stringify(formState),
    });

    if (!response.ok) {
      setStatusMessage('Failed to save profile.');
      return;
    }

    const updated = await response.json();
    setProfile((prev) => ({ ...prev, ...updated }));
    setEditMode(false);
    setStatusMessage('Profile saved successfully.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  if (loading) {
    return <div style={styles.container}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={styles.container}>No profile data available.</div>;
  }

  const isOwner = profile.role === 'owner';
  const hasHostels = Array.isArray(profile.hostels) && profile.hostels.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Profile</h1>
        <button onClick={() => setShowSettings(true)} style={styles.settingsButton}>
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          profile={profile}
          applicationStatus={applicationStatus}
          token={token}
          onOwnershipUpdate={loadProfile}
        />
      )}

      <div style={styles.profileCard}>
        <div style={styles.profileInfo}>
          <div>
            <strong>Role:</strong> {profile.role}
          </div>
          <div>
            <strong>Verified:</strong> {profile.is_verified ? 'Yes' : 'No'}
          </div>
          {profile.application_status && profile.application_status !== 'none' && (
            <div>
              <strong>Application Status:</strong> {profile.application_status}
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Account Details</h2>
          <button onClick={() => setEditMode((prev) => !prev)} style={styles.editButton}>
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            First name:
            <input
              name="first_name"
              value={formState.first_name}
              onChange={handleInputChange}
              disabled={!editMode}
              style={{ ...styles.input, opacity: editMode ? 1 : 0.6 }}
            />
          </label>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Last name:
            <input
              name="last_name"
              value={formState.last_name}
              onChange={handleInputChange}
              disabled={!editMode}
              style={{ ...styles.input, opacity: editMode ? 1 : 0.6 }}
            />
          </label>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Phone number:
            <input
              name="phone_number"
              value={formState.phone_number}
              onChange={handleInputChange}
              disabled={!editMode}
              style={{ ...styles.input, opacity: editMode ? 1 : 0.6 }}
            />
          </label>
        </div>

        {editMode && (
          <button onClick={handleSave} style={styles.saveButton}>
            Save Changes
          </button>
        )}

        {statusMessage && <div style={styles.message}>{statusMessage}</div>}
      </div>

      {isOwner && hasHostels && (
        <div style={styles.section}>
          <h2>Managed Hostels</h2>
          {profile.hostels.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} token={token} />
          ))}
        </div>
      )}

      {isOwner && (
        <div style={styles.section}>
          <h2>Manage Posts</h2>
          <button onClick={() => navigate('/manage-posts')} style={styles.manageButton}>
            Go to Post Management
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsModal({ isOpen, onClose, profile, applicationStatus, token, onOwnershipUpdate }) {
  if (!isOpen) return null;

  const isClient = profile.role === 'client';
  const isPending = applicationStatus?.application_status === 'pending';
  const canApply = isClient && applicationStatus?.can_apply;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2>Settings</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {isClient && (
          <div style={styles.modalContent}>
            {isPending ? (
              <div style={styles.pendingStatus}>
                <p>⏳ Your application is under review.</p>
                <p style={styles.smallText}>You'll be notified once admin approval is complete.</p>
              </div>
            ) : canApply ? (
              <BecomeOwnerForm
                token={token}
                onSuccess={() => {
                  onOwnershipUpdate();
                  onClose();
                }}
              />
            ) : (
              <div style={styles.rejectedStatus}>
                <p>❌ Your previous application was rejected.</p>
                <p style={styles.smallText}>Please contact support for more information.</p>
              </div>
            )}
          </div>
        )}

        {profile.role === 'owner' && (
          <div style={styles.modalContent}>
            <p>✓ You are registered as a hostel owner.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BecomeOwnerForm({ token, onSuccess }) {
  return (
    <BecomeOwnerStepper
      token={token}
      onSuccess={onSuccess}
    />
  );
}

function HostelCard({ hostel, token }) {
  const [editMode, setEditMode] = useState(false);
  const [hostelState, setHostelState] = useState({
    name: hostel.name || '',
    address: hostel.address || '',
    description: hostel.description || '',
  });
  const [message, setMessage] = useState('');

  const handleHostelChange = (event) => {
    const { name, value } = event.target;
    setHostelState((prev) => ({ ...prev, [name]: value }));
  };

  const saveHostel = async () => {
    setMessage('Saving hostel...');
    const response = await fetch(`/api/hostels/${hostel.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(hostelState),
    });

    if (!response.ok) {
      setMessage('Unable to save hostel data.');
      return;
    }

    setMessage('Hostel saved.');
    setEditMode(false);
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div style={styles.hostelCard}>
      <div style={styles.cardHeader}>
        <h3>{hostel.name}</h3>
        <span style={styles.statusBadge}>{hostel.status}</span>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Name:
          <input
            name="name"
            value={hostelState.name}
            onChange={handleHostelChange}
            disabled={!editMode}
            style={{ ...styles.input, opacity: editMode ? 1 : 0.6 }}
          />
        </label>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Address:
          <input
            name="address"
            value={hostelState.address}
            onChange={handleHostelChange}
            disabled={!editMode}
            style={{ ...styles.input, opacity: editMode ? 1 : 0.6 }}
          />
        </label>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Description:
          <textarea
            name="description"
            value={hostelState.description}
            onChange={handleHostelChange}
            disabled={!editMode}
            style={{ ...styles.input, minHeight: 80, opacity: editMode ? 1 : 0.6 }}
          />
        </label>
      </div>

      <div style={styles.cardActions}>
        <button
          onClick={() => setEditMode((prev) => !prev)}
          style={styles.editButton}
        >
          {editMode ? 'Cancel' : 'Edit'}
        </button>
        {editMode && (
          <button onClick={saveHostel} style={styles.saveButton}>
            Save
          </button>
        )}
      </div>

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  settingsButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: 8,
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  profileInfo: {
    display: 'grid',
    gap: 12,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontWeight: 500,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 8px',
    marginTop: 4,
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 14,
    fontFamily: 'inherit',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 16,
    width: '100%',
  },
  message: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: 4,
    fontSize: 14,
  },
  hostelCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 6,
    marginBottom: 12,
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
  },
  cardActions: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  manageButton: {
    padding: '12px 20px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    width: '100%',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottom: '1px solid #eee',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
  },
  modalContent: {
    padding: 20,
  },
  pendingStatus: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    padding: 16,
    borderRadius: 6,
  },
  rejectedStatus: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: 16,
    borderRadius: 6,
  },
  smallText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
};

export default ProfilePageWithSettings;
