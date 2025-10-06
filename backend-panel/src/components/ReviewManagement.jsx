import React, { useState, useEffect } from 'react';
import adminApiService from '../services/adminApiService';

const ReviewManagement = ({ addPopup }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, review: null });
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getReviews();
      
      if (result.success) {
        setReviews(result.data);
      } else {
        setError(result.message || 'Fehler beim Laden der Bewertungen');
      }
    } catch (err) {
      setError('Verbindungsfehler beim Laden der Bewertungen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteModal.review || !deleteReason.trim()) {
      addPopup('Bitte geben Sie einen Grund für die Löschung an.', 'warning');
      return;
    }

    try {
      const result = await adminApiService.deleteReview(deleteModal.review.id, deleteReason);
      
      if (result.success) {
        addPopup('Bewertung erfolgreich gelöscht! 🗑️', 'success');
        setDeleteModal({ show: false, review: null });
        setDeleteReason('');
        loadReviews(); // Neulade der Liste
      } else {
        addPopup(result.message || 'Fehler beim Löschen der Bewertung', 'error');
      }
    } catch (err) {
      addPopup('Verbindungsfehler beim Löschen der Bewertung', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="content-section">
        <h2 className="section-title">⭐ Bewertungsverwaltung wird geladen...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-section">
        <h2 className="section-title">❌ Fehler</h2>
        <p style={{ color: '#dc3545' }}>{error}</p>
        <button className="btn-primary" onClick={loadReviews}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-section">
        <h2 className="section-title">⭐ Bewertungsverwaltung</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Verwalten Sie alle Kundenbewertungen. Unangemessene Bewertungen können gelöscht werden.
        </p>

        {reviews.length === 0 ? (
          <p>Keine Bewertungen gefunden.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bewertungs-ID</th>
                <th>Kunde</th>
                <th>Bewertung</th>
                <th>Kommentar</th>
                <th>Erstellt am</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td>#{review.id}</td>
                  <td>{review.customer_username || 'Unbekannt'}</td>
                  <td>
                    <span style={{ fontSize: '1.2rem' }}>
                      {renderStars(review.rating)}
                    </span>
                    <br />
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {review.rating}/5 Sterne
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                    {review.comment || 'Keine Kommentar'}
                  </td>
                  <td>{formatDate(review.created_at)}</td>
                  <td>
                    <span className={`status-badge ${review.is_deleted ? 'status-rejected' : 'status-accepted'}`}>
                      {review.is_deleted ? 'Gelöscht' : 'Aktiv'}
                    </span>
                  </td>
                  <td>
                    {!review.is_deleted && (
                      <button 
                        className="action-btn btn-delete"
                        onClick={() => setDeleteModal({ show: true, review })}
                      >
                        Löschen
                      </button>
                    )}
                    {review.is_deleted && review.deleted_reason && (
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>
                        Grund: {review.deleted_reason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Bewertung löschen</h3>
            <p>
              Möchten Sie die Bewertung <strong>#{deleteModal.review?.id}</strong> wirklich löschen?
            </p>
            
            <div style={{ 
              margin: '15px 0', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <strong>Bewertung:</strong> {renderStars(deleteModal.review?.rating || 0)} ({deleteModal.review?.rating}/5)
              <br />
              <strong>Kommentar:</strong> {deleteModal.review?.comment || 'Kein Kommentar'}
            </div>
            
            <div className="form-group">
              <label className="form-label">Grund für die Löschung:</label>
              <textarea
                className="form-textarea"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Geben Sie einen Grund für die Löschung an (erforderlich)..."
                required
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setDeleteModal({ show: false, review: null });
                  setDeleteReason('');
                }}
              >
                Abbrechen
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteReview}
                disabled={!deleteReason.trim()}
              >
                Bewertung löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;