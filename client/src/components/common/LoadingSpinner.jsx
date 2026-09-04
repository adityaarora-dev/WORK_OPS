import React from 'react';

export const LoadingSpinner = ({ message = 'Loading content...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
