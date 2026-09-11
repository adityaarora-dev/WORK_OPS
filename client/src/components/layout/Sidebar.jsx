import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Building2, X, LogOut, ArrowLeftRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavigationSectionsForRole } from '../navigation/navConfig';
import ThemeToggle from '../common/ThemeToggle';

const ROLE_THEMES = {
  admin: {
    title: 'Governance Suite',
    badgeText: 'ADMIN',
    tagColor: 'var(--role-admin)',
    avatarGradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    portalName: 'Admin Control Center',
  },
  hr: {
    title: 'People Operations',
    badgeText: 'HR LEAD',
    tagColor: 'var(--role-hr)',
    avatarGradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    portalName: 'HR & Workforce Suite',
  },
  manager: {
    title: 'Team Leader',
    badgeText: 'MANAGER',
    tagColor: 'var(--role-manager)',
    avatarGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    portalName: 'Management Console',
  },
  employee: {
    title: 'Self-Service',
    badgeText: 'EMPLOYEE',
    tagColor: 'var(--role-employee)',
    avatarGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    portalName: 'Workforce Portal',
  },
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || 'employee').toLowerCase();
  const roleTheme = ROLE_THEMES[userRole] || ROLE_THEMES.employee;
  const sections = getNavigationSectionsForRole(userRole);

  const handleLogout = async () => {
    await logout();
    navigate(`/${userRole}/login`);
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

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`} data-role={userRole}>
        {/* Workspace Branding */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" style={{ textDecoration: 'none' }}>
            <div
              className="brand-icon-box"
              style={{
                background: roleTheme.avatarGradient,
                color: '#ffffff',
                boxShadow: `0 2px 8px -1px ${roleTheme.tagColor}44`,
              }}
            >
              <Building2 size={18} strokeWidth={2.2} />
            </div>
            <div className="brand-info">
              <span className="brand-title">Enterprise HRMS</span>
              <span className="brand-subtitle">{roleTheme.title}</span>
            </div>
          </Link>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* User Role Card */}
        <div className="sidebar-user-card" style={{ position: 'relative' }}>
          <div
            className="sidebar-avatar"
            style={{
              background: roleTheme.avatarGradient,
              boxShadow: `0 0 10px ${roleTheme.tagColor}33`,
            }}
          >
            {getInitials()}
          </div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name" title={`${user?.firstName} ${user?.lastName}`}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className={`role-badge badge-${userRole}`}>
                <span className="badge-dot" style={{ backgroundColor: roleTheme.tagColor }} />
                {roleTheme.badgeText}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-wrapper">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="sidebar-section-group" style={{ marginBottom: '14px' }}>
              <div className="nav-section-title">{section.title}</div>
              <nav className="sidebar-nav">
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path.includes('/dashboard')}
                      className={({ isActive }) =>
                        `sidebar-nav-item group ${isActive ? 'nav-item-active' : ''}`
                      }
                      onClick={onClose}
                    >
                      <span className="nav-item-icon transition-transform duration-150 group-hover:scale-110">
                        {IconComponent && <IconComponent size={16} strokeWidth={1.8} />}
                      </span>
                      <span className="nav-item-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          {/* Theme Switcher Segmented Control */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <ThemeToggle />
          </div>

          {/* System Health Chip */}
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              <span style={{ fontWeight: 500 }}>System Live</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.7 }}>SOC-2</span>
          </div>

          {/* Quick Switch to Role Portal */}
          <Link
            to="/"
            className="sidebar-footer-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              padding: '7px 10px',
              borderRadius: '6px',
              color: '#94a3b8',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeftRight size={14} />
            <span>Switch Role Portal</span>
          </Link>

          {/* Sign Out Button */}
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign out of your session"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              padding: '7px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '2px',
            }}
          >
            <LogOut size={14} strokeWidth={1.8} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
