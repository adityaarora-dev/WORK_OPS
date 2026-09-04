import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getJobs } from '../../services/recruitmentService';
import { getDepartments } from '../../services/departmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const JobOpeningsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role || '').toLowerCase();
  const isAdminOrHr = ['admin', 'hr'].includes(role);

  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getJobs({
        page,
        limit: 10,
        search,
        status: statusFilter,
        department: deptFilter,
      });
      setJobs(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load job openings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, deptFilter]);

  useEffect(() => {
    getDepartments({ limit: 100 })
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
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
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Job Openings</span>
          </div>
          <h1 className="page-title">Corporate Job Openings</h1>
          <p className="page-subtitle">Manage open headcount, requisitions, and departmental job postings.</p>
        </div>

        {isAdminOrHr && (
          <Link to="/recruitment/jobs/new" className="btn btn-primary">
            <Plus size={16} /> Post New Position
          </Link>
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
                placeholder="Search by title, job ID, location..."
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
                style={{ width: '140px', padding: '6px 10px', fontSize: '13px' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Department:</span>
              <select
                className="form-select"
                style={{ width: '180px', padding: '6px 10px', fontSize: '13px' }}
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading job openings..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="No Job Openings Found"
          description="There are currently no job openings matching your search criteria."
          actionText={isAdminOrHr ? 'Post New Position' : null}
          onAction={() => navigate('/recruitment/jobs/new')}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID & Title</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Location</th>
                  <th>Openings</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job._id}
                    onClick={() => navigate(`/recruitment/jobs/${job._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{job.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{job.jobId}</div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {job.department?.name || '—'}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{job.designation}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{job.location}</td>
                    <td style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{job.openings}</td>
                    <td style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface-subtle)',
                        }}
                      >
                        <Users size={12} /> {job.applicantCount || 0}
                      </span>
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
                            job.status === 'open'
                              ? 'var(--success-subtle)'
                              : job.status === 'paused'
                              ? 'var(--warning-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            job.status === 'open'
                              ? 'var(--success-text)'
                              : job.status === 'paused'
                              ? 'var(--warning-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/recruitment/jobs/${job._id}`}
                        className="btn btn-sm btn-outline"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        View Detail
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} positions)
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
    </div>
  );
};

export default JobOpeningsPage;
