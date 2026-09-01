import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import { getEmployees } from '../../services/employeeService';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getEmployees()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProfile(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard-view-wrapper">
      {/* Employee Welcome Card */}
      <div className="employee-hero-banner">
        <div className="employee-hero-main">
          <div className="employee-large-avatar">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="employee-hero-details">
            <h2>Welcome back, {user?.firstName} {user?.lastName}!</h2>
            <p className="employee-hero-sub">
              {profile?.designation || 'Staff Member'} • {profile?.department || 'Operations'}
            </p>
            <div className="employee-tags-row">
              <span className="code-pill">ID: {user?.employeeId}</span>
              <span className="email-pill">{user?.email}</span>
              <span className="status-tag status-active">● Active Status</span>
            </div>
          </div>
        </div>

        <div className="hero-action-buttons">
          <Link to="/profile" className="btn-primary">
            <span>👤</span> View Full Profile
          </Link>
        </div>
      </div>

      {/* Employee Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Today's Attendance"
          value="Checked In"
          icon="⏱️"
          color="emerald"
          subtitle="Timestamp: 09:02 AM (On Time)"
        />
        <StatCard
          title="Annual Leave"
          value="14 Days"
          icon="🌴"
          color="blue"
          subtitle="Remaining for this calendar year"
        />
        <StatCard
          title="Sick Leave"
          value="7 Days"
          icon="🏥"
          color="purple"
          subtitle="Full pay entitlement"
        />
        <StatCard
          title="Casual Leave"
          value="3 Days"
          icon="📅"
          color="amber"
          subtitle="Available for immediate request"
        />
      </div>

      {/* Self Service Quick Actions & Recent Activity */}
      <div className="dashboard-panels-grid">
        {/* Quick Self-Service Portal */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Quick Self-Service Actions</h3>
            <span className="card-sub">Employee Hub</span>
          </div>

          <div className="employee-quick-grid">
            <Link to="/profile" className="self-service-tile">
              <span className="tile-icon">👤</span>
              <span className="tile-title">My Profile</span>
              <span className="tile-desc">View personal & employment records</span>
            </Link>

            <Link to="/leave" className="self-service-tile">
              <span className="tile-icon">📅</span>
              <span className="tile-title">Apply for Leave</span>
              <span className="tile-desc">Submit new time-off requests</span>
            </Link>

            <Link to="/attendance" className="self-service-tile">
              <span className="tile-icon">⏱️</span>
              <span className="tile-title">My Attendance</span>
              <span className="tile-desc">Daily logs & monthly timesheets</span>
            </Link>

            <Link to="/payroll" className="self-service-tile">
              <span className="tile-icon">💵</span>
              <span className="tile-title">My Payroll</span>
              <span className="tile-desc">View paystubs & tax summaries</span>
            </Link>

            <Link to="/documents" className="self-service-tile">
              <span className="tile-icon">📁</span>
              <span className="tile-title">My Documents</span>
              <span className="tile-desc">Offer letters & company policies</span>
            </Link>

            <Link to="/performance" className="self-service-tile">
              <span className="tile-icon">📈</span>
              <span className="tile-title">My Performance</span>
              <span className="tile-desc">KPIs & quarterly evaluation reviews</span>
            </Link>
          </div>
        </section>

        {/* Activity & Notifications */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Recent Activity & Updates</h3>
            <span className="live-pulse">● Updated</span>
          </div>

          <div className="action-items-list">
            <div className="action-item">
              <div className="action-icon">✅</div>
              <div className="action-details">
                <div className="action-title">Clock-in Recorded</div>
                <div className="action-sub">Today at 09:02 AM • Biometric/Web</div>
              </div>
              <span className="pill-success">Success</span>
            </div>

            <div className="action-item">
              <div className="action-icon">💵</div>
              <div className="action-details">
                <div className="action-title">Paystub Available</div>
                <div className="action-sub">Previous Month Salary Slip Disbursed</div>
              </div>
              <span className="pill-info">Verified</span>
            </div>

            <div className="action-item">
              <div className="action-icon">📑</div>
              <div className="action-details">
                <div className="action-title">HR Policy Update</div>
                <div className="action-sub">Updated Remote Work Guidelines 2026</div>
              </div>
              <span className="pill-info">Read</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
