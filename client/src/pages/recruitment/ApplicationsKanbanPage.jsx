import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Filter,
  Users,
  Briefcase,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getApplications,
  getJobs,
  updateApplicationStage,
} from '../../services/recruitmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PIPELINE_COLUMNS = [
  { id: 'Applied', label: 'Applied', color: 'var(--neutral-text)' },
  { id: 'Screening', label: 'Screening', color: 'var(--info)' },
  { id: 'Shortlisted', label: 'Shortlisted', color: 'var(--primary)' },
  { id: 'Interview', label: 'Interview', color: '#8b5cf6' },
  { id: 'Selected', label: 'Selected', color: '#06b6d4' },
  { id: 'Offer', label: 'Offer', color: 'var(--warning)' },
  { id: 'Hired', label: 'Hired', color: 'var(--success)' },
  { id: 'Rejected', label: 'Rejected', color: 'var(--danger)' },
];

export const ApplicationsKanbanPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getApplications({
        jobOpening: selectedJob,
        limit: 100,
      });
      setApplications(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load recruitment applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getJobs({ limit: 100 })
      .then((res) => setJobs(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJob]);

  const handleQuickAdvance = async (e, app, nextStage) => {
    e.stopPropagation();
    setUpdatingId(app._id);
    try {
      await updateApplicationStage(app._id, {
        stage: nextStage,
        notes: `Advanced via pipeline board to ${nextStage}`,
      });
      toast.success(`Moved ${app.candidate?.firstName} to ${nextStage}`);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Failed to advance stage.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStage = (currentStage) => {
    const sequence = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Offer', 'Hired'];
    const idx = sequence.indexOf(currentStage);
    if (idx >= 0 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return null;
  };

  return (
    <div className="page-container" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/recruitment" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Recruitment
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Pipeline Board</span>
          </div>
          <h1 className="page-title">Recruitment Pipeline Board</h1>
          <p className="page-subtitle">Track applicants through each stage from submission to offer and hiring conversion.</p>
        </div>

        <div className="page-actions">
          <Link to="/recruitment/candidates" className="btn btn-secondary">
            <Users size={16} /> Candidate Pool
          </Link>
          <Link to="/recruitment/jobs" className="btn btn-secondary">
            <Briefcase size={16} /> Job Postings
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Job Requisition:</span>
          <select
            className="form-select"
            style={{ width: '300px', padding: '6px 10px', fontSize: '13px' }}
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
          >
            <option value="">All Job Openings ({applications.length} applicants)</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} ({j.jobId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      {loading ? (
        <LoadingSpinner message="Loading candidate pipeline..." />
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '20px',
            minHeight: '600px',
          }}
        >
          {PIPELINE_COLUMNS.map((col) => {
            const columnApps = applications.filter((a) => a.currentStage === col.id);

            return (
              <div
                key={col.id}
                style={{
                  flex: '0 0 260px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 260px)',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-surface)',
                    borderTopLeftRadius: 'var(--radius-lg)',
                    borderTopRightRadius: 'var(--radius-lg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: col.color,
                        display: 'inline-block',
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
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {columnApps.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div
                  style={{
                    padding: '10px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {columnApps.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 10px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      No candidates in {col.label}
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const nextStage = getNextStage(app.currentStage);

                      return (
                        <div
                          key={app._id}
                          onClick={() => navigate(`/recruitment/applications/${app._id}`)}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px',
                            border: '1px solid var(--border-default)',
                            boxShadow: 'var(--shadow-xs)',
                            cursor: 'pointer',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>
                            {app.jobOpening?.title || 'Open Position'}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            <span>{app.candidate?.experience || 0}y exp</span>
                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Quick Advance Button */}
                          {nextStage && col.id !== 'Hired' && col.id !== 'Rejected' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                              <button
                                className="btn btn-sm btn-ghost"
                                disabled={updatingId === app._id}
                                onClick={(e) => handleQuickAdvance(e, app, nextStage)}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '11px',
                                  color: 'var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                Advance to {nextStage} <ArrowRight size={11} />
                              </button>
                            </div>
                          )}

                          {col.id === 'Hired' && (
                            <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--success-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>✓ Hired</span>
                              {app.convertedToEmployee && <span>(EMP Onboarded)</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationsKanbanPage;
