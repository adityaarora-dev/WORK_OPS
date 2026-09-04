import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getReviewById,
  updateReview,
} from '../../services/performanceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RATING_DEFINITIONS = {
  1: { label: 'Poor', desc: 'Consistently misses expectations across key deliverables.' },
  2: { label: 'Needs Improvement', desc: 'Inconsistent delivery across target milestones.' },
  3: { label: 'Meets Expectations', desc: 'Consistently delivers on expectations and core goals.' },
  4: { label: 'Exceeds Expectations', desc: 'Surpasses targets and demonstrates strong ownership.' },
  5: { label: 'Outstanding', desc: 'Transformational contributor and team multiplier.' },
};

export const PerformanceReviewDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Acknowledgment State
  const [employeeComments, setEmployeeComments] = useState('');
  const [ackLoading, setAckLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getReviewById(id)
      .then((res) => {
        if (isMounted) {
          setReview(res.data);
          setEmployeeComments(res.data?.employeeComments || '');
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load performance review.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading performance scorecard..." />;
  if (error || !review) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {error || 'Review scorecard not found.'}
        </div>
        <Link to="/performance/reviews" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Reviews
        </Link>
      </div>
    );
  }

  // Check if current user is the reviewed employee
  const isReviewedEmployee =
    user?.employeeId === review.employee?.employeeId ||
    user?.email === review.employee?.email;

  const canAcknowledge = isReviewedEmployee && review.status === 'submitted';
  const ratingInfo = RATING_DEFINITIONS[review.overallRating] || { label: 'Evaluated', desc: '' };

  const handleAcknowledge = async () => {
    setAckLoading(true);
    try {
      const res = await updateReview(review._id, {
        status: 'acknowledged',
        employeeComments,
      });
      setReview(res.data);
      toast.success('Performance evaluation acknowledged successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to acknowledge review.');
    } finally {
      setAckLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Breadcrumb Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/performance" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Performance
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <Link to="/performance/reviews" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Reviews
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>Scorecard</span>
          </div>
          <h1 className="page-title">Performance Scorecard</h1>
          <p className="page-subtitle">
            Formal evaluation record for {review.employee?.firstName} {review.employee?.lastName} ({review.employee?.employeeId})
          </p>
        </div>

        <div className="page-actions">
          <Link to="/performance/reviews" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to List
          </Link>
        </div>
      </div>

      {/* Meta Profile Card */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {review.employee?.firstName} {review.employee?.lastName}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--neutral-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {review.employee?.employeeId}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {review.employee?.designation} · {review.employee?.department?.name || 'Department'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Review Cycle
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {review.reviewCycle?.name || 'Annual Review'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Evaluated By
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {review.reviewer?.firstName} {review.reviewer?.lastName} ({review.reviewer?.role})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Status
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                  backgroundColor:
                    review.status === 'acknowledged'
                      ? 'var(--success-subtle)'
                      : review.status === 'submitted'
                      ? 'var(--warning-subtle)'
                      : 'var(--neutral-subtle)',
                  color:
                    review.status === 'acknowledged'
                      ? 'var(--success-text)'
                      : review.status === 'submitted'
                      ? 'var(--warning-text)'
                      : 'var(--text-muted)',
                }}
              >
                {review.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score & Qualitative Evaluation Grid */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '24px' }}>
        {/* Rating Card */}
        <div
          className="card"
          style={{
            gridColumn: 'span 1',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          <div style={{ fontSize: '13px', textTransform: 'uppercase', color: '#92400e', fontWeight: 700, letterSpacing: '0.5px' }}>
            Overall Performance Rating
          </div>
          <div style={{ fontSize: '56px', fontWeight: 900, color: '#b45309', margin: '8px 0' }}>
            {review.overallRating} <span style={{ fontSize: '24px', fontWeight: 500 }}>/ 5</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={star <= review.overallRating ? '#d97706' : '#e2e8f0'}
                color={star <= review.overallRating ? '#d97706' : '#cbd5e1'}
              />
            ))}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#78350f' }}>
            {ratingInfo.label}
          </div>
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
            {ratingInfo.desc}
          </div>
        </div>

        {/* Manager Commentary & Core Highlights */}
        <div className="card" style={{ gridColumn: 'span 2', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Executive Evaluation & Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Manager Commentary
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {review.managerComments || 'No summary commentary provided.'}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success-text)', marginBottom: '4px' }}>
                Key Strengths & Competencies
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {review.strengths || 'Consistent execution across responsibilities.'}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-text)', marginBottom: '4px' }}>
                Major Achievements & Deliverables
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {review.achievements || 'Met core assigned milestones on schedule.'}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning-text)', marginBottom: '4px' }}>
                Areas for Improvement & Development
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {review.areasForImprovement || 'Continue developing technical and leadership capabilities.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Acknowledgment Section */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Employee Review Acknowledgment
        </h3>

        {review.status === 'acknowledged' ? (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success-subtle)',
              border: '1px solid var(--success-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-text)', fontWeight: 600, marginBottom: '6px' }}>
              <CheckCircle2 size={18} />
              Evaluation Acknowledged by Employee
            </div>
            {review.employeeComments ? (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                "{review.employeeComments}"
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Acknowledged without additional comments.
              </p>
            )}
          </div>
        ) : canAcknowledge ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Please review the feedback and rating provided by your manager. You may provide personal reflections or comments before acknowledging this scorecard.
            </p>

            <div className="form-group">
              <label className="form-label">Employee Reflections / Self-Assessment Comments</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Share your perspective on the evaluation, next steps, or growth goals..."
                value={employeeComments}
                onChange={(e) => setEmployeeComments(e.target.value)}
              />
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={handleAcknowledge}
                disabled={ackLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                {ackLoading ? 'Acknowledging...' : 'Acknowledge Performance Review'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <Clock size={16} /> Awaiting employee acknowledgment.
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceReviewDetailPage;
