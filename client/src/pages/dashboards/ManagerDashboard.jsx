import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { getEmployees } from '../../services/employeeService';

export const ManagerDashboard = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployees()
      .then((res) => {
        setTeam(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-view-wrapper">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Engineering Team Command</h1>
          <p className="page-sub-title">
            Team attendance tracking, leave request approvals, and performance reviews.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/employees" className="btn-primary">
            <span>👥</span> View My Team
          </Link>
        </div>
      </div>

      {/* Manager KPI Stats */}
      <div className="stats-grid">
        <StatCard
          title="Team Size"
          value={team.length || 3}
          icon="👥"
          color="blue"
          subtitle="Direct reports & team"
        />
        <StatCard
          title="Present Today"
          value={team.length || 3}
          icon="⏱️"
          color="emerald"
          subtitle="100% on duty today"
        />
        <StatCard
          title="Team Members On Leave"
          value="0"
          icon="📅"
          color="purple"
          subtitle="No current absences"
        />
        <StatCard
          title="Pending Team Requests"
          value="1"
          icon="⏳"
          color="amber"
          subtitle="1 leave request to review"
        />
      </div>

      {/* Main Grid */}
      <div className="dashboard-panels-grid">
        {/* Team Members Roster */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>My Team Roster</h3>
            <span className="card-sub">{team.length} direct reports</span>
          </div>

          <div className="panel-table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>ID</th>
                  <th>Role / Designation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Loading team data...
                    </td>
                  </tr>
                ) : team.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No team members assigned yet.
                    </td>
                  </tr>
                ) : (
                  team.map((emp) => (
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
                      <td>{emp.designation}</td>
                      <td>
                        <span className={`status-tag status-${emp.employmentStatus}`}>
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/employees/${emp._id}`}
                          className="table-action-link"
                        >
                          Profile →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Team Review Section */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Team Leave Approvals</h3>
            <span className="badge-amber text-xs px-2 py-1 rounded">1 Pending</span>
          </div>

          <div className="action-items-list">
            <div className="action-item">
              <div className="action-icon">📅</div>
              <div className="action-details">
                <div className="action-title">Jane Employee (Frontend)</div>
                <div className="action-sub">Casual Leave: Next Friday (1 Day)</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-xs btn-approve">Approve</button>
                <button className="btn-xs btn-reject">Decline</button>
              </div>
            </div>
          </div>

          <div className="quick-nav-block mt-4">
            <div className="quick-nav-title">Manager Tools</div>
            <div className="quick-nav-buttons">
              <Link to="/attendance" className="quick-action-btn">
                <span>⏱️</span> Team Attendance
              </Link>
              <Link to="/leave" className="quick-action-btn">
                <span>📅</span> Team Leave
              </Link>
              <Link to="/performance" className="quick-action-btn">
                <span>📈</span> Performance Reviews
              </Link>
              <Link to="/reports" className="quick-action-btn">
                <span>📑</span> Team Summary
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
