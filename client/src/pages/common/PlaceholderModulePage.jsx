import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Layers, Users } from 'lucide-react';

const renderIcon = (icon) => {
  if (!icon) return <Layers size={20} />;
  if (React.isValidElement(icon)) return icon;
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && icon.$$typeof)
  ) {
    const IconComponent = icon;
    return <IconComponent size={20} />;
  }
  return icon;
};

export const PlaceholderModulePage = ({
  title,
  icon = null,
  stage = 'Upcoming Phase',
  description = 'This business module is scaffolded and will be connected to full-stack API workflows in the roadmap.',
  features = [],
}) => {
  return (
    <div className="placeholder-module-wrapper">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">{title}</h1>
          <p className="page-sub-title">{description}</p>
        </div>
        <div className="header-actions">
          <span className="badge badge-info">{stage}</span>
        </div>
      </div>

      <div className="panel-card" style={{ maxWidth: '800px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderIcon(icon)}
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{title} Roadmap Module</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Navigation route and authorization clearance verified
            </p>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          The routing, layout integration, and role permissions for <strong>{title}</strong> are active.
          Full transaction processing, data persistence, and analytics views will be integrated in {stage}.
        </p>

        {features.length > 0 && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              marginBottom: '24px',
            }}
          >
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Planned Functional Scope
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
              }}
            >
              {features.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>
          <Link to="/employees" className="btn btn-secondary">
            <Users size={14} />
            <span>Workforce Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderModulePage;
