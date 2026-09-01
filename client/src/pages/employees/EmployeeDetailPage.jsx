import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getEmployeeById } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ForbiddenPage from '../../components/common/ForbiddenPage';

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const canEdit = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    let isMounted = true;
    getEmployeeById(id)
      .then((res) => {
        if (isMounted) {
          setEmployee(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving employee profile..." />;
  }

  if (error) {
    if (error.status === 403) {
      return <ForbiddenPage requiredRoles={['Authorized Manager or HR Admin']} />;
    }
    return (
      <div className="error-view-wrapper">
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error.message || 'Unable to retrieve employee profile.'}</span>
        </div>
        <button className="btn-secondary mt-4" onClick={() => navigate('/employees')}>
          ← Return to Directory
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="not-found-card">
        <h3>Employee Not Found</h3>
        <p>No employee record exists with the provided identifier.</p>
        <Link to="/employees" className="btn-primary mt-4">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="employee-detail-wrapper">
      {/* Top Breadcrumb & Controls */}
      <div className="detail-top-controls">
        <Link to="/employees" className="back-link">
          ← Back to Employee Directory
        </Link>
        {canEdit && (
          <Link to={`/employees/${employee._id}/edit`} className="btn-primary">
            <span>✏️</span> Edit Employee
          </Link>
        )}
      </div>

      {/* Hero Profile Banner */}
      <div className="profile-hero-card">
        <div className="hero-avatar">
          {employee.firstName?.[0]}
          {employee.lastName?.[0]}
        </div>

        <div className="hero-content">
          <div className="hero-title-row">
            <h2>
              {employee.firstName} {employee.lastName}
            </h2>
            <span className={`status-tag status-${employee.employmentStatus}`}>
              {employee.employmentStatus?.toUpperCase()}
            </span>
          </div>

          <p className="hero-designation">
            {employee.designation} • <strong>{employee.department}</strong>
          </p>

          <div className="hero-meta-pills">
            <span className="code-pill">ID: {employee.employeeId}</span>
            <span className="email-pill">✉️ {employee.email}</span>
            {employee.phone && <span className="phone-pill">📞 {employee.phone}</span>}
            <span className="type-pill">💼 {employee.employmentType}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="detail-tabs-bar">
        <button
          className={`detail-tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Profile Overview
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'employment' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('employment')}
        >
          🏢 Employment & Team
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'contact' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          📍 Address & Emergency
        </button>
        <button
          className={`detail-tab-btn tab-future ${activeTab === 'attendance' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          ⏱️ Attendance <span className="future-tag">Stage 4</span>
        </button>
        <button
          className={`detail-tab-btn tab-future ${activeTab === 'leave' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          📅 Leave & Time-Off <span className="future-tag">Stage 4</span>
        </button>
        <button
          className={`detail-tab-btn tab-future ${activeTab === 'payroll' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          💵 Payroll <span className="future-tag">Stage 5</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="tab-body-container">
        {activeTab === 'overview' && (
          <div className="tab-grid-two">
            <div className="info-card">
              <h4>Identity & Personal Info</h4>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-key">Full Name:</span>
                  <span className="info-value">{employee.firstName} {employee.lastName}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Employee ID:</span>
                  <span className="info-value font-mono font-bold text-blue-400">
                    {employee.employeeId}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Date of Birth:</span>
                  <span className="info-value">
                    {employee.dateOfBirth
                      ? new Date(employee.dateOfBirth).toLocaleDateString()
                      : 'Not specified'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Gender:</span>
                  <span className="info-value capitalize">{employee.gender || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h4>Employment Status Summary</h4>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-key">Status:</span>
                  <span className={`status-tag status-${employee.employmentStatus}`}>
                    {employee.employmentStatus}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Type:</span>
                  <span className="info-value capitalize">{employee.employmentType}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Date of Joining:</span>
                  <span className="info-value">
                    {employee.joiningDate
                      ? new Date(employee.joiningDate).toLocaleDateString()
                      : 'Not recorded'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Linked User Account:</span>
                  <span className="info-value">
                    {employee.user ? (
                      <span className="badge-green text-xs px-2 py-0.5 rounded">
                        Active Login Account
                      </span>
                    ) : (
                      <span className="text-muted text-xs">No web user linked</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="tab-grid-two">
            <div className="info-card">
              <h4>Organization & Role</h4>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-key">Department:</span>
                  <span className="info-value font-semibold">{employee.department}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Job Title / Designation:</span>
                  <span className="info-value">{employee.designation}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Work Arrangement:</span>
                  <span className="info-value capitalize">{employee.employmentType}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h4>Supervisor / Reporting Manager</h4>
              {employee.manager ? (
                <div className="manager-pill-card">
                  <div className="avatar-circle">
                    {employee.manager.firstName?.[0]}
                    {employee.manager.lastName?.[0]}
                  </div>
                  <div>
                    <div className="cell-primary">
                      {employee.manager.firstName} {employee.manager.lastName}
                    </div>
                    <div className="cell-secondary">{employee.manager.designation}</div>
                    <div className="text-xs text-muted">ID: {employee.manager.employeeId}</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-sm py-3">
                  This employee directly reports to the Executive / System Administrator.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="tab-grid-two">
            <div className="info-card">
              <h4>Contact & Address Details</h4>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-key">Primary Email:</span>
                  <span className="info-value">{employee.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Primary Phone:</span>
                  <span className="info-value">{employee.phone || 'Not recorded'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Alternate Phone:</span>
                  <span className="info-value">{employee.alternatePhone || 'Not recorded'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Street Address:</span>
                  <span className="info-value">{employee.address?.street || 'Not recorded'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">City, State, Zip:</span>
                  <span className="info-value">
                    {[employee.address?.city, employee.address?.state, employee.address?.postalCode]
                      .filter(Boolean)
                      .join(', ') || 'Not recorded'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Country:</span>
                  <span className="info-value">{employee.address?.country || 'United States'}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h4>Emergency Contact (Next of Kin)</h4>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-key">Contact Name:</span>
                  <span className="info-value font-semibold">
                    {employee.emergencyContact?.name || 'Not recorded'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Contact Phone:</span>
                  <span className="info-value">
                    {employee.emergencyContact?.phone || 'Not recorded'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-key">Relationship:</span>
                  <span className="info-value">
                    {employee.emergencyContact?.relationship || 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {['attendance', 'leave', 'payroll'].includes(activeTab) && (
          <div className="future-module-card">
            <div className="future-icon">🚀</div>
            <h3>Module Scheduled for Next Stage</h3>
            <p>
              The <strong>{activeTab.toUpperCase()}</strong> records for employee{' '}
              <strong>{employee.firstName} {employee.lastName}</strong> ({employee.employeeId}) will be
              fully integrated in the upcoming HR Management System stages.
            </p>
            <div className="future-badge">Schema & Relations Prepared</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
