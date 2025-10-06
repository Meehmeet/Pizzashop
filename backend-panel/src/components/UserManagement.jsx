import React, { useState, useEffect } from 'react';
import adminApiService from '../services/adminApiService';

const UserManagement = ({ addPopup }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [editModal, setEditModal] = useState({ show: false, user: null });
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await adminApiService.getUsers();
      
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.message || 'Fehler beim Laden der Benutzer');
      }
    } catch (err) {
      setError('Verbindungsfehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editModal.user || !editUsername.trim() || !editEmail.trim()) {
      addPopup('Bitte füllen Sie alle Felder aus.', 'warning');
      return;
    }

    // E-Mail Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      addPopup('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'warning');
      return;
    }

    try {
      const result = await adminApiService.updateUser(editModal.user.id, editUsername, editEmail);
      
      if (result.success) {
        addPopup('Benutzer erfolgreich aktualisiert! ✏️', 'success');
        setEditModal({ show: false, user: null });
        setEditUsername('');
        setEditEmail('');
        loadUsers(); // Neulade der Liste
      } else {
        addPopup(result.message || 'Fehler beim Aktualisieren des Benutzers', 'error');
      }
    } catch (err) {
      addPopup('Verbindungsfehler beim Aktualisieren des Benutzers', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user || !deleteReason.trim()) {
      addPopup('Bitte geben Sie einen Grund für die Löschung an.', 'warning');
      return;
    }

    try {
      const result = await adminApiService.deleteUser(deleteModal.user.id, deleteReason);
      
      if (result.success) {
        addPopup('Benutzer erfolgreich gelöscht! 🗑️', 'success');
        setDeleteModal({ show: false, user: null });
        setDeleteReason('');
        loadUsers(); // Neulade der Liste
      } else {
        addPopup(result.message || 'Fehler beim Löschen des Benutzers', 'error');
      }
    } catch (err) {
      addPopup('Verbindungsfehler beim Löschen des Benutzers', 'error');
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

  if (loading) {
    return (
      <div className="content-section">
        <h2 className="section-title">👥 Benutzerverwaltung wird geladen...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-section">
        <h2 className="section-title">❌ Fehler</h2>
        <p style={{ color: '#dc3545' }}>{error}</p>
        <button className="btn-primary" onClick={loadUsers}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-section">
        <h2 className="section-title">👥 Benutzerverwaltung</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Verwalten Sie alle registrierten Benutzer. Problematische Accounts können gelöscht werden.
        </p>

        {users.length === 0 ? (
          <p>Keine Benutzer gefunden.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Benutzername</th>
                <th>E-Mail</th>
                <th>Registriert am</th>
                <th>Rolle</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <span className={`status-badge ${user.role === 'admin' ? 'status-accepted' : 'status-pending'}`}>
                      {user.role === 'admin' ? 'Admin' : 'Benutzer'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'status-accepted' : 'status-rejected'}`}>
                      {user.is_active ? 'Aktiv' : 'Gelöscht'}
                    </span>
                  </td>
                  <td>
                    {user.role !== 'admin' && user.is_active && (
                      <>
                        <button 
                          className="action-btn btn-accept"
                          onClick={() => {
                            setEditModal({ show: true, user });
                            setEditUsername(user.username);
                            setEditEmail(user.email);
                          }}
                        >
                          ✏️ Bearbeiten
                        </button>
                        <button 
                          className="action-btn btn-delete"
                          onClick={() => setDeleteModal({ show: true, user })}
                        >
                          🗑️ Löschen
                        </button>
                      </>
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
            <h3 className="modal-title">Benutzer löschen</h3>
            <p>
              Möchten Sie den Benutzer <strong>{deleteModal.user?.username}</strong> wirklich löschen?
            </p>
            
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
                  setDeleteModal({ show: false, user: null });
                  setDeleteReason('');
                }}
              >
                Abbrechen
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteUser}
                disabled={!deleteReason.trim()}
              >
                Benutzer löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Benutzer bearbeiten</h3>
            <p>
              Bearbeiten Sie die Daten für <strong>{editModal.user?.username}</strong>:
            </p>
            
            <div className="form-group">
              <label className="form-label">Benutzername:</label>
              <input
                type="text"
                className="form-input"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Neuer Benutzername"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-Mail:</label>
              <input
                type="email"
                className="form-input"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Neue E-Mail-Adresse"
                required
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setEditModal({ show: false, user: null });
                  setEditUsername('');
                  setEditEmail('');
                }}
              >
                Abbrechen
              </button>
              <button 
                className="btn-accept"
                onClick={handleEditUser}
                disabled={!editUsername.trim() || !editEmail.trim()}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;