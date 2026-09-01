import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo-group-link">
          <div className="logo-icon">🏢</div>
          <div>
            <h1 className="logo-title">HR Management System</h1>
            <p className="logo-subtitle">Stage 2 — Authentication & Authorization</p>
          </div>
        </Link>

        <nav className="header-nav">
          <Link to="/" className="nav-link">
            System Health
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
          ) : null}

          {isAuthenticated && user ? (
            <div className="header-user-info">
              <span className={`user-role-badge badge-${user.role}`}>
                {user.role?.toUpperCase()}
              </span>
              <span className="user-name">
                {user.firstName} {user.lastName}
              </span>
              <button className="header-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary header-login-btn">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
