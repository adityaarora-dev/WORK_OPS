import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getCandidates,
  createCandidate,
} from '../../services/recruitmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const CandidatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role || '').toLowerCase();
  const isAdminOrHr = ['admin', 'hr'].includes(role);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Add Candidate Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '',
    country: 'India',
    skills: '',
    experience: 3,
    education: 'B.Tech in Computer Science',
    source: 'Direct',
    notes: '',
  });

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await getCandidates({
        page,
        limit: 10,
        search,
        status: statusFilter,
        source: sourceFilter,
      });
      setCandidates(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, statusFilter, sourceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        skills: formData.skills,
        experience: Number(formData.experience) || 0,
        education: formData.education,
        source: formData.source,
        notes: formData.notes,
      };

      const res = await createCandidate(payload);
      toast.success(res.message || 'Candidate registered successfully.');
      setModalOpen(false);
      fetchCandidates();
    } catch (err) {
      toast.error(err.message || 'Failed to register candidate.');
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
            <Link to="/recruitment" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Recruitment
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Candidates</span>
          </div>
          <h1 className="page-title">Candidate Talent Pool</h1>
          <p className="page-subtitle">Track applicants, prospective talent, skills resumes, and sourcing pipelines.</p>
        </div>

        {isAdminOrHr && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Candidate
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '350px' }}>
            <div className="input-group" style={{ display: 'flex', width: '100%' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search name, email, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '0 12px' }}>
                <Search size={14} />
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
              <select
                className="form-select"
                style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="in_review">In Review</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Source:</span>
              <select
                className="form-select"
                style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Sources</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Career Portal">Career Portal</option>
                <option value="Agency">Agency</option>
                <option value="Direct">Direct</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading talent directory..." />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No Candidates Found"
          description="There are currently no candidates matching your criteria."
          actionText={isAdminOrHr ? 'Add Candidate' : null}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Contact Info</th>
                  <th>Experience</th>
                  <th>Core Skills</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => navigate(`/recruitment/candidates/${c._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.firstName} {c.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                        {c.candidateId}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div>{c.email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.phone || '—'}</div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {c.experience ? `${c.experience} yrs` : 'Entry-level'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '280px' }}>
                        {c.skills && c.skills.length > 0 ? (
                          c.skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: 'var(--bg-surface-subtle)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
                        {c.skills?.length > 3 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.source}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase',
                          backgroundColor:
                            c.status === 'hired'
                              ? 'var(--success-subtle)'
                              : c.status === 'rejected'
                              ? 'var(--danger-subtle)'
                              : c.status === 'interviewing'
                              ? 'var(--primary-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            c.status === 'hired'
                              ? 'var(--success-text)'
                              : c.status === 'rejected'
                              ? 'var(--danger-text)'
                              : c.status === 'interviewing'
                              ? 'var(--primary-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/recruitment/candidates/${c._id}`}
                        className="btn btn-sm btn-outline"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        Profile
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} candidates)
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

      {/* Modal: Add Candidate */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Candidate</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sourcing Channel</label>
                    <select
                      className="form-select"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Referral">Referral</option>
                      <option value="Career Portal">Career Portal</option>
                      <option value="Agency">Agency</option>
                      <option value="Direct">Direct</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Core Technical Skills (Comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="React, Node.js, TypeScript, PostgreSQL"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Education Background</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="B.Tech Computer Science, IIT..."
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Candidate Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Initial recruiter notes, salary expectations, or portfolio links..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Register Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesPage;
