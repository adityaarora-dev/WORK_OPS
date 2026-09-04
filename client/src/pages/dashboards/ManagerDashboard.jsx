import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  CalendarDays,
  Clock,
  TrendingUp,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import ActionQueue from '../../components/common/ActionQueue';
import { getEmployees } from '../../services/employeeService';
import { getLeaves } from '../../services/leaveService';
import { getAttendance } from '../../services/attendanceService';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      getEmployees(),
      getLeaves({ status: 'pending' }),
      getAttendance(),
    ]).then(([empRes, leaveRes, attRes]) => {
      if (!isMounted) return;

      if (empRes.status === 'fulfilled' && empRes.value?.data) {
        setTeam(empRes.value.data);
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value?.data) {
        setPendingLeaves(leaveRes.value.data.filter((l) => l.status === 'pending'));
      }

      if (attRes.status === 'fulfilled' && attRes.value?.data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const presentCount = attRes.value.data.filter(
          (a) => a.date && a.date.split('T')[0] === todayStr && a.status === 'present'
        ).length;
        setTodayAttendanceCount(presentCount);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const managerActions = [];

  if (pendingLeaves.length > 0) {
    pendingLeaves.slice(0, 3).forEach((leave) => {
      const empName = leave.employee
        ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
        : 'Team Member';
      managerActions.push({
        title: `Leave Request: ${empName}`,
        description: `${leave.leaveType?.toUpperCase()} leave for ${leave.numberOfDays || 1} day(s). Reason: ${leave.reason || 'Not specified'}.`,
        badge: 'Pending Review',
        variant: 'warning',
        icon: Clock,
        to: '/leave',
        actionLabel: 'Review',
      });
    });
  } else {
    managerActions.push({
      title: 'No Pending Leave Requests',
      description: 'All employee leave applications for your team have been processed.',
      badge: 'Up to Date',
      variant: 'success',
      icon: CheckCircle2,
      to: '/leave',
      actionLabel: 'View Leave Logs',
    });
  }

  managerActions.push({
    title: 'Team Attendance Overview',
    description: `${todayAttendanceCount} team member(s) recorded shifts today.`,
    badge: 'Daily Roster',
    variant: todayAttendanceCount > 0 ? 'success' : 'primary',
    icon: CheckCircle2,
    to: '/attendance',
    actionLabel: 'Inspect Logs',
  });

  managerActions.push({
    title: 'Team Performance & Objectives',
    description: 'Track team goals, assign key results, and submit cycle evaluations.',
    badge: 'Evaluations',
    variant: 'primary',
    icon: TrendingUp,
    to: '/performance',
    actionLabel: 'Evaluate Team',
  });

  return (
    <div className="dashboard-view-wrapper">
      {/* Hero Section */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            Welcome, {user?.firstName || 'Manager'}
          </h1>
          <p className="page-sub-title">
            {currentDateStr} • Team attendance monitoring, leave approvals, and direct report performance.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/leave" className="btn btn-primary">
            <ClipboardCheck size={15} />
            <span>Approve Leaves</span>
          </Link>
        </div>
      </div>

      {/* 4 Compact Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="ASSIGNED TEAM SIZE"
          value={team.length}
          icon={<Users size={16} />}
          subtitle="Direct reports & members"
        />
        <StatCard
          title="CHECKED IN TODAY"
          value={todayAttendanceCount}
          icon={<CheckCircle2 size={16} />}
          subtitle={todayAttendanceCount > 0 ? 'Active on-duty today' : 'No check-ins yet today'}
        />
        <StatCard
          title="PENDING APPROVALS"
          value={pendingLeaves.length}
          icon={<Clock size={16} />}
          subtitle={pendingLeaves.length > 0 ? 'Requires your sign-off' : 'All requests reviewed'}
        />
        <StatCard
          title="ACTIVE APPRAISALS"
          value={team.length}
          icon={<TrendingUp size={16} />}
          subtitle="Team members under review"
        />
      </div>

      {/* Action Needed Today (Action Queue Tray) */}
      <ActionQueue
        title="Priority Manager Decisions"
        subtitle="Pending approvals and operational tasks"
        items={managerActions}
      />

      {/* Main Grid */}
      <div className="dashboard-panels-grid">
        {/* Team Members Roster (Section 4 Restructure) */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Direct Reports & Team Members</h3>
            <Link to="/employees" className="panel-link">
              Full Roster <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>

          <div className="panel-table-responsive">
            <table className="custom-data-table recent-additions-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Loading team members...
                    </td>
                  </tr>
                ) : team.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No team members assigned.
                    </td>
                  </tr>
                ) : (
                  team.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <div className="employee-combined-cell">
                          <div className="employee-combined-avatar">
                            {member.firstName?.[0]}
                            {member.lastName?.[0]}
                          </div>
                          <div className="employee-combined-meta">
                            <span className="employee-combined-id">{member.employeeId}</span>
                            <span className="employee-combined-name">
                              {member.firstName} {member.lastName}
                            </span>
                            <span className="employee-combined-sub">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {member.designation || 'Engineer'}
                        </span>
                      </td>
                      <td>
                        {typeof member.department === 'object' && member.department !== null
                          ? member.department.name
                          : (member.department || 'Engineering')}
                      </td>
                      <td>
                        <span className={`status-tag status-${member.employmentStatus || 'active'}`}>
                          <span className="badge-dot"></span>
                          {member.employmentStatus || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/employees/${member._id}`}
                          className="btn-table-action"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Manager Quick Guidelines */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Team Leadership Focus</h3>
            <span className="status-tag status-active" style={{ fontSize: '11px' }}>
              <span className="badge-dot"></span>
              On Track
            </span>
          </div>

          <div className="system-metrics-list">
            <div className="metric-item">
              <span className="metric-label">Review Cadence</span>
              <span className="metric-badge">Bi-weekly 1-on-1s</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Leave SLA</span>
              <span className="metric-badge">24h Response Goal</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Team Velocity</span>
              <span className="metric-badge">94% Sprint Goal</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Overtime Status</span>
              <span className="metric-badge">Standard (0h)</span>
            </div>
          </div>

          <div className="quick-nav-block">
            <div className="quick-nav-title">Manager Actions</div>
            <div className="quick-nav-buttons">
              <Link to="/leave" className="quick-action-btn">
                <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
                <span>Approvals</span>
              </Link>
              <Link to="/performance" className="quick-action-btn">
                <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                <span>Performance</span>
              </Link>
              <Link to="/employees" className="quick-action-btn">
                <Users size={14} style={{ color: 'var(--primary)' }} />
                <span>My Team</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
