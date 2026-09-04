import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const ActionQueue = ({ title = 'Action Needed Today', subtitle = 'Tasks requiring your prompt review', items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="action-queue-wrapper">
      <div className="action-queue-header">
        <div className="action-queue-title-wrap">
          <span className="action-queue-dot"></span>
          <h3 className="action-queue-title">{title}</h3>
          <span className="action-queue-count">{items.length} Pending</span>
        </div>
        <span className="action-queue-subtitle">{subtitle}</span>
      </div>

      <div className="action-queue-grid">
        {items.map((item, idx) => {
          const IconComponent = item.icon || AlertCircle;
          return (
            <div key={idx} className={`action-queue-card action-card-${item.variant || 'primary'}`}>
              <div className="action-card-left">
                <div className={`action-card-icon-box action-icon-${item.variant || 'primary'}`}>
                  <IconComponent size={16} />
                </div>
                <div className="action-card-info">
                  <div className="action-card-heading">
                    <span className="action-card-title">{item.title}</span>
                    {item.badge && (
                      <span className={`action-card-badge badge-${item.variant || 'primary'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="action-card-desc">{item.description}</p>
                </div>
              </div>

              <div className="action-card-right">
                {item.to ? (
                  <Link to={item.to} className="btn btn-primary btn-sm action-card-btn">
                    <span>{item.actionLabel || 'Review'}</span>
                    <ArrowRight size={13} />
                  </Link>
                ) : item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="btn btn-primary btn-sm action-card-btn"
                  >
                    <span>{item.actionLabel || 'Action'}</span>
                    <ArrowRight size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActionQueue;
