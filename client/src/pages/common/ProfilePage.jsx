import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
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
          const match =
            res.data.find(
              (e) =>
                e.email?.toLowerCase() === user?.email?.toLowerCase() ||
                e.employeeId === user?.employeeId
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

  const getInitials = () => {
    if (!user) return 'US';
    const f = user.firstName ? user.firstName[0] : '';
    const l = user.lastName ? user.lastName[0] : '';
    return (f + l).toUpperCase() || 'US';
  };

  return (
    <div className="profile-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">User Account Profile</h1>
          <p className="page-sub-title">
            Your verified identity, organizational credentials, and account details.
          </p>
        </div>
      </div>

      <div className="employee-hero-banner">
        <div className="employee-hero-main">
          <div className="employee-large-avatar">{getInitials()}</div>
          <div className="employee-hero-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>
                {user?.firstName} {user?.lastName}
              </h2>
              <span className="status-tag status-active">
                <span className="badge-dot"></span>
                ACTIVE SESSION
              </span>
            </div>
            <p className="employee-hero-sub">
              {employee?.designation || 'Staff Member'} •{' '}
              <strong>
                {(typeof employee?.department === 'object' && employee?.department !== null
                  ? employee?.department.name
                  : employee?.department) || 'Administration'}
              </strong>
            </p>
            <div className="employee-tags-row">
              <span className="code-pill">ID: {user?.employeeId || 'USR001'}</span>
              <span className="email-pill">
                <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {user?.email}
              </span>
              <span className={`role-badge badge-${user?.role}`}>
                ROLE: {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-panels-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Account & Authentication</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="metric-item">
                <span className="metric-label">Account Identifier</span>
                <span className="code-pill">{user?._id || user?.id}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Work Email</span>
                <span>{user?.email}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">System Role</span>
                <span className={`role-badge badge-${user?.role}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Security Protocol</span>
                <span className="badge badge-success">JWT HMAC-SHA256</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Organizational Assignment</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="metric-item">
                <span className="metric-label">Department</span>
                <span style={{ fontWeight: 600 }}>
                  {(typeof employee?.department === 'object' && employee?.department !== null
                    ? employee?.department.name
                    : employee?.department) || 'Executive Unit'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Official Title</span>
                <span>{employee?.designation || 'Specialist'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Employment Type</span>
                <span className="badge badge-info">{employee?.employmentType || 'Full-Time'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
