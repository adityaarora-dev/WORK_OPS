import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Plus,
  Sliders,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getGoals,
  createGoal,
  updateGoal,
  getPerformanceCycles,
} from '../../services/performanceService';
import { getEmployees } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const PerformanceGoalsPage = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isEmployee = role === 'employee';
  const canAssignGoals = ['admin', 'hr', 'manager'].includes(role);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressStatus, setProgressStatus] = useState('in_progress');
  const [formLoading, setFormLoading] = useState(false);

  // New goal form
  const [formData, setFormData] = useState({
    employee: '',
    title: '',
    description: '',
    category: 'Engineering & Execution',
    priority: 'medium',
    dueDate: '',
    progress: 0,
    reviewCycle: '',
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await getGoals({
        page,
        limit: 10,
        status: statusFilter,
        priority: priorityFilter,
      });
      setGoals(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [page, statusFilter, priorityFilter]);

  // Load auxiliary data for modal
  useEffect(() => {
    if (canAssignGoals) {
      getEmployees({ limit: 100 })
        .then((res) => setEmployees(res.data || []))
        .catch(() => {});
      getPerformanceCycles({ status: 'active' })
        .then((res) => setCycles(res.data || []))
        .catch(() => {});
    }
  }, [canAssignGoals]);

  const handleOpenCreate = () => {
    setFormData({
      employee: employees[0]?._id || '',
      title: '',
      description: '',
      category: 'General',
      priority: 'medium',
      dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      progress: 0,
      reviewCycle: cycles[0]?._id || '',
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Goal title is required.');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Due date is required.');
      return;
    }

    setFormLoading(true);
    try {
      await createGoal(formData);
      toast.success('Performance goal assigned successfully.');
      setCreateModalOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.message || 'Failed to create goal.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenProgress = (goal) => {
    setSelectedGoal(goal);
    setProgressValue(goal.progress || 0);
    setProgressStatus(goal.status || 'in_progress');
    setProgressModalOpen(true);
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    const num = Number(progressValue);
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error('Progress must be between 0 and 100.');
      return;
    }

    setFormLoading(true);
    try {
      await updateGoal(selectedGoal._id, {
        progress: num,
        status: progressStatus,
      });
      toast.success(`Progress updated to ${num}%.`);
      setProgressModalOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.message || 'Failed to update goal progress.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/performance" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Performance
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Goals</span>
          </div>
          <h1 className="page-title">{isEmployee ? 'My Performance Goals' : 'Goals & Objectives Directory'}</h1>
          <p className="page-subtitle">Track objective key results, milestones, and deliverable progress.</p>
        </div>

        {canAssignGoals && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Assign New Goal
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <select
              className="form-select"
              style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority:</span>
            <select
              className="form-select"
              style={{ width: '140px', padding: '6px 10px', fontSize: '13px' }}
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Goals Table */}
      {loading ? (
        <LoadingSpinner message="Loading performance goals..." />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No Goals Found"
          description="There are currently no performance goals matching your criteria."
          actionText={canAssignGoals ? 'Assign Goal' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Goal</th>
                  {!isEmployee && <th>Employee</th>}
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr key={goal._id}>
                    <td>
                      <div className="goal-title-cell">
                        <span className="goal-main-title">{goal.title}</span>
                        {goal.description && (
                          <span className="goal-desc-sub">{goal.description}</span>
                        )}
                      </div>
                    </td>
                    {!isEmployee && (
                      <td>
                        {goal.employee ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                              {goal.employee.firstName} {goal.employee.lastName}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                              {goal.employee.designation || 'Specialist'}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          backgroundColor:
                            goal.priority === 'high'
                              ? 'var(--danger-subtle)'
                              : goal.priority === 'medium'
                              ? 'var(--warning-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            goal.priority === 'high'
                              ? 'var(--danger-text)'
                              : goal.priority === 'medium'
                              ? 'var(--warning-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {goal.priority}
                      </span>
                    </td>
                    <td style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar-container-thick">
                          <div
                            className={`progress-bar-fill-smooth ${
                              goal.progress === 100
                                ? 'progress-green'
                                : goal.progress > 50
                                ? ''
                                : 'progress-amber'
                            }`}
                            style={{ width: `${goal.progress || 0}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', width: '32px' }}>
                          {goal.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          backgroundColor:
                            goal.status === 'completed'
                              ? 'var(--success-subtle)'
                              : goal.status === 'in_progress'
                              ? 'var(--primary-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            goal.status === 'completed'
                              ? 'var(--success-text)'
                              : goal.status === 'in_progress'
                              ? 'var(--primary-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {goal.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleOpenProgress(goal)}
                      >
                        <Sliders size={13} />
                        <span>Update Progress</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} goals)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Goal */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Performance Goal</h3>
              <button className="btn-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Assign To Employee *</label>
                  <select
                    className="form-select"
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    required
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Goal Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Deliver Real-Time Webhook Pipeline"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Success Criteria</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Key deliverables, metrics, and definitions of done"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Review Cycle</label>
                    <select
                      className="form-select"
                      value={formData.reviewCycle}
                      onChange={(e) => setFormData({ ...formData, reviewCycle: e.target.value })}
                    >
                      <option value="">None / General</option>
                      {cycles.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Assigning...' : 'Assign Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Progress */}
      {progressModalOpen && selectedGoal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Update Goal Progress</h3>
              <button className="btn-close" onClick={() => setProgressModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProgressSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {selectedGoal.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Target Completion: {selectedGoal.dueDate ? new Date(selectedGoal.dueDate).toLocaleDateString() : '—'}
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Progress Percentage</label>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{progressValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="form-range"
                    style={{ width: '100%' }}
                    value={progressValue}
                    onChange={(e) => setProgressValue(Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>0% (Not Started)</span>
                    <span>50% (Halfway)</span>
                    <span>100% (Completed)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Goal Status</label>
                  <select
                    className="form-select"
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setProgressModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Updating...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceGoalsPage;
