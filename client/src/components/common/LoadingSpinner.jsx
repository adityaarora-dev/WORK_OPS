import React from 'react';

export const LoadingSpinner = ({ message = 'Loading content...' }) => {
  return (
    <div className="loading-state-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
