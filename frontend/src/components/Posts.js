import React, { useState, useEffect, useCallback } from 'react';
import './Posts.css';

function Posts({ token, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [newPost, setNewPost] = useState({
    content: '',
    image: null,
    hostel: ''
  });
  const [hostels, setHostels] = useState([]);
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
        const postsArray = Array.isArray(data) ? data : data.results || [];
        setPosts(postsArray);
        setError(null);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchHostels = useCallback(async () => {
    try {
      const response = await fetch('/api/hostels/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const hostelsArray = Array.isArray(data) ? data : data.results || [];
        setHostels(hostelsArray);
      }
    } catch (err) {
      console.error('Failed to fetch hostels:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPosts();
      fetchHostels();
    }
  }, [token, fetchPosts, fetchHostels]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.append('content', newPost.content);
    if (newPost.image) {
      formData.append('image', newPost.image);
    }
    if (newPost.hostel) {
      formData.append('hostel', newPost.hostel);
    }

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
        setNewPost({ content: '', image: null, hostel: '' });
        setImagePreview(null);
        setShowCreateForm(false);
        setError(null);
        setSuccess('Post created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create post');
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
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
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
        setSuccess('Post deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete post');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    return 0;
  });

  if (!token) {
    return <div className="posts-container">Please login to view posts.</div>;
  }

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h1>📝 Posts</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-btn"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create Post'}
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
          <h2>Create New Post</h2>
          <div className="form-group">
            <label>Post Content *</label>
            <textarea
              placeholder="What would you like to share?"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              required
              rows={5}
            />
            <div className="char-count">{newPost.content.length}/1000</div>
          </div>

          <div className="form-group">
            <label>Associated Hostel</label>
            <select
              value={newPost.hostel}
              onChange={(e) => setNewPost({ ...newPost, hostel: e.target.value })}
            >
              <option value="">Select a hostel (optional)</option>
              {hostels.map(hostel => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Add Image</label>
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

          <button type="submit" className="submit-btn">Post</button>
        </form>
      )}

      <div className="posts-controls">
        <div className="sort-control">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <button onClick={fetchPosts} className="refresh-btn">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="loading">⏳ Loading posts...</div>
      ) : (
        <div className="posts-list">
          {sortedPosts.length === 0 ? (
            <div className="empty-state">
              <p>No posts yet. Be the first to post something!</p>
            </div>
          ) : (
            sortedPosts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-title-meta">
                    <h3>{post.hostel?.name || 'General Post'}</h3>
                    <span className="post-date">
                      {new Date(post.created_at).toLocaleDateString()} 
                      {' '}
                      {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {user?.id === post.author?.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="delete-post-btn"
                      title="Delete post"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="post-content">
                  <p>{post.content}</p>
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      className="post-image"
                    />
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