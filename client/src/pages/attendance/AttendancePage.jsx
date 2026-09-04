import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getAttendance,
  getAttendanceSummary,
  recordAttendance,
  updateAttendance,
} from '../../services/attendanceService';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const AttendancePage = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Clock in/out state for Employee
  const [processingClock, setProcessingClock] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getAttendance({
        page,
        limit: 10,
        status: selectedStatus,
        date: selectedDate,
      }),
      getAttendanceSummary().catch(() => ({ data: null })),
    ])
      .then(([attRes, sumRes]) => {
        if (isMounted) {
          setRecords(attRes.data || []);
          setPagination(attRes.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          if (sumRes.data) setSummary(sumRes.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load attendance logs');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, selectedStatus, selectedDate]);

  const reloadData = () => {
    setLoading(true);
    getAttendance({
      page,
      limit: 10,
      status: selectedStatus,
      date: selectedDate,
    })
      .then((res) => {
        setRecords(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load attendance logs');
      })
      .finally(() => setLoading(false));

    getAttendanceSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {});
  };

  // Find today's record for this user (if exists)
  const todayRecord = records.find((r) => {
    if (!r.date) return false;
    const recordDate = new Date(r.date).toISOString().split('T')[0];
    const nowDate = new Date().toISOString().split('T')[0];
    return recordDate === nowDate;
  });

  const handleClockIn = async () => {
    setProcessingClock(true);
    try {
      await recordAttendance({
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        status: 'present',
      });
      toast.success('Shift check-in recorded successfully.');
      reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to check in');
    } finally {
      setProcessingClock(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setProcessingClock(true);
    try {
      await updateAttendance(todayRecord._id, {
        checkOut: new Date().toISOString(),
      });
      toast.success('Shift check-out recorded successfully.');
      reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to check out');
    } finally {
      setProcessingClock(false);
    }
  };

  return (
    <div className="employee-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            {isEmployee ? 'My Attendance & Timesheet' : 'Attendance & Time Tracking'}
          </h1>
          <p className="page-sub-title">
            Daily clock-in verification, hours tracking, and attendance compliance.
          </p>
        </div>

        {/* Quick Clock-In / Out widget for Employee */}
        {isEmployee && (
          <div className="header-actions">
            {!todayRecord ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClockIn}
                disabled={processingClock}
              >
                <LogIn size={15} />
                <span>Clock In Today</span>
              </button>
            ) : !todayRecord.checkOut ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClockOut}
                disabled={processingClock}
                style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
              >
                <LogOut size={15} />
                <span>Clock Out</span>
              </button>
            ) : (
              <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
                Shift Completed ({todayRecord.workHours} hrs)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Present Today"
          value={summary?.present ?? 0}
          icon={<CheckCircle2 size={16} />}
          subtitle="On-duty workforce"
        />
        <StatCard
          title="Late Arrivals"
          value={summary?.late ?? 0}
          icon={<Clock size={16} />}
          subtitle="After scheduled start"
        />
        <StatCard
          title="On Scheduled Leave"
          value={summary?.onLeave ?? 0}
          icon={<CalendarDays size={16} />}
          subtitle="Approved PTO today"
        />
        <StatCard
          title="Unexcused Absences"
          value={summary?.absent ?? 0}
          icon={<AlertCircle size={16} />}
          subtitle="Absent without leave"
        />
        <StatCard
          title="Attendance Compliance"
          value={`${summary?.rate ?? 100}%`}
          icon={<TrendingUp size={16} />}
          trend={{ positive: (summary?.rate ?? 100) >= 90, text: 'Target: 95%' }}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card">
        <div className="dropdown-filters">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          />

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="leave">On Leave</option>
            <option value="absent">Absent</option>
          </select>

          {(selectedDate || selectedStatus) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedDate('');
                setSelectedStatus('');
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
          <LoadingSpinner message="Loading attendance logs..." />
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
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Clock size={24} />}
            title="No attendance records found"
            description="No logs recorded matching the selected filter criteria."
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const emp = rec.employee || {};
                  const formattedDate = rec.date
                    ? new Date(rec.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';

                  const inTime = rec.checkIn
                    ? new Date(rec.checkIn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  const outTime = rec.checkOut
                    ? new Date(rec.checkOut).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={rec._id}>
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
                        <span style={{ fontSize: '13px' }}>{formattedDate}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {inTime}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {outTime}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {rec.workHours ? `${rec.workHours} hrs` : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag status-${rec.status}`}>
                          <span className="badge-dot"></span>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && records.length > 0 && (
          <div className="table-pagination">
            <span>
              Showing {records.length} of {pagination.total} records
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
    </div>
  );
};

export default AttendancePage;
