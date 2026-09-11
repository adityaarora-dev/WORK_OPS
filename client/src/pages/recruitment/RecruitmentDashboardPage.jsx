import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Calendar,
  Plus,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getRecruitmentSummary,
  getJobs,
  getApplications,
  getInterviews,
  updateApplicationStage,
} from '../../services/recruitmentService';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';

const PIPELINE_COLUMNS = [
  { id: 'Applied', label: 'Applied', color: 'var(--neutral-text)' },
  { id: 'Screening', label: 'Screening', color: 'var(--info)' },
  { id: 'Shortlisted', label: 'Shortlisted', color: 'var(--primary)' },
  { id: 'Interview', label: 'Interview', color: '#8b5cf6' },
  { id: 'Selected', label: 'Selected', color: '#06b6d4' },
  { id: 'Offer', label: 'Offer', color: 'var(--warning)' },
  { id: 'Hired', label: 'Hired', color: 'var(--success)' },
];

export const RecruitmentDashboardPage = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isAdminOrHr = ['admin', 'hr'].includes(role);

  // Active Tab: 'positions', 'pipeline', or 'interviews'
  const [activeTab, setActiveTab] = useState('positions');

  const [summary, setSummary] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getRecruitmentSummary().catch(() => ({ data: null })),
      getJobs({ limit: 50 }).catch(() => ({ data: [] })),
      getApplications({ limit: 100 }).catch(() => ({ data: [] })),
      getInterviews({ limit: 50, status: 'scheduled' }).catch(() => ({ data: [] })),
    ])
      .then(([sumRes, jobsRes, appRes, intRes]) => {
        if (isMounted) {
          setSummary(sumRes.data);
          setJobs(jobsRes.data || []);
          setApplications(appRes.data || []);
          setInterviews(intRes.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load recruitment data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStageChange = async (appId, newStage) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStage(appId, newStage);
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, stage: newStage } : a))
      );
      toast.success(`Candidate advanced to ${newStage}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update stage');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading unified recruitment hub..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Unified Recruitment Hub</h1>
          <p className="page-subtitle">
            Manage open requisitions, candidate pipeline Kanban, and scheduled interviews in one workspace.
          </p>
        </div>

        <div className="page-actions">
          {isAdminOrHr && (
            <Link to="/recruitment/jobs/new" className="btn btn-primary">
              <Plus size={15} />
              <span>Post Opening</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* 3 Compact KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          title="OPEN REQUISITIONS"
          value={summary?.openJobs || jobs.filter((j) => j.status === 'open').length || 0}
          icon={<Briefcase size={16} />}
          subtitle="Active job postings"
        />
        <StatCard
          title="ACTIVE APPLICANTS"
          value={applications.length}
          icon={<Users size={16} />}
          subtitle="In pipeline across all roles"
        />
        <StatCard
          title="SCHEDULED INTERVIEWS"
          value={interviews.length}
          icon={<Calendar size={16} />}
          subtitle="Confirmed evaluations"
        />
        <StatCard
          title="OFFERS EXTENDED"
          value={applications.filter((a) => a.stage === 'Offer' || a.stage === 'Selected').length}
          icon={<Layers size={16} />}
          subtitle="Candidates in final offer"
        />
      </div>

      {/* 3 Unified Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '24px',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeTab === 'positions' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'positions' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            transition: 'all 220ms ease',
          }}
        >
          Open Positions ({jobs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeTab === 'pipeline' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'pipeline' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            transition: 'all 220ms ease',
          }}
        >
          Hiring Pipeline ({applications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interviews')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            color: activeTab === 'interviews' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'interviews' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            transition: 'all 220ms ease',
          }}
        >
          Interviews ({interviews.length})
        </button>
      </div>

      {/* TAB 1: Open Positions */}
      {activeTab === 'positions' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Openings</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No active job postings found.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {job.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {job.jobType || 'Full-time'}
                        </div>
                      </td>
                      <td>
                        {typeof job.department === 'object' && job.department !== null
                          ? job.department.name
                          : (job.department || 'Engineering')}
                      </td>
                      <td>{job.location || 'Remote / Hybrid'}</td>
                      <td>
                        <span className="code-pill">{job.openings || 1} slots</span>
                      </td>
                      <td>
                        <span
                          className={`status-tag status-${job.status === 'open' ? 'active' : 'inactive'}`}
                        >
                          <span className="badge-dot"></span>
                          {job.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/recruitment/jobs/${job._id}`}
                          className="btn-table-action"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Hiring Pipeline */}
      {activeTab === 'pipeline' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              overflowX: 'auto',
              paddingBottom: '16px',
            }}
          >
            {PIPELINE_COLUMNS.map((col) => {
              const stageApps = applications.filter((a) => a.stage === col.id);
              return (
                <div
                  key={col.id}
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-default)',
                    padding: '14px',
                    minWidth: '240px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: col.color,
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {col.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-surface)',
                        padding: '1px 7px',
                        borderRadius: '999px',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {stageApps.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stageApps.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-disabled)', fontSize: '12px' }}>
                        Empty Stage
                      </div>
                    ) : (
                      stageApps.map((app) => (
                        <div
                          key={app._id}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-default)',
                            padding: '12px',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            {app.jobOpening?.title || 'Open Position'}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link
                              to={`/recruitment/applications/${app._id}`}
                              style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              Details →
                            </Link>

                            <select
                              value={app.stage}
                              disabled={updatingId === app._id}
                              onChange={(e) => handleStageChange(app._id, e.target.value)}
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-default)',
                                backgroundColor: 'var(--bg-surface-raised)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {PIPELINE_COLUMNS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  Move: {p.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Interviews */}
      {activeTab === 'interviews' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Target Position</th>
                  <th>Scheduled Time</th>
                  <th>Interviewer</th>
                  <th>Format</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No interview evaluations currently scheduled.
                    </td>
                  </tr>
                ) : (
                  interviews.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {item.application?.candidate?.firstName} {item.application?.candidate?.lastName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {item.application?.candidate?.email || 'Candidate'}
                        </div>
                      </td>
                      <td>
                        {item.application?.jobOpening?.title || 'Engineer'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                          {new Date(item.scheduledAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        {item.interviewer?.firstName} {item.interviewer?.lastName || 'Assigned Lead'}
                      </td>
                      <td>
                        <span className="code-pill" style={{ textTransform: 'capitalize' }}>
                          {item.type || 'Video Meet'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-tag status-${item.status === 'completed' ? 'active' : 'pending'}`}
                        >
                          <span className="badge-dot"></span>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentDashboardPage;
