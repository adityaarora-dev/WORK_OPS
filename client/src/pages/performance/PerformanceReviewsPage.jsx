import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Star,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getReviews,
  createReview,
  getPerformanceCycles,
} from '../../services/performanceService';
import { getEmployees } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const RATING_DEFINITIONS = [
  { value: 1, label: 'Poor', desc: 'Consistently misses expectations' },
  { value: 2, label: 'Needs Improvement', desc: 'Inconsistent delivery across objectives' },
  { value: 3, label: 'Meets Expectations', desc: 'Reliably delivers core deliverables' },
  { value: 4, label: 'Exceeds Expectations', desc: 'Consistently surpasses target milestones' },
  { value: 5, label: 'Outstanding', desc: 'Transformational contributor and organizational multiplier' },
];

export const PerformanceReviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role || '').toLowerCase();
  const isEmployee = role === 'employee';
  const canConductReview = ['admin', 'hr', 'manager'].includes(role);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters & auxiliary data
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employees, setEmployees] = useState([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    reviewCycle: '',
    overallRating: 3,
    strengths: '',
    weaknesses: '',
    achievements: '',
    areasForImprovement: '',
    managerComments: '',
    status: 'submitted',
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getReviews({
        page,
        limit: 10,
        reviewCycle: selectedCycle,
        status: statusFilter,
      });
      setReviews(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, selectedCycle, statusFilter]);

  useEffect(() => {
    getPerformanceCycles()
      .then((res) => setCycles(res.data || []))
      .catch(() => {});

    if (canConductReview) {
      getEmployees({ limit: 100 })
        .then((res) => setEmployees(res.data || []))
        .catch(() => {});
    }
  }, [canConductReview]);

  const handleOpenCreate = () => {
    setFormData({
      employee: employees[0]?._id || '',
      reviewCycle: cycles[0]?._id || '',
      overallRating: 3,
      strengths: '',
      weaknesses: '',
      achievements: '',
      areasForImprovement: '',
      managerComments: '',
      status: 'submitted',
    });
    setModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee) {
      toast.error('Please select an employee to evaluate.');
      return;
    }
    if (!formData.reviewCycle) {
      toast.error('Please select a review cycle.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await createReview(formData);
      toast.success('Performance review recorded successfully.');
      setModalOpen(false);
      navigate(`/performance/reviews/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
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
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Reviews</span>
          </div>
          <h1 className="page-title">{isEmployee ? 'My Performance Reviews' : 'Performance Reviews & Appraisals'}</h1>
          <p className="page-subtitle">Formal evaluations, manager feedback, and employee acknowledgments.</p>
        </div>

        {canConductReview && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Conduct Review
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
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cycle:</span>
            <select
              className="form-select"
              style={{ width: '200px', padding: '6px 10px', fontSize: '13px' }}
              value={selectedCycle}
              onChange={(e) => {
                setSelectedCycle(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Review Cycles</option>
              {cycles.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              {!isEmployee && <option value="draft">Draft</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <LoadingSpinner message="Loading reviews..." />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<Award size={28} />}
          title="No Reviews Recorded"
          description="There are currently no performance evaluations matching your filters."
          actionText={canConductReview ? 'Conduct First Review' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Review Cycle</th>
                  <th>Overall Rating</th>
                  <th>Reviewer</th>
                  <th>Status</th>
                  <th>Review Date</th>
                  <th style={{ textAlign: 'right' }}>Scorecard</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => navigate(`/performance/reviews/${r._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {r.employee?.employeeId} · {r.employee?.designation}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {r.reviewCycle?.name || 'General Review'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                          }}
                        >
                          <Star size={12} fill="#d97706" /> {r.overallRating} / 5
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {RATING_DEFINITIONS.find((d) => d.value === r.overallRating)?.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName}` : '—'}
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
                            r.status === 'acknowledged'
                              ? 'var(--success-subtle)'
                              : r.status === 'submitted'
                              ? 'var(--warning-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            r.status === 'acknowledged'
                              ? 'var(--success-text)'
                              : r.status === 'submitted'
                              ? 'var(--warning-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/performance/reviews/${r._id}`}
                        className="btn btn-sm btn-outline"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        View Details
                      </Link>
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} reviews)
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

      {/* Modal: Conduct Review */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Conduct Performance Review</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Evaluate Employee *</label>
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
                    <label className="form-label">Review Cycle *</label>
                    <select
                      className="form-select"
                      value={formData.reviewCycle}
                      onChange={(e) => setFormData({ ...formData, reviewCycle: e.target.value })}
                      required
                    >
                      <option value="">Select Cycle...</option>
                      {cycles.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rating Scale Selector */}
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Overall Rating (Scale 1–5) *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {RATING_DEFINITIONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, overallRating: r.value })}
                        style={{
                          padding: '10px 6px',
                          border: formData.overallRating === r.value ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                          backgroundColor: formData.overallRating === r.value ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {r.value} ⭐
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {r.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Key Strengths</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Core competencies, high-impact contributions, and leadership traits"
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Major Achievements</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Key project milestones, technical breakthroughs, or KPIs delivered"
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Areas For Improvement & Growth</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Constructive feedback, technical skills, or communication growth areas"
                    value={formData.areasForImprovement}
                    onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Manager Summary Comments</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Overall executive commentary on employee performance"
                    value={formData.managerComments}
                    onChange={(e) => setFormData({ ...formData, managerComments: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReviewsPage;
