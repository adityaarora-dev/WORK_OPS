import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Briefcase,
  User,
  Clock,
  CalendarDays,
  Banknote,
  FileText,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getEmployeeById } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ForbiddenPage from '../../components/common/ForbiddenPage';

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const canEdit = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    let isMounted = true;
    getEmployeeById(id)
      .then((res) => {
        if (isMounted) {
          setEmployee(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving employee profile..." />;
  }

  if (error) {
    if (error.status === 403) {
      return <ForbiddenPage requiredRoles={['Authorized Manager or HR Admin']} />;
    }
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div className="action-banner banner-error">
          <ShieldAlert size={16} />
          <span>{error.message || 'Unable to retrieve employee profile.'}</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => navigate('/employees')}
        >
          <ArrowLeft size={15} />
          <span>Return to Directory</span>
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="empty-state-card">
        <h3 className="empty-state-title">Employee Not Found</h3>
        <p className="empty-state-desc">No employee record exists with the provided identifier.</p>
        <Link to="/employees" className="btn btn-primary btn-sm">
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const getInitials = () => {
    const f = employee.firstName ? employee.firstName[0] : '';
    const l = employee.lastName ? employee.lastName[0] : '';
    return (f + l).toUpperCase() || 'EM';
  };

  return (
    <div className="employee-detail-wrapper">
      {/* Top Breadcrumb & Controls */}
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/employees"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Directory</span>
          </Link>
          <h1 className="page-main-title">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="page-sub-title">
            {employee.designation} •{' '}
            {(typeof employee.department === 'object' && employee.department !== null
              ? employee.department.name
              : employee.department) || 'Unassigned'}
          </p>
        </div>

        {canEdit && (
          <div className="header-actions">
            <Link to={`/employees/${employee._id}/edit`} className="btn btn-primary">
              <Edit2 size={15} />
              <span>Edit Profile</span>
            </Link>
          </div>
        )}
      </div>

      {/* Hero Profile Banner */}
      <div className="employee-hero-banner">
        <div className="employee-hero-main">
          <div className="employee-large-avatar">{getInitials()}</div>

          <div className="employee-hero-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>
                {employee.firstName} {employee.lastName}
              </h2>
              <span className={`status-tag status-${employee.employmentStatus}`}>
                <span className="badge-dot"></span>
                {employee.employmentStatus?.toUpperCase()}
              </span>
            </div>

            <p className="employee-hero-sub">
              {employee.designation} •{' '}
              <strong>
                {(typeof employee.department === 'object' && employee.department !== null
                  ? employee.department.name
                  : employee.department) || 'General Operations'}
              </strong>
            </p>

            <div className="employee-tags-row">
              <span className="code-pill">ID: {employee.employeeId}</span>
              <span className="email-pill">
                <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {employee.email}
              </span>
              {employee.phone && (
                <span className="email-pill">
                  <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {employee.phone}
                </span>
              )}
              <span className="badge badge-neutral">
                <Briefcase size={12} style={{ marginRight: '4px' }} />
                {employee.employmentType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={15} />
          <span>Profile Overview</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'employment' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('employment')}
        >
          <Briefcase size={15} />
          <span>Employment & Team</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'contact' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <MapPin size={15} />
          <span>Address & Emergency</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'activity' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Clock size={15} />
          <span>Records & Modules</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="tab-body-container">
        {activeTab === 'overview' && (
          <div className="dashboard-panels-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Personal Identity</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="metric-item">
                    <span className="metric-label">Full Name</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {employee.firstName} {employee.lastName}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Employee ID</span>
                    <span className="code-pill">{employee.employeeId}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Date of Birth</span>
                    <span>
                      {employee.dateOfBirth
                        ? new Date(employee.dateOfBirth).toLocaleDateString()
                        : 'Not specified'}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Gender</span>
                    <span style={{ textTransform: 'capitalize' }}>
                      {employee.gender || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Employment Status</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="metric-item">
                    <span className="metric-label">Current Status</span>
                    <span className={`status-tag status-${employee.employmentStatus}`}>
                      <span className="badge-dot"></span>
                      {employee.employmentStatus}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Employment Type</span>
                    <span className="badge badge-info">{employee.employmentType}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Date of Joining</span>
                    <span>
                      {employee.joiningDate
                        ? new Date(employee.joiningDate).toLocaleDateString()
                        : 'Standard Onboarding'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="dashboard-panels-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Department & Role</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="metric-item">
                    <span className="metric-label">Assigned Department</span>
                    <span style={{ fontWeight: 600 }}>
                      {(typeof employee.department === 'object' && employee.department !== null
                        ? employee.department.name
                        : employee.department) || 'Not assigned'}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Official Designation</span>
                    <span>{employee.designation}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Reporting Manager</h3>
              </div>
              <div style={{ padding: '20px' }}>
                {employee.manager ? (
                  <div className="table-user-cell">
                    <div className="avatar-circle">
                      {employee.manager.firstName?.[0]}
                      {employee.manager.lastName?.[0]}
                    </div>
                    <div>
                      <div className="cell-primary">
                        {employee.manager.firstName} {employee.manager.lastName}
                      </div>
                      <div className="cell-secondary">{employee.manager.designation}</div>
                      <div className="code-pill" style={{ marginTop: '4px', display: 'inline-block' }}>
                        ID: {employee.manager.employeeId}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Directly reports to the System Administrator / Executive Board.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="dashboard-panels-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Contact & Address Details</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="metric-item">
                    <span className="metric-label">Primary Email</span>
                    <span>{employee.email}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Primary Phone</span>
                    <span>{employee.phone || 'Not recorded'}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Alternate Phone</span>
                    <span>{employee.alternatePhone || 'Not recorded'}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Street Address</span>
                    <span>{employee.address?.street || 'Not recorded'}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">City, State, Zip</span>
                    <span>
                      {[
                        employee.address?.city,
                        employee.address?.state,
                        employee.address?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'Not recorded'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Emergency Contact</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="metric-item">
                    <span className="metric-label">Contact Name</span>
                    <span style={{ fontWeight: 600 }}>
                      {employee.emergencyContact?.name || 'Not recorded'}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Phone Number</span>
                    <span>{employee.emergencyContact?.phone || 'Not recorded'}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Relationship</span>
                    <span>{employee.emergencyContact?.relationship || 'Not recorded'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="dashboard-panels-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Connected HR Modules</h3>
              </div>
              <div className="system-metrics-list">
                <div className="metric-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} style={{ color: 'var(--primary)' }} />
                    <span className="metric-label">Attendance Logs</span>
                  </div>
                  <Link to="/attendance" className="btn btn-secondary btn-sm">
                    View Timesheet
                  </Link>
                </div>
                <div className="metric-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarDays size={15} style={{ color: 'var(--primary)' }} />
                    <span className="metric-label">Leave & PTO</span>
                  </div>
                  <Link to="/leave" className="btn btn-secondary btn-sm">
                    View Leaves
                  </Link>
                </div>
                <div className="metric-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Banknote size={15} style={{ color: 'var(--primary)' }} />
                    <span className="metric-label">Payroll & Vouchers</span>
                  </div>
                  <Link to="/payroll" className="btn btn-secondary btn-sm">
                    View Payroll
                  </Link>
                </div>
                <div className="metric-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={15} style={{ color: 'var(--primary)' }} />
                    <span className="metric-label">Document Repository</span>
                  </div>
                  <Link to="/documents" className="btn btn-secondary btn-sm">
                    View Documents
                  </Link>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Profile Governance</h3>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Profile updates, role assignment, and credentials are governed by organizational
                  security protocols. To request designation or salary updates, initiate a change
                  request through HR.
                </p>
                {canEdit && (
                  <Link
                    to={`/employees/${employee._id}/edit`}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '16px' }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Information</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
