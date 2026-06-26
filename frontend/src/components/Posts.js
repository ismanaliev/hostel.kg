import React, { useState, useEffect, useCallback } from 'react';
import { roomTypeLabel, formatPrice } from './listingUtils';
import './Posts.css';

const ROOM_TYPES = [
  { value: 'bed', label: 'Bed in shared room' },
  { value: 'room', label: 'Private room' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'other', label: 'Other' },
];

function Posts({ token, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    price: '',
    room_type: 'bed',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } else {
        setError('Failed to fetch listings');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token, fetchPosts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!newPost.content.trim()) {
      setError('Listing description cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.append('content', newPost.content);
    if (newPost.price) formData.append('price', newPost.price);
    if (newPost.room_type) formData.append('room_type', newPost.room_type);
    if (newPost.image) formData.append('image', newPost.image);

    try {
      const response = await fetch('/api/posts/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const createdPost = await response.json();
        setPosts([createdPost, ...posts]);
        setNewPost({ content: '', price: '', room_type: 'bed', image: null });
        setImagePreview(null);
        setShowCreateForm(false);
        setError(null);
        setSuccess('Listing created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create listing');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBump = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/bump/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const updated = await response.json();
        setPosts(posts.map(p => (p.id === postId ? updated : p)));
        setSuccess('Listing bumped to the top!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to bump listing');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        setSuccess('Listing deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete listing');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  if (!token) {
    return <div className="posts-container">Please log in as an owner to manage your listings.</div>;
  }

  if (user && user.role !== 'owner' && user.role !== 'staff') {
    return (
      <div className="posts-container">
        Only hostel owners can manage listings. Register your hostel via the Telegram bot to get started.
      </div>
    );
  }

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h1>🛏 My Listings</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-btn"
        >
          {showCreateForm ? '✕ Cancel' : '+ New Listing'}
        </button>
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

      {showCreateForm && (
        <form onSubmit={handleCreatePost} className="create-post-form">
          <h2>Create New Listing</h2>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              placeholder="e.g. Bed in a 6-person mixed dorm, includes breakfast"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Price (KGS)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 500"
              value={newPost.price}
              onChange={(e) => setNewPost({ ...newPost, price: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Room type</label>
            <select
              value={newPost.room_type}
              onChange={(e) => setNewPost({ ...newPost, room_type: e.target.value })}
            >
              {ROOM_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Photo</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="post-image"
              />
              <label htmlFor="post-image" className="file-label">
                📷 Choose Image
              </label>
            </div>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    setNewPost({ ...newPost, image: null });
                    setImagePreview(null);
                  }}
                  className="remove-image-btn"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="submit-btn">Publish Listing</button>
        </form>
      )}

      <div className="posts-controls">
        <button onClick={fetchPosts} className="refresh-btn">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="loading">⏳ Loading listings...</div>
      ) : (
        <div className="posts-list">
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>You have no listings yet. Create your first one!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-title-meta">
                    <h3>
                      {formatPrice(post.price)}
                      {post.room_type ? ` · ${roomTypeLabel(post.room_type)}` : ''}
                    </h3>
                    <span className="post-date">{post.hostel_name}</span>
                  </div>
                  <div className="post-card-actions">
                    <button
                      onClick={() => handleBump(post.id)}
                      className="bump-btn"
                      title="Bump to top"
                    >
                      ⬆ Bump
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="delete-post-btn"
                      title="Delete listing"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="post-content">
                  <p>{post.content}</p>
                  {post.image && (
                    <img src={post.image} alt="Listing" className="post-image" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Posts;
