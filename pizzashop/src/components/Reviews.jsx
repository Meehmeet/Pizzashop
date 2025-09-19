import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const Reviews = ({ addPopup }) => {
  const [bewertungen, setBewertungen] = useState([]);
  const [neueBewertung, setNeueBewertung] = useState(0);
  const [neuerKommentar, setNeuerKommentar] = useState('');
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    fetchBewertungen();
  }, []);

  const fetchBewertungen = async () => {
    try {
      const data = await apiService.getReviews();
      setBewertungen(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (neueBewertung === 0) {
      addPopup('Bitte gib eine Bewertung ab!', 'error');
      return;
    }

    if (!neuerKommentar.trim()) {
      addPopup('Bitte schreibe einen Kommentar!', 'error');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('pizzashop_currentUser'));
      
      const reviewData = {
        userId: user.id,
        rating: neueBewertung,
        comment: neuerKommentar
      };
      
      await apiService.createReview(reviewData);
      
      addPopup('Bewertung erfolgreich abgegeben! ⭐', 'success');
      setNeueBewertung(0);
      setNeuerKommentar('');
      fetchBewertungen();
    } catch (error) {
      console.error('Error creating review:', error);
      addPopup(error.message || 'Fehler beim Abgeben der Bewertung', 'error');
    }
  };

  const renderStars = (bewertung, interactive = false, onStarClick = null, onStarHover = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= (interactive ? (hoveredStar || bewertung) : bewertung) ? 'active' : ''}`}
            onClick={interactive ? () => onStarClick(star) : undefined}
            onMouseEnter={interactive ? () => onStarHover(star) : undefined}
            onMouseLeave={interactive ? () => onStarHover(0) : undefined}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (bewertungen.length === 0) return 0;
    const sum = bewertungen.reduce((total, review) => total + review.rating, 0);
    return (sum / bewertungen.length).toFixed(1);
  };

  if (loading) return <div className="loading">Lade Bewertungen...</div>;

  return (
    <div>
      <h2>⭐ Bewertungen & Erfahrungen</h2>
      
      <div style={{textAlign: 'center', padding: '30px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px'}}>
        <h3 style={{fontSize: '1.5rem', color: '#333', marginBottom: '10px'}}>
          Durchschnittsbewertung: {getAverageRating()} ⭐
        </h3>
        <p style={{color: '#666', fontSize: '1rem'}}>({bewertungen.length} Bewertungen)</p>
      </div>

      <div style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '30px'}}>
        <h3 style={{marginBottom: '20px', color: '#333'}}>📝 Deine Bewertung abgeben</h3>
        <form onSubmit={handleSubmitReview}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333'}}>Bewertung:</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px'}}>
              {renderStars(neueBewertung, true, setNeueBewertung, setHoveredStar)}
              <span style={{color: '#666', fontSize: '0.9rem'}}>
                {neueBewertung === 0 ? 'Keine Bewertung' :
                 neueBewertung === 1 ? 'Sehr schlecht' :
                 neueBewertung === 2 ? 'Schlecht' :
                 neueBewertung === 3 ? 'Okay' :
                 neueBewertung === 4 ? 'Gut' : 'Ausgezeichnet'}
              </span>
            </div>
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label htmlFor="comment" style={{display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333'}}>
              Dein Kommentar:
            </label>
            <textarea
              id="comment"
              className="review-textarea"
              value={neuerKommentar}
              onChange={(e) => setNeuerKommentar(e.target.value)}
              placeholder="Teile deine Erfahrung mit unserem Pizzashop..."
              rows="4"
              maxLength="500"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'border-color 0.3s ease'
              }}
            />
            <small style={{color: '#666', fontSize: '0.8rem'}}>{neuerKommentar.length}/500 Zeichen</small>
          </div>
          
          <button type="submit" className="submit-review">
            Bewertung abgeben ⭐
          </button>
        </form>
      </div>

      <div>
        <h3 style={{marginBottom: '20px', color: '#333'}}>💬 Alle Bewertungen</h3>
        
        {bewertungen.length === 0 ? (
          <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
            <p style={{fontSize: '1.2rem', marginBottom: '10px'}}>Noch keine Bewertungen vorhanden.</p>
            <p style={{color: '#666'}}>Sei der Erste und teile deine Erfahrung!</p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {bewertungen.map(bewertung => (
              <div key={bewertung.id} className="review-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <div style={{fontWeight: '600', color: '#333', fontSize: '1.1rem'}}>
                    {bewertung.username}
                  </div>
                  <div style={{color: '#666', fontSize: '0.9rem'}}>
                    {new Date(bewertung.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
                
                <div style={{marginBottom: '15px'}}>
                  {renderStars(bewertung.rating)}
                </div>
                
                <div style={{color: '#555', fontSize: '1rem', lineHeight: '1.5', fontStyle: 'italic'}}>
                  "{bewertung.comment}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;