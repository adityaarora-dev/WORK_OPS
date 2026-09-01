import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="topbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <div className="topbar-title-group">
          <span className="topbar-context-badge">HR Management System</span>
        </div>
      </div>

      <div className="topbar-right">
        <Link to="/" className="topbar-link-badge" title="Stage 1 System Connection Health">
          <span className="health-dot">●</span>
          <span>System Health</span>
        </Link>

        {/* User Pill */}
        <div className="topbar-user-menu">
          <span className={`topbar-role-badge badge-${user?.role}`}>
            {user?.role?.toUpperCase()}
          </span>
          <span className="topbar-user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <button className="topbar-signout-btn" onClick={handleLogout} title="Sign Out">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
