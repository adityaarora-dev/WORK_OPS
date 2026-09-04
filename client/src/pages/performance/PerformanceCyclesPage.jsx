import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getPerformanceCycles,
  createPerformanceCycle,
  updatePerformanceCycle,
} from '../../services/performanceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const PerformanceCyclesPage = () => {
  const { user } = useAuth();
  const isAdminOrHr = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const res = await getPerformanceCycles({
        page,
        limit: 10,
        status: selectedStatus,
      });
      setCycles(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load review cycles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [page, selectedStatus]);

  const handleOpenCreate = () => {
    setEditingCycle(null);
    setFormData({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: 'active',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      description: cycle.description || '',
      startDate: cycle.startDate ? new Date(cycle.startDate).toISOString().split('T')[0] : '',
      endDate: cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : '',
      status: cycle.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Cycle name is required.');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingCycle) {
        await updatePerformanceCycle(editingCycle._id, formData);
        toast.success(`Review cycle "${formData.name}" updated successfully.`);
      } else {
        await createPerformanceCycle(formData);
        toast.success(`Review cycle "${formData.name}" established successfully.`);
      }
      setModalOpen(false);
      fetchCycles();
    } catch (err) {
      toast.error(err.message || 'Failed to save review cycle.');
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
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Review Cycles</span>
          </div>
          <h1 className="page-title">Review Cycles</h1>
          <p className="page-subtitle">Configure organization review periods, evaluation cadences, and milestones.</p>
        </div>

        {isAdminOrHr && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> New Review Cycle
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status Filter:</span>
          <select
            className="form-select"
            style={{ width: '180px', padding: '6px 10px', fontSize: '13px' }}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Cycles Table */}
      {loading ? (
        <LoadingSpinner message="Loading review cycles..." />
      ) : cycles.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="No Review Cycles Found"
          description="There are currently no performance review cycles configured."
          actionText={isAdminOrHr ? 'Create Review Cycle' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cycle Name</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Created By</th>
                  {isAdminOrHr && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle) => (
                  <tr key={cycle._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cycle.name}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(cycle.startDate).toLocaleDateString()} — {new Date(cycle.endDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase',
                          backgroundColor:
                            cycle.status === 'active'
                              ? 'var(--success-subtle)'
                              : cycle.status === 'completed'
                              ? 'var(--primary-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            cycle.status === 'active'
                              ? 'var(--success-text)'
                              : cycle.status === 'completed'
                              ? 'var(--primary-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {cycle.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '250px' }}>
                      {cycle.description || '—'}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {cycle.createdBy ? `${cycle.createdBy.firstName} ${cycle.createdBy.lastName}` : 'System'}
                    </td>
                    {isAdminOrHr && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleOpenEdit(cycle)}
                          style={{ padding: '4px 8px' }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      </td>
                    )}
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} cycles)
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

      {/* Modal for Create/Edit Review Cycle */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCycle ? 'Edit Review Cycle' : 'Create New Review Cycle'}</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cycle Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Annual Review 2026 or Mid-Year Review"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Evaluation focus, guidelines, or scope"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingCycle ? 'Save Changes' : 'Create Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceCyclesPage;
