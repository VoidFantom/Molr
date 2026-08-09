import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page-container">
      <Compass size={80} className="floating-icon" />
      <h1 className="page-title mb-4">404 - Not Found</h1>
      <p className="text-secondary text-muted mb-8 max-w-md">
        Looks like you've wandered off the path. The page you are looking for doesn't exist or has been moved.
      </p>
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-primary"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
