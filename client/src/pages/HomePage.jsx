import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Globe,
  Server,
  Database,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import StatusBadge from '../components/StatusBadge';

export const HomePage = () => {
  const { data, loading, error, refresh } = useHealth();

  const isBackendConnected = !error && Boolean(data);
  const dbStatus = data?.database || 'disconnected';
  const isDbConnected = dbStatus === 'connected';

  return (
    <div className="home-page" style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 className="page-main-title">Full-Stack System Integration</h1>
          <p className="page-sub-title">
            Architecture health monitor, backend connectivity, and MongoDB Atlas status.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/login" className="btn btn-primary">
            <span>Access Workspace</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Integration Pipeline Card */}
      <section className="card card-padding" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Verified Communication Pipeline</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          End-to-end telemetry verifying HTTP communication, CORS negotiation, and database connectivity.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Step 1: React */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Zap size={16} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '13px' }}>React 19 + Vite</strong>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Port 5173 (Client)</span>
          </div>

          {/* Step 2: Axios */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Globe size={16} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '13px' }}>Axios Client</strong>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/api/health</span>
          </div>

          {/* Step 3: Express */}
          <div
            style={{
              padding: '16px',
              backgroundColor: isBackendConnected ? 'var(--success-subtle)' : 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${isBackendConnected ? 'var(--success-border)' : 'var(--border-default)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Server
                size={16}
                style={{ color: isBackendConnected ? 'var(--success-text)' : 'var(--text-muted)' }}
              />
              <strong style={{ fontSize: '13px' }}>Express 5</strong>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isBackendConnected ? 'Port 5000 (Connected)' : 'Port 5000 (Standby)'}
            </span>
          </div>

          {/* Step 4: MongoDB Atlas */}
          <div
            style={{
              padding: '16px',
              backgroundColor: isDbConnected ? 'var(--success-subtle)' : 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${isDbConnected ? 'var(--success-border)' : 'var(--border-default)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Database
                size={16}
                style={{ color: isDbConnected ? 'var(--success-text)' : 'var(--text-muted)' }}
              />
              <strong style={{ fontSize: '13px' }}>MongoDB Atlas</strong>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isDbConnected ? 'Cluster Ready' : 'Standby'}
            </span>
          </div>
        </div>
      </section>

      {/* Main Status Panel */}
      <section className="panel-card">
        <div className="panel-header">
          <h3>Connection Telemetry</h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Inspecting...' : 'Refresh Status'}</span>
          </button>
        </div>

        {error ? (
          <div className="action-banner banner-error" style={{ margin: '16px 20px 0' }}>
            <AlertCircle size={16} />
            <div>
              <strong>Backend Connection Unavailable:</strong> {error}
            </div>
          </div>
        ) : null}

        <div style={{ padding: '20px' }}>
          <div className="system-metrics-list" style={{ padding: 0 }}>
            <div className="metric-item">
              <span className="metric-label">Backend HTTP Server</span>
              <StatusBadge
                status={loading ? 'loading' : isBackendConnected ? 'connected' : 'error'}
                detail={isBackendConnected ? 'Port 5000' : 'Offline'}
              />
            </div>

            <div className="metric-item">
              <span className="metric-label">Cloud Database Storage</span>
              <StatusBadge
                status={loading ? 'loading' : isDbConnected ? 'connected' : 'disconnected'}
                detail={isDbConnected ? 'Atlas Cluster (hr_db)' : 'Disconnected'}
              />
            </div>

            {data?.uptime && (
              <div className="metric-item">
                <span className="metric-label">Server Uptime</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{data.uptime}</span>
              </div>
            )}

            {data?.timestamp && (
              <div className="metric-item">
                <span className="metric-label">Telemetry Timestamp</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(data.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
