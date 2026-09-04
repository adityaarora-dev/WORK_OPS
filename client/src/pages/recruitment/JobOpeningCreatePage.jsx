import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createJob } from '../../services/recruitmentService';
import { getDepartments } from '../../services/departmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const JobOpeningCreatePage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    designation: '',
    employmentType: 'full-time',
    location: 'Bengaluru HQ, Karnataka',
    openings: 1,
    requirements: '',
    responsibilities: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    status: 'open',
    closingDate: '',
  });

  useEffect(() => {
    getDepartments({ limit: 100 })
      .then((res) => {
        const depts = res.data || [];
        setDepartments(depts);
        if (depts.length > 0) {
          setFormData((prev) => ({ ...prev, department: depts[0]._id }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Job title is required.');
      return;
    }
    if (!formData.department) {
      toast.error('Please assign a department.');
      return;
    }
    if (!formData.designation.trim()) {
      toast.error('Designation is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        designation: formData.designation,
        employmentType: formData.employmentType,
        location: formData.location,
        openings: Number(formData.openings) || 1,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        salaryRange: {
          min: Number(formData.salaryMin) || 0,
          max: Number(formData.salaryMax) || 0,
          currency: formData.currency,
        },
        status: formData.status,
        closingDate: formData.closingDate || null,
      };

      const res = await createJob(payload);
      toast.success(res.message || 'Job opening created successfully.');
      navigate(`/recruitment/jobs/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create job opening.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Initializing job form..." />;

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
            <Link to="/recruitment/jobs" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Job Openings
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>New Requisition</span>
          </div>
          <h1 className="page-title">Post New Job Opening</h1>
          <p className="page-subtitle">Draft or publish a verified hiring requisition to the talent pipeline.</p>
        </div>

        <div className="page-actions">
          <Link to="/recruitment/jobs" className="btn btn-secondary">
            <ArrowLeft size={16} /> Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Form Card */}
      <div className="card" style={{ maxWidth: '850px', margin: '0 auto', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Lead Distributed Systems Engineer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Senior Principal Architect"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select
                className="form-select"
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Work Location *</label>
              <input
                type="text"
                className="form-control"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Number of Openings</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.openings}
                onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
              />
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Minimum Salary (Annual)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 2500000"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Salary (Annual)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 4000000"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Job Description *</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Detailed overview of the role, engineering culture, and business impact..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Core Responsibilities (One per line)</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Architect microservices&#10;Lead sprint retrospectives&#10;Conduct security reviews"
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Key Requirements (One per line)</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="5+ years in Node.js / React&#10;Experience with distributed databases&#10;BS in Computer Science"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Requisition Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="open">Open (Published to Pipeline)</option>
                <option value="draft">Draft (Internal Only)</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Closing Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/recruitment/jobs')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} /> {submitting ? 'Publishing...' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobOpeningCreatePage;
