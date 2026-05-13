import React, { useState, useEffect } from 'react';
import './Posts.css';

function Posts({ token, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    image: null
  });

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', newPost.content);
    if (newPost.image) {
      formData.append('image', newPost.image);
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
        setNewPost({ content: '', image: null });
        setShowCreateForm(false);
      } else {
        setError('Failed to create post');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleImageChange = (e) => {
    setNewPost({ ...newPost, image: e.target.files[0] });
  };

  if (!token) {
    return <div className="posts-container">Please login to view posts.</div>;
  }

  if (loading) {
    return <div className="posts-container">Loading posts...</div>;
  }

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h1>Posts</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-btn"
        >
          {showCreateForm ? 'Cancel' : 'Create Post'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleCreatePost} className="create-post-form">
          <div className="form-group">
            <textarea
              placeholder="What's on your mind?"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <button type="submit" className="submit-btn">Post</button>
        </form>
      )}

      <div className="posts-list">
        {posts.length === 0 ? (
          <p>No posts yet. Create your first post!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h3>{post.hostel?.name || 'Unknown Hostel'}</h3>
                <span className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="post-content">
                <p>{post.content}</p>
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post image"
                    className="post-image"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Posts;