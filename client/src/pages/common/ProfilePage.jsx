import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getEmployees } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployees()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          // In employee/manager mode, the first/only record is self
          const match = res.data.find(
            (e) => e.email?.toLowerCase() === user?.email?.toLowerCase() || e.employeeId === user?.employeeId
          ) || res.data[0];
          setEmployee(match);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading your profile credentials..." />;
  }

  return (
    <div className="profile-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Personal Profile</h1>
          <p className="page-sub-title">
            Your verified identity, organizational credentials, and account details.
          </p>
        </div>
      </div>

      <div className="profile-hero-card">
        <div className="hero-avatar">
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </div>
        <div className="hero-content">
          <div className="hero-title-row">
            <h2>{user?.firstName} {user?.lastName}</h2>
            <span className={`status-tag status-active`}>ACTIVE ACCOUNT</span>
          </div>
          <p className="hero-designation">
            {employee?.designation || 'Staff Member'} • <strong>{employee?.department || 'Administration'}</strong>
          </p>
          <div className="hero-meta-pills">
            <span className="code-pill">ID: {user?.employeeId}</span>
            <span className="email-pill">✉️ {user?.email}</span>
            <span className={`role-badge badge-${user?.role}`}>
              ROLE: {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-panels-grid mt-6">
        <div className="info-card">
          <h4>Account & Authentication</h4>
          <div className="info-table">
            <div className="info-row">
              <span className="info-key">User ID:</span>
              <span className="info-value font-mono text-xs">{user?._id || user?.id}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Role:</span>
              <span className="info-value uppercase font-bold text-blue-400">{user?.role}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Security Protocol:</span>
              <span className="info-value">JWT HMAC-SHA256 Token</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h4>Organizational Assignment</h4>
          <div className="info-table">
            <div className="info-row">
              <span className="info-key">Department:</span>
              <span className="info-value font-semibold">{employee?.department || 'Executive'}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Job Title:</span>
              <span className="info-value">{employee?.designation || 'Specialist'}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Work Type:</span>
              <span className="info-value capitalize">{employee?.employmentType || 'Full-time'}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Contact Phone:</span>
              <span className="info-value">{employee?.phone || 'Not recorded'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
