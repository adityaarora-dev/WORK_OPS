import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CalendarDays,
  HeartPulse,
  User,
  Banknote,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import ActionQueue from '../../components/common/ActionQueue';
import { getEmployees } from '../../services/employeeService';
import { getAttendance } from '../../services/attendanceService';
import { getLeaves } from '../../services/leaveService';
import { getPayroll } from '../../services/payrollService';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [todayAtt, setTodayAtt] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [latestPay, setLatestPay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      getEmployees(),
      getAttendance(),
      getLeaves(),
      getPayroll(),
    ]).then(([empRes, attRes, leaveRes, payRes]) => {
      if (!isMounted) return;

      if (empRes.status === 'fulfilled' && empRes.value?.data?.length > 0) {
        setProfile(empRes.value.data[0]);
      }

      if (attRes.status === 'fulfilled' && attRes.value?.data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const record = attRes.value.data.find(
          (a) => a.date && a.date.split('T')[0] === todayStr
        );
        setTodayAtt(record || null);
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value?.data) {
        setLeaves(leaveRes.value.data || []);
      }

      if (payRes.status === 'fulfilled' && payRes.value?.data?.length > 0) {
        setLatestPay(payRes.value.data[0]);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getInitials = () => {
    if (!user) return 'EM';
    const f = user.firstName ? user.firstName[0] : '';
    const l = user.lastName ? user.lastName[0] : '';
    return (f + l).toUpperCase() || 'EM';
  };

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  const employeeActions = [];

  if (!todayAtt) {
    employeeActions.push({
      title: 'Shift Not Clocked In',
      description: 'You have not recorded your daily attendance check-in yet.',
      badge: 'Action Required',
      variant: 'warning',
      icon: Clock,
      to: '/attendance',
      actionLabel: 'Clock In Now',
    });
  } else {
    employeeActions.push({
      title: 'Daily Attendance Recorded',
      description: todayAtt.checkIn
        ? `Shift active since ${new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : 'Daily shift recorded on schedule.',
      badge: 'Active Shift',
      variant: 'success',
      icon: CheckCircle2,
      to: '/attendance',
      actionLabel: 'View Timesheet',
    });
  }

  if (pendingLeaves.length > 0) {
    employeeActions.push({
      title: 'Pending Leave Request',
      description: `${pendingLeaves.length} leave application awaiting manager review.`,
      badge: 'In Review',
      variant: 'warning',
      icon: CalendarDays,
      to: '/leave',
      actionLabel: 'Check Status',
    });
  } else {
    employeeActions.push({
      title: 'Apply for Leave',
      description: 'Submit scheduled time-off, vacation, or medical leave requests.',
      badge: 'Time Off',
      variant: 'primary',
      icon: CalendarDays,
      to: '/leave',
      actionLabel: 'Apply Leave',
    });
  }

  if (latestPay) {
    employeeActions.push({
      title: 'Monthly Salary Statement',
      description: `Verified earnings statement available for Pay Period ${latestPay.payPeriod?.month}/${latestPay.payPeriod?.year}.`,
      badge: 'Paystub',
      variant: 'primary',
      icon: Banknote,
      to: '/payroll',
      actionLabel: 'View Statement',
    });
  } else {
    employeeActions.push({
      title: 'Monthly Payroll',
      description: 'No payroll generated yet. Digital paystubs will appear once processed.',
      badge: 'Status',
      variant: 'primary',
      icon: Banknote,
      to: '/payroll',
      actionLabel: 'Open Payroll',
    });
  }

  return (
    <div className="dashboard-view-wrapper">
      {/* Hero Section */}
      <div className="employee-hero-banner">
        <div className="employee-hero-main">
          <div className="employee-large-avatar">{getInitials()}</div>
          <div className="employee-hero-details">
            <h2>Welcome back, {user?.firstName} {user?.lastName}</h2>
            <p className="employee-hero-sub">
              {currentDateStr} • {profile?.designation || 'Staff'} •{' '}
              {(typeof profile?.department === 'object' && profile?.department !== null
                ? profile?.department.name
                : profile?.department) || 'Corporate Unit'}
            </p>
            <div className="employee-tags-row">
              <span className="code-pill">ID: {user?.employeeId || 'EMP019'}</span>
              <span className="email-pill">{user?.email}</span>
              <span className="status-tag status-active">
                <span className="badge-dot"></span>
                Active Staff
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <Link to="/profile" className="btn btn-secondary">
            <User size={15} />
            <span>My Profile</span>
          </Link>
          <Link to="/leave" className="btn btn-primary">
            <CalendarDays size={15} />
            <span>Request Leave</span>
          </Link>
        </div>
      </div>

      {/* 4 Compact Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="TODAY'S SHIFT"
          value={todayAtt?.workHours ? `${todayAtt.workHours}h` : (todayAtt ? 'Present' : 'Not Clocked In')}
          icon={<Clock size={16} />}
          subtitle={
            todayAtt?.checkIn
              ? `In: ${new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Shift has not started'
          }
        />
        <StatCard
          title="LEAVE REQUESTS"
          value={leaves.length > 0 ? `${leaves.length}` : '0'}
          icon={<CalendarDays size={16} />}
          subtitle={leaves.length > 0 ? `${leaves.filter((l) => l.status === 'approved').length} approved` : 'No leave requests yet'}
        />
        <StatCard
          title="PENDING APPROVALS"
          value={pendingLeaves.length}
          icon={<HeartPulse size={16} />}
          subtitle={pendingLeaves.length > 0 ? 'Awaiting manager sign-off' : 'No pending requests'}
        />
        <StatCard
          title="LATEST PAYSLIP"
          value={latestPay ? 'Disbursed' : 'None'}
          icon={<Banknote size={16} />}
          subtitle={latestPay ? `Period ${latestPay.payPeriod?.month}/${latestPay.payPeriod?.year}` : 'No payroll generated yet'}
        />
      </div>

      {/* Action Needed Today (Action Queue Tray) */}
      <ActionQueue
        title="Workspace Overview"
        subtitle="Self-service status and shortcuts"
        items={employeeActions}
      />

      {/* Self Service Quick Actions & Shortcuts */}
      <div className="dashboard-panels-grid">
        {/* Quick Self-Service Portal */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Self-Service Actions</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1-Click Shortcuts</span>
          </div>

          <div className="employee-quick-grid">
            <Link to="/leave" className="self-service-tile">
              <div className="tile-icon">
                <CalendarDays size={16} />
              </div>
              <span className="tile-title">Time Off (Leaves)</span>
              <span className="tile-desc">Submit vacation, casual, or medical request</span>
            </Link>

            <Link to="/attendance" className="self-service-tile">
              <div className="tile-icon">
                <Clock size={16} />
              </div>
              <span className="tile-title">Timesheet & Clock-In</span>
              <span className="tile-desc">Review attendance timestamps & logs</span>
            </Link>

            <Link to="/payroll" className="self-service-tile">
              <div className="tile-icon">
                <Banknote size={16} />
              </div>
              <span className="tile-title">Digital Paystubs</span>
              <span className="tile-desc">Inspect compensation breakdown and slips</span>
            </Link>

            <Link to="/profile" className="self-service-tile">
              <div className="tile-icon">
                <FileText size={16} />
              </div>
              <span className="tile-title">Documents & Profile</span>
              <span className="tile-desc">Personal details and tax forms</span>
            </Link>
          </div>
        </section>

        {/* Corporate Policies & Help */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Staff Guidelines</h3>
            <span className="status-tag status-active" style={{ fontSize: '11px' }}>
              <span className="badge-dot"></span>
              Compliant
            </span>
          </div>

          <div className="system-metrics-list">
            <div className="metric-item">
              <span className="metric-label">Core Working Hours</span>
              <span className="metric-badge">09:00 - 18:00</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Leave Notice Period</span>
              <span className="metric-badge">48h in advance</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Payroll Cutoff</span>
              <span className="metric-badge">25th of month</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Direct Reporting</span>
              <span className="metric-badge">Manager Approved</span>
            </div>
          </div>

          <div className="quick-nav-block">
            <div className="quick-nav-title">Quick Actions</div>
            <div className="quick-nav-buttons">
              <Link to="/leave" className="quick-action-btn">
                <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
                <span>Apply Leave</span>
              </Link>
              <Link to="/payroll" className="quick-action-btn">
                <Banknote size={14} style={{ color: 'var(--primary)' }} />
                <span>Payslip</span>
              </Link>
              <Link to="/profile" className="quick-action-btn">
                <User size={14} style={{ color: 'var(--primary)' }} />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
