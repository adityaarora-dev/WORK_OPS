import React from 'react';
import { Link } from 'react-router-dom';

export const PlaceholderModulePage = ({
  title,
  icon = '📦',
  stage = 'Stage 4+',
  description = 'This business module interface is scaffolded and will be connected to full-stack API workflows in the subsequent stage.',
  features = [],
}) => {
  return (
    <div className="placeholder-module-wrapper">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            <span>{icon}</span> {title}
          </h1>
          <p className="page-sub-title">{description}</p>
        </div>
        <div className="header-actions">
          <span className="future-stage-pill">Scheduled for {stage}</span>
        </div>
      </div>

      <div className="placeholder-card-hero">
        <div className="placeholder-icon-large">{icon}</div>
        <h2>{title} Management</h2>
        <p className="placeholder-hero-text">
          The navigation routing, layout integration, and role permissions for <strong>{title}</strong>{' '}
          are active in Stage 2.5. Full database persistence and transaction processing will be
          implemented in {stage}.
        </p>

        {features.length > 0 && (
          <div className="feature-checklist">
            <h4>Planned Capabilities:</h4>
            <div className="feature-grid">
              {features.map((feat, idx) => (
                <div key={idx} className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="placeholder-actions">
          <Link to="/dashboard" className="btn-primary">
            ← Back to Dashboard
          </Link>
          <Link to="/employees" className="btn-secondary">
            View Employee Directory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderModulePage;
