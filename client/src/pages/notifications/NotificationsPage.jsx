import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Calendar,
  Award,
  Banknote,
  UserPlus,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUnread, setFilterUnread] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotificationsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications({
        read: filterUnread ? false : '',
        page,
        limit: 20,
      });
      setNotifications(res?.notifications || []);
      setPagination(res?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [filterUnread, page]);

  useEffect(() => {
    fetchNotificationsList();
  }, [fetchNotificationsList]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date() } : n))
      );
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error(err.message || 'Failed to update notification');
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date() })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'leave':
        return <Calendar size={18} style={{ color: 'var(--primary)' }} />;
      case 'performance':
        return <Award size={18} style={{ color: 'var(--warning)' }} />;
      case 'payroll':
        return <Banknote size={18} style={{ color: 'var(--success)' }} />;
      case 'recruitment':
        return <UserPlus size={18} style={{ color: 'var(--info)' }} />;
      case 'document':
        return <FileText size={18} style={{ color: 'var(--secondary)' }} />;
      case 'attendance':
        return <Clock size={18} style={{ color: 'var(--primary)' }} />;
      default:
        return <Bell size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div className="notifications-page" style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Notification Center</h1>
          <p className="page-sub-title">
            Corporate alerts, automated approvals, reviews, and workflow status changes
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleMarkAll}
            disabled={markingAll || notifications.every((n) => n.read)}
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn btn-sm ${!filterUnread ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setFilterUnread(false);
            setPage(1);
          }}
        >
          All Notifications
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterUnread ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setFilterUnread(true);
            setPage(1);
          }}
        >
          Unread Only
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading your notification feed..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="No Notifications Found"
          description={
            filterUnread
              ? 'You have caught up on all pending notifications.'
              : 'There are no notifications recorded in your account.'
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifications.map((item) => (
            <div
              key={item._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: item.read ? 'var(--bg-surface)' : 'rgba(37, 99, 235, 0.04)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {getTypeIcon(item.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  {!item.read && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                      }}
                    >
                      New
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginLeft: 'auto',
                    }}
                  >
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: '0 0 8px 0',
                  }}
                >
                  {item.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {item.type}
                  </span>

                  {!item.read && (
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => handleMarkRead(item._id)}
                      style={{ fontSize: '11px', color: 'var(--primary)' }}
                    >
                      <Check size={12} /> Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-surface-subtle)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
