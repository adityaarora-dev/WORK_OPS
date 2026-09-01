import React from 'react';
import { useHealth } from '../hooks/useHealth';
import StatusBadge from '../components/StatusBadge';

export const HomePage = () => {
  const { data, loading, error, refresh } = useHealth();

  // Backend is reachable if we got data or got an error response with data
  const isBackendConnected = !error && Boolean(data);

  // Database status from the health response
  const dbStatus = data?.database || 'disconnected';
  const isDbConnected = dbStatus === 'connected';

  return (
    <div className="home-page">
      <section className="intro-card">
        <h2>Full-Stack System Integration Status</h2>
        <p className="intro-text">
          Stage 1 establishes the verified communication link across the entire MERN architecture.
        </p>

        {/* Integration pipeline visual */}
        <div className="pipeline-flow">
          <div className="pipeline-step active">
            <span className="step-icon">⚡</span>
            <span className="step-name">React + Vite</span>
            <span className="step-sub">:5173</span>
          </div>
          <div className="pipeline-arrow">➔</div>
          <div className="pipeline-step active">
            <span className="step-icon">🌐</span>
            <span className="step-name">Axios Client</span>
            <span className="step-sub">VITE_API_URL</span>
          </div>
          <div className="pipeline-arrow">➔</div>
          <div className={`pipeline-step ${isBackendConnected ? 'active' : 'inactive'}`}>
            <span className="step-icon">🚀</span>
            <span className="step-name">Express + Node.js</span>
            <span className="step-sub">:5000</span>
          </div>
          <div className="pipeline-arrow">➔</div>
          <div className={`pipeline-step ${isDbConnected ? 'active' : 'inactive'}`}>
            <span className="step-icon">🍃</span>
            <span className="step-name">Mongoose / Atlas</span>
            <span className="step-sub">{dbStatus}</span>
          </div>
        </div>
      </section>

      {/* Main Status Panel */}
      <section className="status-card">
        <div className="status-card-header">
          <h3>Connection Monitor</h3>
          <button
            className="refresh-btn"
            onClick={refresh}
            disabled={loading}
            title="Refresh connection status"
          >
            {loading ? 'Checking...' : '🔄 Refresh Status'}
          </button>
        </div>

        {error ? (
          <div className="error-banner">
            <div className="error-title">⚠️ Backend Connection Error</div>
            <p className="error-message">{error}</p>
            <p className="error-hint">
              Ensure Express is started with <code>npm run dev</code> inside <code>server/</code> or <code>npm run dev</code> from root.
            </p>
          </div>
        ) : null}

        <div className="status-grid">
          {/* Backend Status */}
          <StatusBadge
            label="Backend Service"
            status={
              loading
                ? 'loading'
                : isBackendConnected
                ? 'connected'
                : 'error'
            }
            detail={isBackendConnected ? 'Express HTTP Server (Port 5000)' : 'Unreachable'}
          />

          {/* Database Status */}
          <StatusBadge
            label="Database Service"
            status={
              loading
                ? 'loading'
                : isDbConnected
                ? 'connected'
                : 'disconnected'
            }
            detail={
              isDbConnected
                ? 'MongoDB Atlas Cluster Connected'
                : 'MongoDB Atlas Disconnected'
            }
          />
        </div>

        {/* Meta details if connected */}
        {data && (
          <div className="status-meta">
            <div className="meta-row">
              <span className="meta-key">API Response:</span>
              <span className="meta-value">{data.message}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Server Timestamp:</span>
              <span className="meta-value">{data.timestamp}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Server Uptime:</span>
              <span className="meta-value">{data.uptime}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Environment:</span>
              <span className="meta-value">{data.environment}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Health Endpoint:</span>
              <span className="meta-value">
                <code>GET /api/health</code>
              </span>
            </div>
          </div>
        )}

        {/* Helpful instructions if DB is disconnected */}
        {!isDbConnected && isBackendConnected && (
          <div className="info-box">
            <h4>🍃 MongoDB Atlas Connection Notice</h4>
            <p>
              The Express backend is running and responding to API requests. To establish the live MongoDB Atlas connection:
            </p>
            <ol>
              <li>Open <code>server/.env</code></li>
              <li>Set <code>MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@&lt;cluster&gt;.mongodb.net/hr_db?retryWrites=true&w=majority</code></li>
              <li>Save the file (nodemon will automatically reload or restart the server)</li>
              <li>Click <strong>"Refresh Status"</strong> above to verify.</li>
            </ol>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
