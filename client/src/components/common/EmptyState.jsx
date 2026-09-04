import React from 'react';
import { Inbox } from 'lucide-react';

const renderIcon = (icon) => {
  if (!icon) return <Inbox size={28} />;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && icon.$$typeof)
  ) {
    const IconComponent = icon;
    return <IconComponent size={28} />;
  }
  return icon;
};

export const EmptyState = ({
  icon = null,
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  action = null,
  actionText = null,
  onAction = null,
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{renderIcon(icon)}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
      {!action && actionText && onAction && (
        <div className="empty-state-action">
          <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
