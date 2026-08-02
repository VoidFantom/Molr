import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LogoutModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content text-center max-w-[400px] rounded-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="section-header mb-3">Log Out</h2>
        <p className="text-secondary mb-8">Are you sure you want to log out of Molr?</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className="btn btn-danger solid flex-1"
          >
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  );
}
