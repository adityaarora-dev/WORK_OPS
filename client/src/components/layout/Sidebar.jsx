import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getNavigationForRole } from '../navigation/navConfig';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = getNavigationForRole(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">🏢</span>
            <div className="brand-info">
              <span className="brand-title">HRMS Portal</span>
              <span className="brand-subtitle">Enterprise Suite</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        {/* User Role Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {user?.role === 'admin' && '👑'}
            {user?.role === 'hr' && '💼'}
            {user?.role === 'manager' && '👔'}
            {user?.role === 'employee' && '👤'}
          </div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <span className={`role-badge badge-${user?.role}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="sidebar-nav-wrapper">
          <div className="nav-section-title">MAIN NAVIGATION</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'nav-item-active' : ''}`
                }
                onClick={onClose}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="sidebar-footer">
          <NavLink to="/" className="sidebar-footer-link" onClick={onClose}>
            <span>🩺</span>
            <span>System Health</span>
          </NavLink>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
