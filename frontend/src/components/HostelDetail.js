import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomTypeLabel, formatPrice, buildContactLink, mapLink } from './listingUtils';
import './HostelDetail.css';

function HostelDetail() {
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hostelRes, listingsRes] = await Promise.all([
        fetch(`/api/hostels/${id}/`),
        fetch(`/api/posts/?hostel=${id}`),
      ]);

      if (hostelRes.ok) {
        setHostel(await hostelRes.json());
        setError(null);
      } else if (hostelRes.status === 404) {
        setError('Hostel not found.');
      } else {
        setError('Failed to load hostel');
      }

      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="hostel-container"><div className="loading">⏳ Loading…</div></div>;
  }

  if (error || !hostel) {
    return (
      <div className="hostel-container">
        <div className="error-message"><span>⚠️ {error || 'Not found'}</span></div>
        <Link to="/" className="back-link">← Back to listings</Link>
      </div>
    );
  }

  const contact = buildContactLink({
    telegramUsername: hostel.owner_telegram_username,
    telegramId: hostel.owner_telegram_id,
    phone: hostel.owner_phone,
  });
  const map = mapLink(hostel.latitude, hostel.longitude);
  const cover = hostel.images && hostel.images.length > 0 ? hostel.images[0].image : null;

  return (
    <div className="hostel-container">
      <Link to="/" className="back-link">← Back to listings</Link>

      <div className="hostel-hero">
        {cover ? (
          <img src={cover} alt={hostel.name} className="hostel-cover" />
        ) : (
          <div className="hostel-cover-placeholder">🏢</div>
        )}
        <div className="hostel-headline">
          <h1>
            {hostel.name}
            {hostel.is_verified && <span className="badge badge-verified">✓ Verified</span>}
          </h1>
          {hostel.category && <span className="hostel-category">{hostel.category}</span>}
          {hostel.address && <div className="hostel-address">📍 {hostel.address}</div>}
          {hostel.min_price !== null && hostel.min_price !== undefined && (
            <div className="hostel-from">from {formatPrice(hostel.min_price)}</div>
          )}
          <div className="hostel-actions">
            {map && (
              <a href={map} target="_blank" rel="noopener noreferrer" className="map-btn">
                🗺 View on map
              </a>
            )}
            {contact && (
              <a href={contact.href} target="_blank" rel="noopener noreferrer" className="contact-btn">
                💬 {contact.label}
              </a>
            )}
          </div>
        </div>
      </div>

      {hostel.description && <p className="hostel-description">{hostel.description}</p>}

      <h2 className="listings-heading">Listings from this hostel</h2>
      {listings.length === 0 ? (
        <div className="empty-state"><p>No active listings right now.</p></div>
      ) : (
        <div className="hostel-listings-grid">
          {listings.map((listing) => (
            <Link to={`/listings/${listing.id}`} key={listing.id} className="mini-card">
              <div className="mini-image">
                {listing.image ? (
                  <img src={listing.image} alt={listing.hostel_name} />
                ) : (
                  <div className="mini-image-placeholder">🛏</div>
                )}
              </div>
              <div className="mini-body">
                <div className="mini-price">{formatPrice(listing.price)}</div>
                {listing.room_type && <div className="mini-type">{roomTypeLabel(listing.room_type)}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default HostelDetail;
