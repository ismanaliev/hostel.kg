import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { roomTypeLabel, formatPrice } from './listingUtils';
import './Listings.css';

const ROOM_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'bed', label: 'Bed in shared room' },
  { value: 'room', label: 'Private room' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'other', label: 'Other' },
];

function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roomType, setRoomType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', roomType: '', maxPrice: '' });

  const fetchListings = useCallback(async (filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.roomType) params.append('room_type', filters.roomType);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      const query = params.toString();
      const response = await fetch(`/api/posts/${query ? `?${query}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setListings(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } else {
        setError('Failed to load listings');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(appliedFilters);
  }, [appliedFilters, fetchListings]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setAppliedFilters({ search, roomType, maxPrice });
  };

  return (
    <div className="listings-container">
      <header className="listings-hero">
        <h1>Find a place to stay</h1>
        <p>Browse hostel beds and rooms across Kyrgyzstan. No account needed.</p>
      </header>

      <form className="listings-filters" onSubmit={handleApplyFilters}>
        <input
          type="text"
          placeholder="Search hostels or listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-search"
        />
        <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
          {ROOM_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="filter-price"
        />
        <button type="submit" className="filter-apply">Search</button>
      </form>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => fetchListings(appliedFilters)}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="loading">⏳ Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <p>No listings match your search yet.</p>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            <Link to={`/listings/${listing.id}`} key={listing.id} className="listing-card">
              <div className="listing-image">
                {listing.image ? (
                  <img src={listing.image} alt={listing.hostel_name} />
                ) : (
                  <div className="listing-image-placeholder">🛏</div>
                )}
                {listing.is_featured && <span className="badge badge-featured">★ Featured</span>}
              </div>
              <div className="listing-body">
                <div className="listing-price">{formatPrice(listing.price)}</div>
                {listing.room_type && (
                  <div className="listing-type">{roomTypeLabel(listing.room_type)}</div>
                )}
                <p className="listing-snippet">{listing.content}</p>
                <div className="listing-hostel">
                  <span>{listing.hostel_name}</span>
                  {listing.hostel_verified && <span className="badge badge-verified">✓ Verified</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Listings;
