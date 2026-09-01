import React from 'react';

/**
 * StatusBadge component displaying operational status with colored indicator.
 *
 * @param {{
 *   label: string,
 *   status: 'connected' | 'disconnected' | 'connecting' | 'loading' | 'error',
 *   detail?: string
 * }} props
 */
export const StatusBadge = ({ label, status, detail }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'connected':
        return 'status-badge status-badge-success';
      case 'connecting':
      case 'loading':
        return 'status-badge status-badge-warning';
      case 'disconnected':
      case 'error':
      default:
        return 'status-badge status-badge-danger';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'loading':
        return 'Checking...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Unavailable';
      default:
        return status;
    }
  };

  return (
    <div className="status-item">
      <div className="status-label">{label}</div>
      <div className="status-indicator-group">
        <span className={getBadgeClass()}>
          <span className="status-dot"></span>
          {getStatusText()}
        </span>
        {detail && <span className="status-detail">{detail}</span>}
      </div>
    </div>
  );
};

export default StatusBadge;
