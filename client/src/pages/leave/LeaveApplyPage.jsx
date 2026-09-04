import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { applyLeave } from '../../services/leaveService';

export const LeaveApplyPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatedDays = calculateDays(formData.startDate, formData.endDate);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (calculatedDays < 1) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    if (!formData.reason.trim()) {
      setFormError('Please provide a reason for the leave request.');
      return;
    }

    setSubmitting(true);
    try {
      await applyLeave(formData);
      toast.success('Leave request submitted successfully for approval.');
      navigate('/leave');
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to submit leave request.');
      toast.error('Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/leave"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Leaves</span>
          </Link>
          <h1 className="page-main-title">Apply for Time-Off</h1>
          <p className="page-sub-title">
            Submit an official PTO or absence request for managerial and HR review.
          </p>
        </div>
      </div>

      {formError && (
        <div className="action-banner banner-error">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section-title">Leave Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="leaveType">
              Leave Category <span className="required-star">*</span>
            </label>
            <select
              id="leaveType"
              value={formData.leaveType}
              onChange={(e) => handleChange('leaveType', e.target.value)}
              required
            >
              <option value="casual">Casual Leave (Short Personal Time)</option>
              <option value="sick">Sick Leave (Medical / Illness)</option>
              <option value="earned">Earned / Annual Vacation</option>
              <option value="unpaid">Unpaid Leave of Absence</option>
              <option value="other">Other / Special Event</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate">
              Start Date <span className="required-star">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">
              End Date <span className="required-star">*</span>
            </label>
            <input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Requested Duration</label>
            <div
              style={{
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
              }}
            >
              <span className="code-pill">
                {calculatedDays} {calculatedDays === 1 ? 'Calendar Day' : 'Calendar Days'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                (Inclusive count)
              </span>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '8px' }}>
          <label htmlFor="reason">
            Reason for Absence <span className="required-star">*</span>
          </label>
          <textarea
            id="reason"
            rows="3"
            placeholder="Please provide context for your leave request..."
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <Link to="/leave" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Send size={15} />
            <span>{submitting ? 'Submitting Application...' : 'Submit Request'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplyPage;
