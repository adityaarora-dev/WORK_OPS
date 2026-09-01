import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { getEmployees } from '../../services/employeeService';

export const HrDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployees({ limit: 5 })
      .then((res) => {
        setEmployees(res.data || []);
        if (res.pagination?.total) setTotal(res.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-view-wrapper">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Human Resources Operations</h1>
          <p className="page-sub-title">
            Employee directory, attendance monitoring, and leave administration.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/employees/new" className="btn-primary">
            <span>➕</span> Onboard Employee
          </Link>
        </div>
      </div>

      {/* HR Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Employees"
          value={total}
          icon="👥"
          color="purple"
          subtitle="Active workforce"
        />
        <StatCard
          title="Present Today"
          value="7"
          icon="✅"
          color="emerald"
          subtitle="Checked in by 10:00 AM"
        />
        <StatCard
          title="Absent Today"
          value="0"
          icon="❌"
          color="amber"
          subtitle="Unscheduled absences: 0"
        />
        <StatCard
          title="Employees On Leave"
          value="1"
          icon="📅"
          color="blue"
          subtitle="Approved leave calendar"
        />
        <StatCard
          title="Pending Leave Requests"
          value="2"
          icon="⏳"
          color="rose"
          subtitle="Awaiting HR review"
        />
      </div>

      {/* Main Grid */}
      <div className="dashboard-panels-grid">
        {/* Recent Employees */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Recent Employee Profiles</h3>
            <Link to="/employees" className="panel-link">
              Full Directory →
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
                      Loading directory...
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

        {/* HR Operations & Pending Requests */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>HR Action Center</h3>
            <span className="card-sub">Immediate Tasks</span>
          </div>

          <div className="action-items-list">
            <div className="action-item">
              <div className="action-icon">📋</div>
              <div className="action-details">
                <div className="action-title">Leave Request: Sarah Connor</div>
                <div className="action-sub">Annual Leave • 3 Days (Finance)</div>
              </div>
              <span className="pill-pending">Pending</span>
            </div>

            <div className="action-item">
              <div className="action-icon">📝</div>
              <div className="action-details">
                <div className="action-title">Document Verification: David Miller</div>
                <div className="action-sub">Contractor Tax Form W-9</div>
              </div>
              <span className="pill-pending">Review</span>
            </div>

            <div className="action-item">
              <div className="action-icon">🎉</div>
              <div className="action-details">
                <div className="action-title">Work Anniversary: Elena Rostova</div>
                <div className="action-sub">Engineering Department</div>
              </div>
              <span className="pill-info">Today</span>
            </div>
          </div>

          <div className="quick-nav-block mt-4">
            <div className="quick-nav-title">HR Management Tools</div>
            <div className="quick-nav-buttons">
              <Link to="/employees" className="quick-action-btn">
                <span>👥</span> Employee Directory
              </Link>
              <Link to="/leave" className="quick-action-btn">
                <span>📅</span> Leave Queue
              </Link>
              <Link to="/attendance" className="quick-action-btn">
                <span>⏱️</span> Daily Timesheets
              </Link>
              <Link to="/hr-analytics" className="quick-action-btn">
                <span>📊</span> Analytics
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HrDashboard;
