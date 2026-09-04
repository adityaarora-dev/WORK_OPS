import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getApplicationById,
  updateApplicationStage,
  convertToEmployee,
  createInterview,
} from '../../services/recruitmentService';
import { getDepartments } from '../../services/departmentService';
import { getEmployees } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PIPELINE_STAGES = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offer',
  'Hired',
];

export const ApplicationDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isAdminOrHr = ['admin', 'hr'].includes(role);

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stage transition modal / controls
  const [stageNotes, setStageNotes] = useState('');
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Schedule Interview modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: '',
    duration: 45,
    mode: 'video',
    location: 'Google Meet',
    interviewer: '',
  });
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Convert to Employee modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [convertForm, setConvertForm] = useState({
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'full-time',
    manager: '',
  });
  const [convertLoading, setConvertLoading] = useState(false);

  const fetchApplication = () => {
    setLoading(true);
    getApplicationById(id)
      .then((res) => {
        setApplication(res.data);
        setError(null);
      })
      .catch((err) => setError(err.message || 'Failed to load application.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  // Load auxiliary data for employee conversion and interview scheduling
  useEffect(() => {
    if (isAdminOrHr) {
      getDepartments({ limit: 100 })
        .then((res) => setDepartments(res.data || []))
        .catch(() => {});
      getEmployees({ limit: 100 })
        .then((res) => {
          const emps = res.data || [];
          setManagers(emps.filter((e) => ['manager', 'admin'].includes(e.user?.role || '')));
        })
        .catch(() => {});
    }
  }, [isAdminOrHr]);

  const handleStageChange = async (targetStage) => {
    try {
      await updateApplicationStage(application._id, {
        stage: targetStage,
        notes: stageNotes,
      });
      toast.success(`Application advanced to "${targetStage}".`);
      setStageNotes('');
      fetchApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to update recruitment stage.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateApplicationStage(application._id, {
        stage: 'Rejected',
        rejectionReason,
        notes: stageNotes,
      });
      toast.error('Application marked as Rejected.');
      setRejectionModalOpen(false);
      fetchApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to reject application.');
    }
  };

  const handleOpenInterviewModal = () => {
    setInterviewForm({
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      duration: 45,
      mode: 'video',
      location: 'Google Meet',
      interviewer: user?._id || '',
    });
    setInterviewModalOpen(true);
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    if (!interviewForm.scheduledAt) {
      toast.error('Please specify interview date and time.');
      return;
    }

    setInterviewLoading(true);
    try {
      await createInterview({
        application: application._id,
        scheduledAt: interviewForm.scheduledAt,
        duration: interviewForm.duration,
        mode: interviewForm.mode,
        location: interviewForm.location,
        interviewer: interviewForm.interviewer || user._id,
      });
      toast.success('Interview scheduled successfully.');
      setInterviewModalOpen(false);
      fetchApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule interview.');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleOpenConvertModal = () => {
    setConvertForm({
      department: application.jobOpening?.department?._id || departments[0]?._id || '',
      designation: application.jobOpening?.designation || 'Staff Engineer',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: application.jobOpening?.employmentType || 'full-time',
      manager: '',
    });
    setConvertModalOpen(true);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!convertForm.department) {
      toast.error('Department is required for employee conversion.');
      return;
    }

    setConvertLoading(true);
    try {
      const res = await convertToEmployee(application._id, convertForm);
      toast.success(res.message || 'Candidate successfully converted into Employee!');
      setConvertModalOpen(false);
      fetchApplication();
    } catch (err) {
      toast.error(err.message || 'Conversion failed.');
    } finally {
      setConvertLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading application record..." />;
  if (error || !application) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {error || 'Application not found.'}
        </div>
        <Link to="/recruitment/applications" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Pipeline
        </Link>
      </div>
    );
  }

  const { candidate, jobOpening, interviews = [] } = application;
  const isHired = application.currentStage === 'Hired';
  const isRejected = application.currentStage === 'Rejected';
  const isConverted = Boolean(application.convertedToEmployee);

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
            <Link to="/recruitment/applications" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Pipeline
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{application.applicationId}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">
              {candidate?.firstName} {candidate?.lastName}
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                backgroundColor: isHired
                  ? 'var(--success-subtle)'
                  : isRejected
                  ? 'var(--danger-subtle)'
                  : 'var(--primary-subtle)',
                color: isHired
                  ? 'var(--success-text)'
                  : isRejected
                  ? 'var(--danger-text)'
                  : 'var(--primary-text)',
              }}
            >
              {application.currentStage}
            </span>
          </div>
          <p className="page-subtitle">
            Applying for <strong>{jobOpening?.title}</strong> ({jobOpening?.jobId}) · Applied on {new Date(application.applicationDate).toLocaleDateString()}
          </p>
        </div>

        <div className="page-actions">
          <Link to="/recruitment/applications" className="btn btn-secondary">
            <ArrowLeft size={16} /> Pipeline Kanban
          </Link>

          {isAdminOrHr && !isConverted && (
            <button
              className="btn btn-success"
              onClick={handleOpenConvertModal}
              style={{ backgroundColor: 'var(--success)', color: '#fff' }}
            >
              <UserCheck size={16} /> Convert to Employee
            </button>
          )}

          {isConverted && (
            <Link
              to={`/employees/${application.convertedToEmployee?._id || application.convertedToEmployee}`}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} /> View Employee Profile ({application.convertedToEmployee?.employeeId || 'EMP'})
            </Link>
          )}
        </div>
      </div>

      {/* Converted Banner */}
      {isConverted && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--success-subtle)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--success-text)' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '15px' }}>
                Candidate Converted into Active Corporate Employee!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Onboarded as {application.convertedToEmployee?.employeeId} on {new Date(application.conversionDate).toLocaleDateString()}.
              </div>
            </div>
          </div>
          <Link
            to={`/employees/${application.convertedToEmployee?._id || application.convertedToEmployee}`}
            className="btn btn-sm btn-primary"
          >
            Access Employee Profile →
          </Link>
        </div>
      )}

      {/* Visual Pipeline Stepper */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>
          Recruitment Stage Pipeline
        </h3>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const currentIdx = PIPELINE_STAGES.indexOf(application.currentStage);
            const isCompleted = currentIdx > idx;
            const isCurrent = application.currentStage === stage;

            return (
              <div
                key={stage}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent
                    ? 'var(--primary-subtle)'
                    : isCompleted
                    ? 'var(--bg-surface-subtle)'
                    : 'var(--bg-canvas)',
                  border: isCurrent
                    ? '2px solid var(--primary)'
                    : isCompleted
                    ? '1px solid var(--border-default)'
                    : '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: isCurrent ? 'var(--primary-text)' : 'var(--text-muted)' }}>
                  Step {idx + 1}
                </div>
                <div style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--primary-text)' : 'var(--text-primary)', marginTop: '2px' }}>
                  {stage}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Progression Actions */}
        {!isConverted && !isRejected && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '4px' }}>
                Advance to:
              </span>
              {PIPELINE_STAGES.map((st) => (
                <button
                  key={st}
                  disabled={application.currentStage === st}
                  className={`btn btn-sm ${application.currentStage === st ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleStageChange(st)}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              className="btn btn-sm btn-outline"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
              onClick={() => setRejectionModalOpen(true)}
            >
              <XCircle size={14} /> Reject Candidate
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Grid: Candidate & Interviews */}
      <div className="grid grid-cols-3 gap-6">
        {/* Candidate Profile Details */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Candidate Profile</h3>
            <Link to={`/recruitment/candidates/${candidate?._id}`} className="btn btn-sm btn-ghost">
              Full Profile →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Full Name
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {candidate?.firstName} {candidate?.lastName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Email
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{candidate?.email}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Phone
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{candidate?.phone || '—'}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Experience & Education
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {candidate?.experience || 0} years · {candidate?.education || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Skills
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {candidate?.skills?.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interviews & Notes */}
        <div className="card" style={{ gridColumn: 'span 2', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Interviews & Evaluations ({interviews.length})
            </h3>
            {isAdminOrHr && !isConverted && (
              <button className="btn btn-sm btn-primary" onClick={handleOpenInterviewModal}>
                <Plus size={14} /> Schedule Interview
              </button>
            )}
          </div>

          {interviews.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No interviews scheduled yet for this candidate.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {interviews.map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {item.mode.toUpperCase()} Interview ({item.duration} min)
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        textTransform: 'uppercase',
                        backgroundColor: item.status === 'completed' ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                        color: item.status === 'completed' ? 'var(--success-text)' : 'var(--warning-text)',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Scheduled for: <strong>{new Date(item.scheduledAt).toLocaleString()}</strong> · Interviewer: {item.interviewer?.firstName} {item.interviewer?.lastName}
                  </div>

                  {item.rating && (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>
                      Evaluation Rating: ⭐ {item.rating} / 5
                    </div>
                  )}

                  {item.feedback && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                      "{item.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {application.notes && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Application Notes & History
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', margin: 0 }}>
                {application.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Schedule Interview */}
      {interviewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule Candidate Interview</h3>
              <button className="btn-close" onClick={() => setInterviewModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInterviewSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={interviewForm.scheduledAt}
                    onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      step="15"
                      className="form-control"
                      value={interviewForm.duration}
                      onChange={(e) => setInterviewForm({ ...interviewForm, duration: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Interview Mode</label>
                    <select
                      className="form-select"
                      value={interviewForm.mode}
                      onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}
                    >
                      <option value="video">Video (Google Meet / Zoom)</option>
                      <option value="phone">Phone Screen</option>
                      <option value="in-person">In-Person (HQ)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting Location or Link</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://meet.google.com/xyz or Room 402"
                    value={interviewForm.location}
                    onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setInterviewModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={interviewLoading}>
                  {interviewLoading ? 'Scheduling...' : 'Schedule Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Candidate */}
      {rejectionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Reject Application</h3>
              <button className="btn-close" onClick={() => setRejectionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Are you sure you want to reject candidate <strong>{candidate?.firstName} {candidate?.lastName}</strong> for position {jobOpening?.title}?
                </p>

                <div className="form-group">
                  <label className="form-label">Rejection Reason *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Does not meet distributed systems threshold; candidate pursued another offer..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRejectionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CONVERT TO EMPLOYEE (Critical Stage 10 Feature) */}
      {convertModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} style={{ color: 'var(--success)' }} />
                Convert Candidate to Corporate Employee
              </h3>
              <button className="btn-close" onClick={() => setConvertModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConvertSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Candidate: {candidate?.firstName} {candidate?.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {candidate?.email} · {candidate?.phone || 'No phone'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Assigned Department *</label>
                    <select
                      className="form-select"
                      value={convertForm.department}
                      onChange={(e) => setConvertForm({ ...convertForm, department: e.target.value })}
                      required
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Corporate Designation *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={convertForm.designation}
                      onChange={(e) => setConvertForm({ ...convertForm, designation: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Official Joining Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={convertForm.joiningDate}
                      onChange={(e) => setConvertForm({ ...convertForm, joiningDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employment Type</label>
                    <select
                      className="form-select"
                      value={convertForm.employmentType}
                      onChange={(e) => setConvertForm({ ...convertForm, employmentType: e.target.value })}
                    >
                      <option value="full-time">Full-Time</option>
                      <option value="contract">Contract</option>
                      <option value="part-time">Part-Time</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reporting Manager (Optional)</label>
                  <select
                    className="form-select"
                    value={convertForm.manager}
                    onChange={(e) => setConvertForm({ ...convertForm, manager: e.target.value })}
                  >
                    <option value="">No Manager / Direct Executive</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.firstName} {m.lastName} ({m.employeeId} - {m.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Converting will auto-generate the next sequential Employee ID (e.g. EMP008+), provision invite-only corporate credentials (Corp@&lt;ID&gt;#), and link the candidate record to the employee profile.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setConvertModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={convertLoading} style={{ backgroundColor: 'var(--success)', color: '#fff' }}>
                  {convertLoading ? 'Converting...' : 'Confirm Employee Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailPage;
