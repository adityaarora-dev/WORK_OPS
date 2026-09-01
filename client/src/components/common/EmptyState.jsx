import React from 'react';

export const EmptyState = ({
  icon = '📂',
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  action = null,
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
