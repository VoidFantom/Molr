import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="card w-full max-w-sm" 
        style={{ padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-6 text-secondary" style={{ color: 'var(--text-main)' }}>
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="btn font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-danger px-4 py-2 rounded-lg font-medium"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
