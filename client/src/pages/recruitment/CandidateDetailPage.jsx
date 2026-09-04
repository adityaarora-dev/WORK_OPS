import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCandidateById,
  createApplication,
  getJobs,
} from '../../services/recruitmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const CandidateDetailPage = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply to job modal
  const [modalOpen, setModalOpen] = useState(false);
  const [openJobs, setOpenJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchCandidate = () => {
    setLoading(true);
    getCandidateById(id)
      .then((res) => {
        setCandidate(res.data);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Failed to load candidate.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const handleOpenApplyModal = () => {
    getJobs({ status: 'open' })
      .then((res) => {
        setOpenJobs(res.data || []);
        if (res.data?.length > 0) setSelectedJob(res.data[0]._id);
        setModalOpen(true);
      })
      .catch(() => toast.error('Failed to load open positions.'));
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) {
      toast.error('Please select an open position.');
      return;
    }

    setApplyLoading(true);
    try {
      await createApplication({
        candidate: candidate._id,
        jobOpening: selectedJob,
        notes: applyNotes,
      });
      toast.success('Candidate successfully applied for position.');
      setModalOpen(false);
      fetchCandidate();
    } catch (err) {
      toast.error(err.message || 'Failed to create application.');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading candidate dossier..." />;
  if (error || !candidate) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {error || 'Candidate not found.'}
        </div>
        <Link to="/recruitment/candidates" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Candidates
        </Link>
      </div>
    );
  }

  const applications = candidate.applications || [];

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
            <Link to="/recruitment/candidates" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Candidates
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{candidate.candidateId}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                backgroundColor:
                  candidate.status === 'hired'
                    ? 'var(--success-subtle)'
                    : candidate.status === 'rejected'
                    ? 'var(--danger-subtle)'
                    : 'var(--neutral-subtle)',
                color:
                  candidate.status === 'hired'
                    ? 'var(--success-text)'
                    : candidate.status === 'rejected'
                    ? 'var(--danger-text)'
                    : 'var(--text-secondary)',
              }}
            >
              {candidate.status.replace('_', ' ')}
            </span>
          </div>
          <p className="page-subtitle">Talent ID: {candidate.candidateId} · Sourced via {candidate.source}</p>
        </div>

        <div className="page-actions">
          <Link to="/recruitment/candidates" className="btn btn-secondary">
            <ArrowLeft size={16} /> All Candidates
          </Link>
          <button className="btn btn-primary" onClick={handleOpenApplyModal}>
            <Plus size={16} /> Link to Requisition
          </button>
        </div>
      </div>

      {/* Grid: Profile & Applications History */}
      <div className="grid grid-cols-3 gap-6">
        {/* Candidate Profile Details */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Candidate Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Email Address
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {candidate.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Phone Number
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {candidate.phone || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Experience
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {candidate.experience} Years
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Education
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {candidate.education || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Location
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {candidate.address?.city ? `${candidate.address.city}, ${candidate.address.state || ''} ${candidate.address.country || ''}` : 'India'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Technical Skills
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No skills tagged</span>
                )}
              </div>
            </div>

            {candidate.notes && (
              <div style={{ marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Recruiter Notes
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  {candidate.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Applications History */}
        <div className="card" style={{ gridColumn: 'span 2', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Application History ({applications.length})
            </h3>
            <button className="btn btn-sm btn-outline" onClick={handleOpenApplyModal}>
              <Plus size={14} /> Link to Requisition
            </button>
          </div>

          {applications.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              This candidate has not been submitted to any job openings yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {applications.map((app) => (
                <div
                  key={app._id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {app.jobOpening?.title || 'Job Position'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {app.jobOpening?.jobId} · Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase',
                        backgroundColor:
                          app.currentStage === 'Hired'
                            ? 'var(--success-subtle)'
                            : app.currentStage === 'Rejected'
                            ? 'var(--danger-subtle)'
                            : 'var(--primary-subtle)',
                        color:
                          app.currentStage === 'Hired'
                            ? 'var(--success-text)'
                            : app.currentStage === 'Rejected'
                            ? 'var(--danger-text)'
                            : 'var(--primary-text)',
                      }}
                    >
                      {app.currentStage}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Status: <strong style={{ textTransform: 'capitalize' }}>{app.status}</strong>
                    </div>
                    <Link
                      to={`/recruitment/applications/${app._id}`}
                      className="btn btn-sm btn-outline"
                      style={{ padding: '3px 10px', fontSize: '12px' }}
                    >
                      Manage Application & Pipeline →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Apply to Position */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Link Candidate to Job Opening</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Select Open Position *</label>
                  <select
                    className="form-select"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    required
                  >
                    {openJobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title} ({j.jobId} - {j.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Application Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Recruiter comments or screening notes..."
                    value={applyNotes}
                    onChange={(e) => setApplyNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={applyLoading}>
                  {applyLoading ? 'Linking...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetailPage;
