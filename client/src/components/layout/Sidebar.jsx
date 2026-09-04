import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Building2, X, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavigationForRole } from '../navigation/navConfig';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = getNavigationForRole(user?.role);

  const handleLogout = async () => {
    const role = (user?.role || 'employee').toLowerCase();
    await logout();
    navigate(`/${role}/login`);
  };

  const getInitials = () => {
    if (!user) return 'HR';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Workspace Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <Building2 size={18} strokeWidth={2.2} />
            </div>
            <div className="brand-info">
              <span className="brand-title">Enterprise HR</span>
              <span className="brand-subtitle">Management Suite</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* User Role Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">{getInitials()}</div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <span className={`role-badge badge-${user?.role}`}>
              <span className="badge-dot"></span>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-wrapper">
          <div className="nav-section-title">Navigation</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'nav-item-active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="nav-item-icon">
                    {IconComponent && <IconComponent size={16} strokeWidth={1.8} />}
                  </span>
                  <span className="nav-item-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={15} strokeWidth={1.8} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
