import React from 'react';

export const StatCard = ({ title, value, icon, subtitle, color = 'blue', trend = null }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-icon">{icon}</span>
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
