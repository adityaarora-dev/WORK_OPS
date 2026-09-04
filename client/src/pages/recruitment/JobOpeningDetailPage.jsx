import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { getJobById, getApplications } from '../../services/recruitmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const JobOpeningDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getJobById(id),
      getApplications({ jobOpening: id }),
    ])
      .then(([jobRes, appRes]) => {
        if (isMounted) {
          setJob(jobRes.data);
          setApplications(appRes.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load job details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading job opening details..." />;
  if (error || !job) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {error || 'Job opening not found.'}
        </div>
        <Link to="/recruitment/jobs" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Job Openings
        </Link>
      </div>
    );
  }

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
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{job.jobId}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">{job.title}</h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                backgroundColor: job.status === 'open' ? 'var(--success-subtle)' : 'var(--neutral-subtle)',
                color: job.status === 'open' ? 'var(--success-text)' : 'var(--text-muted)',
              }}
            >
              {job.status}
            </span>
          </div>
          <p className="page-subtitle">
            {job.designation} · {job.department?.name} · {job.location}
          </p>
        </div>

        <div className="page-actions">
          <Link to="/recruitment/jobs" className="btn btn-secondary">
            <ArrowLeft size={16} /> All Jobs
          </Link>
          <Link to="/recruitment/applications" className="btn btn-primary">
            <Layers size={16} /> View Pipeline
          </Link>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Job Requisition ID
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
            {job.jobId}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Openings
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {job.openings} position(s)
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Compensation
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {job.salaryRange?.min > 0
              ? `${job.salaryRange.currency} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
              : 'Competitive'}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Applicants
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-text)', marginTop: '4px' }}>
            {applications.length} candidate(s)
          </div>
        </div>
      </div>

      {/* Description & Specs */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ gridColumn: 'span 2', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Role Overview</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
            {job.description}
          </p>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Key Responsibilities</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {job.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Qualifications & Requirements</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Hiring Specifications</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Department
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {job.department?.name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Employment Type
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {job.employmentType}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Location
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {job.location}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Posted Date
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Draft'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Posted By
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {job.createdBy ? `${job.createdBy.firstName} ${job.createdBy.lastName}` : 'System Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requisition Applicants Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Applicants for this Position ({applications.length})
          </h3>
          <Link to="/recruitment/applications" className="btn btn-sm btn-outline">
            <Layers size={14} /> Open Pipeline
          </Link>
        </div>

        {applications.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No candidates have applied for this position yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Contact</th>
                  <th>Current Stage</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {app.candidate?.candidateId}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div>{app.candidate?.email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.candidate?.phone}</div>
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
                    </td>
                    <td style={{ fontSize: '13px', textTransform: 'capitalize' }}>{app.status}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(app.applicationDate || app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/recruitment/applications/${app._id}`}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobOpeningDetailPage;
