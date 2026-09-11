import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Bell, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notificationService';
import ThemeToggle from '../common/ThemeToggle';

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
            <ChevronRight size={11} className="text-[var(--text-muted)]" />
            <span className="breadcrumb-current">{getContextName()}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Centralized Theme Toggle (Segmented Pill) */}
        <ThemeToggle variant="segmented" />

        {/* Notifications Bell & Popover */}
        <div className="topbar-notification-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="topbar-notification-btn"
            onClick={toggleDropdown}
            aria-label="Open notifications"
            title="System notifications"
          >
            <Bell size={17} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="notification-badge tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-[var(--primary)] hover:underline cursor-pointer"
                    onClick={handleMarkAll}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-dropdown-body">
                {loadingNotifs ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => navigate('/notifications')}
                    >
                      {!n.read && <div className="notification-item-unread-dot" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">
                          {n.title}
                        </div>
                        <div className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1 tabular-nums">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost btn-icon"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          onClick={(e) => handleMarkItemRead(e, n._id)}
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
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center justify-center w-full py-1"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar with Ring & Link to Profile */}
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
          className="btn btn-ghost btn-icon hover:text-[var(--danger)]"
          onClick={handleLogout}
          title="Sign out of your session"
          aria-label="Sign out"
        >
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
