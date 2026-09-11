import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Video,
  Phone,
  Building,
  X,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getInterviews,
  updateInterview,
} from '../../services/recruitmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');

  // Feedback modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackText, setFeedbackText] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('completed');
  const [submitting, setSubmitting] = useState(false);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await getInterviews({
        page,
        limit: 10,
        status: statusFilter,
      });
      setInterviews(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [page, statusFilter]);

  const handleOpenFeedback = (item) => {
    setSelectedInterview(item);
    setFeedbackRating(item.rating || 4);
    setFeedbackText(item.feedback || '');
    setInterviewStatus(item.status || 'completed');
    setModalOpen(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateInterview(selectedInterview._id, {
        rating: Number(feedbackRating),
        feedback: feedbackText,
        status: interviewStatus,
      });
      toast.success('Interview feedback and rating recorded.');
      setModalOpen(false);
      fetchInterviews();
    } catch (err) {
      toast.error(err.message || 'Failed to submit interview feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModeIcon = (mode) => {
    switch (mode) {
      case 'video':
        return <Video size={14} style={{ color: 'var(--primary)' }} />;
      case 'phone':
        return <Phone size={14} style={{ color: 'var(--success)' }} />;
      default:
        return <Building size={14} style={{ color: 'var(--text-muted)' }} />;
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
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Interviews</span>
          </div>
          <h1 className="page-title">Interview Schedules & Evaluations</h1>
          <p className="page-subtitle">Coordinate candidate meetings, video screens, and interviewer scorecards.</p>
        </div>

        <div className="page-actions">
          <Link to="/recruitment/applications" className="btn btn-secondary">
            View Applications
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
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status Filter:</span>
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
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading interview calendar..." />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="No Interviews Found"
          description="There are currently no interview schedules matching your filter."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Scheduled Time</th>
                  <th>Mode & Location</th>
                  <th>Interviewer</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.application?.candidate?.firstName} {item.application?.candidate?.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.application?.candidate?.email}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {item.application?.jobOpening?.title || 'Engineer'}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <div>{new Date(item.scheduledAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.duration} min)
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                        {renderModeIcon(item.mode)} {item.mode}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.location}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {item.interviewer?.firstName} {item.interviewer?.lastName}
                    </td>
                    <td>
                      {item.rating ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--warning-subtle)',
                            color: 'var(--warning-text)',
                          }}
                        >
                          <Star size={11} fill="var(--warning)" color="var(--warning)" /> {item.rating} / 5
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</span>
                      )}
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
                            item.status === 'completed'
                              ? 'var(--success-subtle)'
                              : item.status === 'scheduled'
                              ? 'var(--primary-subtle)'
                              : 'var(--neutral-subtle)',
                          color:
                            item.status === 'completed'
                              ? 'var(--success-text)'
                              : item.status === 'scheduled'
                              ? 'var(--primary-text)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenFeedback(item)}
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                      >
                        <Edit2 size={12} /> Feedback
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} interviews)
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

      {/* Modal: Record Interview Feedback */}
      {modalOpen && selectedInterview && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Interview Feedback</h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>
                    Candidate: {selectedInterview.application?.candidate?.firstName} {selectedInterview.application?.candidate?.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Position: {selectedInterview.application?.jobOpening?.title}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Interviewer Score (1 to 5 Stars)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Star
                          size={24}
                          fill={star <= feedbackRating ? '#d97706' : 'none'}
                          color={star <= feedbackRating ? '#d97706' : '#cbd5e1'}
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '13px', fontWeight: 600, marginLeft: '8px' }}>
                      {feedbackRating} / 5
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Evaluation Feedback & Commentary</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Candidate strengths, problem solving ability, domain depth, and recommendation..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Interview Status</label>
                  <select
                    className="form-select"
                    value={interviewStatus}
                    onChange={(e) => setInterviewStatus(e.target.value)}
                  >
                    <option value="completed">Completed</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;
