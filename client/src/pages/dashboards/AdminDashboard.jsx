import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { getEmployees } from '../../services/employeeService';

export const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployees({ limit: 5 })
      .then((res) => {
        setEmployees(res.data || []);
        if (res.pagination?.total) setTotalEmployees(res.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-view-wrapper">
      {/* Welcome Header */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Executive Administration Console</h1>
          <p className="page-sub-title">
            Enterprise system health, workforce metrics, and security governance.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/employees/new" className="btn-primary">
            <span>➕</span> Add New Employee
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon="👥"
          color="blue"
          trend={{ positive: true, text: '+12% this quarter' }}
        />
        <StatCard
          title="Total Users"
          value="5"
          icon="🔑"
          color="purple"
          subtitle="4 active roles provisioned"
        />
        <StatCard
          title="Departments"
          value="6"
          icon="🏢"
          color="emerald"
          subtitle="All active units"
        />
        <StatCard
          title="Present Today"
          value="7"
          icon="⏱️"
          color="emerald"
          trend={{ positive: true, text: '87.5% attendance' }}
        />
        <StatCard
          title="On Leave"
          value="1"
          icon="📅"
          color="amber"
          subtitle="Approved scheduled leaves"
        />
        <StatCard
          title="Pending Requests"
          value="3"
          icon="⏳"
          color="rose"
          subtitle="Requires HR / Manager sign-off"
        />
      </div>

      {/* Main Grid */}
      <div className="dashboard-panels-grid">
        {/* Recent Employees Table */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Recent Workforce Additions</h3>
            <Link to="/employees" className="panel-link">
              View All Employees →
            </Link>
          </div>

          <div className="panel-table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Loading employee records...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No employees registered yet.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="avatar-circle">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div>
                            <div className="cell-primary">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="cell-secondary">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="code-pill">{emp.employeeId}</span>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>
                        <span className={`status-tag status-${emp.employmentStatus}`}>
                          {emp.employmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* System Health & Activity Overview */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>System Status & Security</h3>
            <span className="live-pulse">● LIVE</span>
          </div>

          <div className="system-metrics-list">
            <div className="metric-item">
              <span className="metric-label">Authentication Layer</span>
              <span className="metric-badge badge-green">JWT HS256 (24h expiry)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Password Protection</span>
              <span className="metric-badge badge-green">bcrypt (10 rounds)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Access Control Model</span>
              <span className="metric-badge badge-green">Hierarchical RBAC</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Cloud Database</span>
              <span className="metric-badge badge-green">MongoDB Atlas Connected</span>
            </div>
          </div>

          <div className="quick-nav-block">
            <div className="quick-nav-title">Quick Administration Actions</div>
            <div className="quick-nav-buttons">
              <Link to="/employees/new" className="quick-action-btn">
                <span>➕</span> Add Employee
              </Link>
              <Link to="/departments" className="quick-action-btn">
                <span>🏢</span> Manage Departments
              </Link>
              <Link to="/reports" className="quick-action-btn">
                <span>📑</span> Executive Reports
              </Link>
              <Link to="/system-admin" className="quick-action-btn">
                <span>⚙️</span> System Config
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
