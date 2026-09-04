import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  CalendarDays,
  Clock,
  UserPlus,
  ArrowRight,
  Banknote,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import ActionQueue from '../../components/common/ActionQueue';
import { getEmployees } from '../../services/employeeService';
import { getLeaves } from '../../services/leaveService';
import { getAttendance } from '../../services/attendanceService';

export const HrDashboard = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [totalWorkforce, setTotalWorkforce] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeavesToday, setApprovedLeavesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      getEmployees({ limit: 10 }),
      getLeaves(),
      getAttendance(),
    ]).then(([empRes, leaveRes, attRes]) => {
      if (!isMounted) return;

      if (empRes.status === 'fulfilled' && empRes.value) {
        setEmployees(empRes.value.data || []);
        setTotalWorkforce(empRes.value.pagination?.total || empRes.value.data?.length || 0);
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value?.data) {
        const allLeaves = leaveRes.value.data;
        setPendingLeaves(allLeaves.filter((l) => l.status === 'pending'));
        const todayStr = new Date().toISOString().split('T')[0];
        const onLeaveToday = allLeaves.filter(
          (l) =>
            l.status === 'approved' &&
            l.startDate &&
            l.endDate &&
            l.startDate.split('T')[0] <= todayStr &&
            l.endDate.split('T')[0] >= todayStr
        ).length;
        setApprovedLeavesToday(onLeaveToday);
      }

      if (attRes.status === 'fulfilled' && attRes.value?.data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const present = attRes.value.data.filter(
          (a) => a.date && a.date.split('T')[0] === todayStr && a.status === 'present'
        ).length;
        setPresentToday(present);
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

  const hrActions = [];

  if (pendingLeaves.length > 0) {
    hrActions.push({
      title: 'Pending Leave Approvals',
      description: `${pendingLeaves.length} employee leave application(s) awaiting administrative sign-off.`,
      badge: 'Time Off',
      variant: 'warning',
      icon: CalendarDays,
      to: '/leave',
      actionLabel: 'Review Leaves',
    });
  } else {
    hrActions.push({
      title: 'Leave Requests Up to Date',
      description: 'All employee leave applications are currently reviewed and processed.',
      badge: 'Up to Date',
      variant: 'success',
      icon: CheckCircle2,
      to: '/leave',
      actionLabel: 'View Leave Logs',
    });
  }

  hrActions.push({
    title: 'Monthly Payroll Hub',
    description: 'Manage salary structures, deductions, taxes, and monthly payment vouchers.',
    badge: 'Payroll',
    variant: 'primary',
    icon: Banknote,
    to: '/payroll',
    actionLabel: 'Process Payroll',
  });

  hrActions.push({
    title: 'Talent Acquisition & ATS',
    description: 'Manage active job postings, evaluate candidate applications, and schedule interviews.',
    badge: 'Hiring',
    variant: 'primary',
    icon: UserPlus,
    to: '/recruitment',
    actionLabel: 'Open ATS Hub',
  });

  return (
    <div className="dashboard-view-wrapper">
      {/* Hero Section */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            Welcome, {user?.firstName || 'HR Specialist'}
          </h1>
          <p className="page-sub-title">
            {currentDateStr} • Workforce directory, payroll disbursement, leaves, and candidate hiring.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/employees/new" className="btn btn-primary">
            <UserPlus size={15} />
            <span>Onboard Employee</span>
          </Link>
        </div>
      </div>

      {/* 4 Compact Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="TOTAL WORKFORCE"
          value={totalWorkforce}
          icon={<Users size={16} />}
          subtitle="Active team members"
        />
        <StatCard
          title="PRESENT TODAY"
          value={presentToday}
          icon={<CheckCircle2 size={16} />}
          subtitle={presentToday > 0 ? `${presentToday} logged shifts` : 'No attendance recorded today'}
        />
        <StatCard
          title="PENDING APPROVALS"
          value={pendingLeaves.length}
          icon={<Clock size={16} />}
          subtitle={pendingLeaves.length > 0 ? 'Awaiting final sign-off' : 'All requests up to date'}
        />
        <StatCard
          title="ON LEAVE TODAY"
          value={approvedLeavesToday}
          icon={<CalendarDays size={16} />}
          subtitle={approvedLeavesToday > 0 ? 'Approved PTO today' : 'Full attendance expected'}
        />
      </div>

      {/* Action Needed Today (Action Queue Tray) */}
      <ActionQueue
        title="Workforce Operations Queue"
        subtitle="Priority tasks and administrative shortcuts"
        items={hrActions}
      />

      {/* Main Grid */}
      <div className="dashboard-panels-grid">
        {/* Recent Organizational Additions (Section 4 Restructure) */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Recent Organizational Additions</h3>
            <Link to="/employees" className="panel-link">
              Directory <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>

          <div className="panel-table-responsive">
            <table className="custom-data-table recent-additions-table">
              <thead>
                <tr>
                  <th>Employee</th>
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
                      Loading employee directory records...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No recent additions recorded.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div className="employee-combined-cell">
                          <div className="employee-combined-avatar">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div className="employee-combined-meta">
                            <span className="employee-combined-id">{emp.employeeId}</span>
                            <span className="employee-combined-name">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="employee-combined-sub">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {emp.designation || 'Specialist'}
                        </span>
                      </td>
                      <td>
                        {typeof emp.department === 'object' && emp.department !== null
                          ? emp.department.name
                          : (emp.department || 'General')}
                      </td>
                      <td>
                        <span className={`status-tag status-${emp.employmentStatus || 'active'}`}>
                          <span className="badge-dot"></span>
                          {emp.employmentStatus || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/employees/${emp._id}`}
                          className="btn-table-action"
                        >
                          Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* HR Quick Actions */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>HR People Operations</h3>
            <span className="status-tag status-active" style={{ fontSize: '11px' }}>
              <span className="badge-dot"></span>
              Active
            </span>
          </div>

          <div className="system-metrics-list">
            <div className="metric-item">
              <span className="metric-label">Payroll Schedule</span>
              <span className="metric-badge">Monthly (End of Month)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Default Work Hours</span>
              <span className="metric-badge">09:00 - 18:00 (Mon-Fri)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Leave Policy</span>
              <span className="metric-badge">24 Days Annual PTO</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Onboarding Status</span>
              <span className="metric-badge">100% Compliant</span>
            </div>
          </div>

          <div className="quick-nav-block">
            <div className="quick-nav-title">Quick Operations</div>
            <div className="quick-nav-buttons">
              <Link to="/employees/new" className="quick-action-btn">
                <UserPlus size={14} style={{ color: 'var(--primary)' }} />
                <span>Onboard</span>
              </Link>
              <Link to="/payroll" className="quick-action-btn">
                <Banknote size={14} style={{ color: 'var(--primary)' }} />
                <span>Payroll</span>
              </Link>
              <Link to="/recruitment" className="quick-action-btn">
                <Users size={14} style={{ color: 'var(--primary)' }} />
                <span>Recruitment</span>
              </Link>
              <Link to="/leave" className="quick-action-btn">
                <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
                <span>Leaves</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HrDashboard;
