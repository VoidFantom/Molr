import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page-container">
          <AlertTriangle size={80} className="floating-icon" style={{ color: 'var(--danger)' }} />
          <h1 className="page-title mb-4">Something went wrong</h1>
          <p className="text-secondary text-muted mb-8 max-w-md">
            We encountered an unexpected error. Try refreshing the page to see if that helps.
          </p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
