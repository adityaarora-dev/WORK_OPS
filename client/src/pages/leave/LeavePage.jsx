import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getLeaves,
  getLeaveSummary,
  reviewLeave,
  cancelLeave,
} from '../../services/leaveService';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';

export const LeavePage = () => {
  const { user } = useAuth();
  const canReview = ['admin', 'hr', 'manager'].includes(user?.role?.toLowerCase());

  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Action processing & confirmation modal
  const [processingId, setProcessingId] = useState(null);
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    leaveId: null,
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getLeaves({
        page,
        limit: 10,
        status: selectedStatus,
        leaveType: selectedType,
      }),
      getLeaveSummary().catch(() => ({ data: null })),
    ])
      .then(([leaveRes, sumRes]) => {
        if (isMounted) {
          setLeaves(leaveRes.data || []);
          setPagination(leaveRes.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          if (sumRes.data) setSummary(sumRes.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load leave requests');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, selectedStatus, selectedType]);

  const reloadData = () => {
    setLoading(true);
    getLeaves({
      page,
      limit: 10,
      status: selectedStatus,
      leaveType: selectedType,
    })
      .then((res) => {
        setLeaves(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load leave requests');
      })
      .finally(() => setLoading(false));

    getLeaveSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {});
  };

  const handleReview = async (id, status) => {
    setProcessingId(id);
    try {
      await reviewLeave(id, status, `Reviewed by ${user?.firstName} ${user?.lastName}`);
      toast.success(`Leave request has been marked as ${status}.`);
      reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update leave.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.leaveId) return;
    setProcessingId(cancelModal.leaveId);
    try {
      await cancelLeave(cancelModal.leaveId);
      toast.success('Leave request cancelled successfully.');
      setCancelModal({ isOpen: false, leaveId: null });
      reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel leave.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="employee-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Leave & Time-Off Management</h1>
          <p className="page-sub-title">
            Request time-off, monitor balances, and review departmental approval queues.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/leave/apply" className="btn btn-primary">
            <Plus size={15} />
            <span>Apply for Leave</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Pending Requests"
          value={summary?.pending ?? 0}
          icon={<Clock size={16} />}
          subtitle="Awaiting authorization"
        />
        <StatCard
          title="Approved Leaves"
          value={summary?.approved ?? 0}
          icon={<CheckCircle2 size={16} />}
          subtitle="Scheduled time-off"
        />
        <StatCard
          title="Declined"
          value={summary?.rejected ?? 0}
          icon={<XCircle size={16} />}
          subtitle="Rejected applications"
        />
        <StatCard
          title="Cancelled"
          value={summary?.cancelled ?? 0}
          icon={<Ban size={16} />}
          subtitle="Withdrawn by applicant"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card">
        <div className="dropdown-filters">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Leave Types</option>
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="earned">Earned Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="other">Other</option>
          </select>

          {(selectedStatus || selectedType) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedStatus('');
                setSelectedType('');
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="table-card">
        {loading ? (
          <LoadingSpinner message="Loading leave applications..." />
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={reloadData}
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="No leave requests found"
            description="No applications matching the selected criteria."
            action={
              <Link to="/leave/apply" className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Submit First Request</span>
              </Link>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((item) => {
                  const emp = item.employee || {};
                  const start = item.startDate
                    ? new Date(item.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';
                  const end = item.endDate
                    ? new Date(item.endDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const isOwnRequest =
                    user?.id && (emp.user === user.id || emp._id === user.id);

                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="avatar-circle">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div>
                            <div className="cell-primary">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="cell-secondary">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {item.leaveType} Leave
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>
                          {start} – {end}
                        </span>
                      </td>
                      <td>
                        <span className="code-pill">
                          {item.totalDays} {item.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="cell-secondary"
                          style={{
                            maxWidth: '180px',
                            display: 'inline-block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.reason || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag status-${item.status}`}>
                          <span className="badge-dot"></span>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          {canReview && item.status === 'pending' && !isOwnRequest && (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleReview(item._id, 'approved')}
                                disabled={processingId === item._id}
                                title="Approve Request"
                                style={{ color: 'var(--success)' }}
                              >
                                <Check size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleReview(item._id, 'rejected')}
                                disabled={processingId === item._id}
                                title="Decline Request"
                                style={{ color: 'var(--danger)' }}
                              >
                                <X size={14} />
                                <span>Decline</span>
                              </button>
                            </>
                          )}

                          {item.status === 'pending' && (isOwnRequest || user?.role === 'employee') && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setCancelModal({ isOpen: true, leaveId: item._id })}
                              disabled={processingId === item._id}
                              title="Cancel Request"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Ban size={14} />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && leaves.length > 0 && (
          <div className="table-pagination">
            <span>
              Showing {leaves.length} of {pagination.total} requests
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span style={{ padding: '0 8px', fontWeight: 500 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Request Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this pending leave request? This action cannot be reversed."
        confirmText="Cancel Request"
        cancelText="Keep Request"
        isDestructive={true}
        loading={Boolean(processingId)}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModal({ isOpen: false, leaveId: null })}
      />
    </div>
  );
};

export default LeavePage;
