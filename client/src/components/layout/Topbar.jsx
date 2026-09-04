import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Bell, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notificationService';

export const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  // Load unread notification count
  const fetchUnread = async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s background poll
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on location change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const toggleDropdown = async () => {
    const nextState = !dropdownOpen;
    setDropdownOpen(nextState);

    if (nextState) {
      setLoadingNotifs(true);
      try {
        const res = await getNotifications({ limit: 5 });
        setNotifications(res?.notifications || []);
        setUnreadCount(res?.unreadCount || 0);
      } catch (_) {
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkItemRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleLogout = async () => {
    const role = (user?.role || 'employee').toLowerCase();
    await logout();
    navigate(`/${role}/login`);
  };

  // Human-readable section name from current path
  const getContextName = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Platform Overview';
    if (path.startsWith('/hr/dashboard')) return 'HR Overview';
    if (path.startsWith('/manager/dashboard')) return 'Team Console';
    if (path.startsWith('/employee/dashboard')) return 'My Workspace';
    if (path.startsWith('/admin/users')) return 'User Governance';
    if (path.startsWith('/employees')) return 'Employee Directory';
    if (path.startsWith('/departments')) return 'Departments';
    if (path.startsWith('/attendance')) return 'Time & Attendance';
    if (path.startsWith('/leave')) return 'Time Off & Leaves';
    if (path.startsWith('/payroll')) return 'Monthly Payroll';
    if (path.startsWith('/documents')) return 'Document Vault';
    if (path.startsWith('/performance')) return 'Performance Management';
    if (path.startsWith('/recruitment')) return 'Recruitment Hub';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/notifications')) return 'Notification Center';
    if (path.startsWith('/audit-logs')) return 'Security & Audit Logs';
    if (path.startsWith('/system-admin')) return 'System Configuration';
    if (path.startsWith('/profile')) return 'User Profile';
    if (path.startsWith('/dashboard')) return 'Overview Dashboard';
    return 'Workspace';
  };

  const getInitials = () => {
    if (!user) return 'HR';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="topbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="topbar-title-block">
          <h1 className="topbar-page-heading">{getContextName()}</h1>
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-root">HRMS</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{getContextName()}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Notifications Bell & Popover */}
        <div className="topbar-notification-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="topbar-notification-btn"
            onClick={toggleDropdown}
            aria-label="Open notifications"
            title="System notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={handleMarkAll}
                    style={{ fontSize: '11px', color: 'var(--primary)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-dropdown-body">
                {loadingNotifs ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => navigate('/notifications')}
                    >
                      {!n.read && <div className="notification-item-unread-dot" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost btn-icon"
                          title="Mark as read"
                          onClick={(e) => handleMarkItemRead(e, n._id)}
                          style={{ padding: '2px', color: 'var(--text-muted)' }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="notification-dropdown-footer">
                <Link
                  to="/notifications"
                  className="btn btn-sm btn-ghost"
                  style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar with Ring & Click to Profile */}
        <Link
          to="/profile"
          className="topbar-avatar-link"
          title={`${user?.firstName} ${user?.lastName} (${user?.role?.toUpperCase()}) — View Profile`}
        >
          <div className="topbar-avatar-ring">{getInitials()}</div>
        </Link>

        {/* Clean Minimal Sign Out */}
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={handleLogout}
          title="Sign out of your session"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
