import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && icon.$$typeof)
  ) {
    const IconComponent = icon;
    return <IconComponent size={16} strokeWidth={1.8} />;
  }
  return icon;
};

export const StatCard = ({ title, value, icon, subtitle, trend = null, variant = null, className = '' }) => {
  // Infer tactical semantic color if needed
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
    <div className={`stat-card stat-card-${activeVariant} group ${className}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && (
          <div className={`stat-card-icon stat-card-icon-${activeVariant}`}>
            {renderIcon(icon)}
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value tabular-nums">{value}</div>
        {trend && (
          <span className={`stat-card-trend tabular-nums ${trend.positive ? 'trend-up' : 'trend-down'}`}>
            {trend.positive ? (
              <TrendingUp size={12} strokeWidth={2.2} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.2} />
            )}
            <span>{trend.text}</span>
          </span>
        )}
      </div>

      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
