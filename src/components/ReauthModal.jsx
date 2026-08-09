import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  GoogleAuthProvider, 
  reauthenticateWithPopup 
} from 'firebase/auth';

export default function ReauthModal({ isOpen, onClose, onAuthenticated, title, message }) {
  const { currentUser } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isGoogleProvider = currentUser?.providerData?.some(p => p.providerId === 'google.com');

  const handleReauth = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isGoogleProvider) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
        onAuthenticated();
      } else {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        onAuthenticated();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="card w-full max-w-sm" 
        style={{ padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-primary" />
            <h2 className="text-lg font-bold">{title || "Re-authenticate"}</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-6 text-secondary" style={{ color: 'var(--text-main)' }}>
          {message || "Please verify your identity to continue this sensitive action."}
        </p>

        {error && (
          <div className="mb-4 text-xs font-medium p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isGoogleProvider ? (
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={onClose}
              disabled={loading}
              className="btn font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleReauth}
              disabled={loading}
              className="btn btn-primary px-4 py-2 rounded-lg font-medium"
            >
              {loading ? 'Verifying...' : 'Sign in with Google'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleReauth}>
            <label className="label">Current Password</label>
            <input 
              type="password" 
              required
              className="input mb-6" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading || !password}
                className="btn btn-primary px-4 py-2 rounded-lg font-medium"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
