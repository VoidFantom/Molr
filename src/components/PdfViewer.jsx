import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, ArrowLeft, FileText } from 'lucide-react';

export default function PdfViewer({ pdfKey, title, onClose }) {
  if (!pdfKey) return null;

  const { data } = supabase.storage.from('cheatsheets').getPublicUrl(pdfKey);
  const pdfUrl = data?.publicUrl;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div 
        className="modal-content flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '900px', 
          width: '95vw', 
          height: '90vh', 
          padding: 0,
          overflow: 'hidden',
          borderRadius: '1rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header bar */}
        <div 
          className="flex justify-between items-center px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="icon-btn p-1"
              type="button"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
              <FileText size={20} className="text-primary" />
              <span>{title || "Cheat Sheet"}</span>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="icon-btn p-1"
            type="button"
            aria-label="Close PDF Viewer"
          >
            <X size={20} />
          </button>
        </div>

        {/* PDF iframe container */}
        <div className="flex-1 w-full" style={{ backgroundColor: 'var(--bg-color)' }}>
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              title={title || "Cheat Sheet PDF"}
              className="w-full h-full border-none"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Unable to load PDF URL.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
