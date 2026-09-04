import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  Shield,
  Settings,
  UserPlus,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import ActionQueue from '../../components/common/ActionQueue';
import { getEmployees } from '../../services/employeeService';
import { getDepartments } from '../../services/departmentService';
import { getAttendance } from '../../services/attendanceService';
import api from '../../services/api';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      getEmployees({ limit: 5 }),
      getDepartments(),
      getAttendance(),
      api.get('/admin/users'),
    ]).then(([empRes, deptRes, attRes, userRes]) => {
      if (!isMounted) return;

      if (empRes.status === 'fulfilled' && empRes.value) {
        setEmployees(empRes.value.data || []);
        setTotalEmployees(empRes.value.pagination?.total || empRes.value.data?.length || 0);
      }

      if (deptRes.status === 'fulfilled' && deptRes.value?.data) {
        setTotalDepartments(deptRes.value.data.length);
      }

      if (attRes.status === 'fulfilled' && attRes.value?.data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const count = attRes.value.data.filter(
          (a) => a.date && a.date.split('T')[0] === todayStr && a.status === 'present'
        ).length;
        setPresentToday(count);
      }

      if (userRes.status === 'fulfilled' && userRes.value?.data?.data) {
        setTotalUsers(userRes.value.data.data.length);
      } else {
        setTotalUsers(totalEmployees || 10);
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

  const adminActions = [
    {
      title: 'Security & Access Audit',
      description: 'Review privileged access logs, IP signatures, and active authorization events.',
      badge: 'Security',
      variant: 'primary',
      icon: Shield,
      to: '/audit-logs',
      actionLabel: 'Inspect Logs',
    },
    {
      title: 'Workforce Accounts & Roles',
      description: `${totalUsers || 'Configured'} user accounts provisioned across Executive, HR, Manager, and Employee tiers.`,
      badge: 'Governance',
      variant: 'primary',
      icon: ShieldCheck,
      to: '/admin/users',
      actionLabel: 'Manage Users',
    },
    {
      title: 'Department Structure',
      description: `${totalDepartments || 'Active'} operational business units configured with designated departmental heads.`,
      badge: 'Structure',
      variant: 'success',
      icon: Building2,
      to: '/departments',
      actionLabel: 'View Depts',
    },
  ];

  return (
    <div className="dashboard-view-wrapper">
      {/* Hero Section */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            Welcome, {user?.firstName || 'Administrator'}
          </h1>
          <p className="page-sub-title">
            {currentDateStr} • Platform governance, user authorization, and system infrastructure.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/users" className="btn btn-secondary">
            <ShieldCheck size={15} />
            <span>Manage Access</span>
          </Link>
          <Link to="/departments" className="btn btn-primary">
            <Building2 size={15} />
            <span>Departments</span>
          </Link>
        </div>
      </div>

      {/* 4 Compact Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="TOTAL HEADCOUNT"
          value={totalEmployees}
          icon={<Users size={16} />}
          subtitle="Verified employee records"
        />
        <StatCard
          title="ACTIVE USER ACCOUNTS"
          value={totalUsers || totalEmployees}
          icon={<ShieldCheck size={16} />}
          subtitle="Role-based access active"
        />
        <StatCard
          title="DEPARTMENTS"
          value={totalDepartments}
          icon={<Building2 size={16} />}
          subtitle="All business units active"
        />
        <StatCard
          title="PRESENT TODAY"
          value={presentToday}
          icon={<Clock size={16} />}
          subtitle={presentToday > 0 ? `${presentToday} logged shifts` : 'No attendance recorded today'}
        />
      </div>

      {/* Action Needed Today (Action Queue Tray) */}
      <ActionQueue
        title="Administrative Controls"
        subtitle="Critical system governance checks"
        items={adminActions}
      />

      {/* Main Panels Grid */}
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
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Security & Infrastructure Panel */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Platform Security Controls</h3>
            <span className="status-tag status-active" style={{ fontSize: '11px' }}>
              <span className="badge-dot"></span>
              Enforced
            </span>
          </div>

          <div className="system-metrics-list">
            <div className="metric-item">
              <span className="metric-label">Token Protocol</span>
              <span className="metric-badge">JWT HS256 (24h)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Password Hashing</span>
              <span className="metric-badge">bcrypt (10 rounds)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Authorization Model</span>
              <span className="metric-badge">Hierarchical RBAC</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Session Protection</span>
              <span className="metric-badge">Auto 401 Intercept</span>
            </div>
          </div>

          <div className="quick-nav-block">
            <div className="quick-nav-title">Administration Links</div>
            <div className="quick-nav-buttons">
              <Link to="/admin/users" className="quick-action-btn">
                <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
                <span>Users</span>
              </Link>
              <Link to="/departments" className="quick-action-btn">
                <Building2 size={14} style={{ color: 'var(--primary)' }} />
                <span>Departments</span>
              </Link>
              <Link to="/audit-logs" className="quick-action-btn">
                <Shield size={14} style={{ color: 'var(--primary)' }} />
                <span>Audit Logs</span>
              </Link>
              <Link to="/system-admin" className="quick-action-btn">
                <Settings size={14} style={{ color: 'var(--primary)' }} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
