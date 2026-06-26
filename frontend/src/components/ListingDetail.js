import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomTypeLabel, formatPrice, buildContactLink } from './listingUtils';
import './ListingDetail.css';

function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${id}/`);
      if (response.ok) {
        setListing(await response.json());
        setError(null);
      } else if (response.status === 404) {
        setError('This listing is no longer available.');
      } else {
        setError('Failed to load listing');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  if (loading) {
    return <div className="detail-container"><div className="loading">⏳ Loading…</div></div>;
  }

  if (error || !listing) {
    return (
      <div className="detail-container">
        <div className="error-message"><span>⚠️ {error || 'Not found'}</span></div>
        <Link to="/" className="back-link">← Back to listings</Link>
      </div>
    );
  }

  const contact = buildContactLink({
    telegramUsername: listing.owner_telegram_username,
    telegramId: listing.owner_telegram_id,
    phone: listing.owner_phone,
  });

  return (
    <div className="detail-container">
      <Link to="/" className="back-link">← Back to listings</Link>

      <div className="detail-card">
        <div className="detail-image">
          {listing.image ? (
            <img src={listing.image} alt={listing.hostel_name} />
          ) : (
            <div className="detail-image-placeholder">🛏</div>
          )}
          {listing.is_featured && <span className="badge badge-featured">★ Featured</span>}
        </div>

        <div className="detail-info">
          <div className="detail-price">{formatPrice(listing.price)}</div>
          {listing.room_type && (
            <div className="detail-type">{roomTypeLabel(listing.room_type)}</div>
          )}

          <p className="detail-description">{listing.content}</p>

          <Link to={`/hostels/${listing.hostel}`} className="detail-hostel">
            <div className="detail-hostel-name">
              {listing.hostel_name}
              {listing.hostel_verified && <span className="badge badge-verified">✓ Verified</span>}
            </div>
            {listing.hostel_address && (
              <div className="detail-hostel-address">📍 {listing.hostel_address}</div>
            )}
            <span className="detail-hostel-link">View hostel & all its listings →</span>
          </Link>

          {contact ? (
            <a href={contact.href} target="_blank" rel="noopener noreferrer" className="contact-btn">
              💬 {contact.label}
            </a>
          ) : (
            <div className="contact-unavailable">Contact info not available for this owner yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingDetail;
