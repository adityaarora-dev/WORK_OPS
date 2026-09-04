import React from 'react';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && icon.$$typeof)
  ) {
    const IconComponent = icon;
    return <IconComponent size={18} />;
  }
  return icon;
};

export const StatCard = ({ title, value, icon, subtitle, trend = null, variant = null }) => {
  // Infer tactical color variant if not explicitly provided
  const inferVariant = () => {
    if (variant) return variant;
    const t = (title || '').toLowerCase();
    if (t.includes('present') || t.includes('paid') || t.includes('approved') || t.includes('active')) {
      return 'success';
    }
    if (t.includes('pending') || t.includes('late') || t.includes('absent') || t.includes('review')) {
      return 'warning';
    }
    if (t.includes('leave') || t.includes('rate') || t.includes('compliance') || t.includes('vouchers')) {
      return 'info';
    }
    return 'primary';
  };

  const activeVariant = inferVariant();

  return (
    <div className={`stat-card stat-card-${activeVariant}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && (
          <div className={`stat-card-icon stat-card-icon-${activeVariant}`}>
            {renderIcon(icon)}
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {trend && (
          <span className={`stat-card-trend ${trend.positive ? 'trend-up' : 'trend-down'}`}>
            {trend.positive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
