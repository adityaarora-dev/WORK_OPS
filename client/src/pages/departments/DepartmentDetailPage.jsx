import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Edit2,
  Users,
  MapPin,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getDepartmentById } from '../../services/departmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const DepartmentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdminOrHr = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    let isMounted = true;
    getDepartmentById(id)
      .then((res) => {
        if (isMounted) {
          setDepartment(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Department not found');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving department data..." />;
  }

  if (error || !department) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div className="action-banner banner-error">
          <AlertCircle size={16} />
          <span>{error || 'Department not found'}</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => navigate('/departments')}
        >
          <ArrowLeft size={15} />
          <span>Return to Departments</span>
        </button>
      </div>
    );
  }

  const employees = department.employees || [];

  return (
    <div className="employee-detail-wrapper">
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/departments"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Departments</span>
          </Link>
          <h1 className="page-main-title">{department.name}</h1>
          <p className="page-sub-title">
            {department.description || 'Organizational operational division'}
          </p>
        </div>

        {isAdminOrHr && (
          <div className="header-actions">
            <Link to={`/departments/${department._id}/edit`} className="btn btn-primary">
              <Edit2 size={15} />
              <span>Edit Department</span>
            </Link>
          </div>
        )}
      </div>

      {/* Hero Overview */}
      <div className="employee-hero-banner">
        <div className="employee-hero-main">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={28} />
          </div>

          <div className="employee-hero-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>{department.name}</h2>
              <span className={`status-tag status-${department.status || 'active'}`}>
                <span className="badge-dot"></span>
                {(department.status || 'active').toUpperCase()}
              </span>
            </div>

            <p className="employee-hero-sub">
              {department.description || 'Enterprise Operational Unit'}
            </p>

            <div className="employee-tags-row">
              <span className="code-pill">CODE: {department.code || department.departmentId}</span>
              <span className="email-pill">
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {department.location || 'Corporate HQ'}
              </span>
              <span className="badge badge-info">
                <Users size={12} style={{ marginRight: '4px' }} />
                {employees.length} Assigned Staff
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Leadership & Workforce */}
      <div className="dashboard-panels-grid">
        {/* Workforce Table */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Assigned Workforce</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {employees.length} active employees
            </span>
          </div>

          <div className="panel-table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No employees are currently assigned to this department.
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
                      <td>{emp.designation || '—'}</td>
                      <td>
                        <span className={`status-tag status-${emp.employmentStatus}`}>
                          <span className="badge-dot"></span>
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/employees/${emp._id}`} className="btn btn-ghost btn-sm">
                          <Eye size={14} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Leadership Card */}
        <section className="panel-card">
          <div className="panel-header">
            <h3>Department Leadership</h3>
          </div>

          <div style={{ padding: '20px' }}>
            {department.head ? (
              <div className="table-user-cell">
                <div className="avatar-circle">
                  {department.head.firstName?.[0]}
                  {department.head.lastName?.[0]}
                </div>
                <div>
                  <div className="cell-primary">
                    {department.head.firstName} {department.head.lastName}
                  </div>
                  <div className="cell-secondary">{department.head.designation}</div>
                  <div className="code-pill" style={{ marginTop: '4px', display: 'inline-block' }}>
                    ID: {department.head.employeeId}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No department head has been formally appointed yet.
              </p>
            )}

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="metric-item">
                <span className="metric-label">Facility</span>
                <span>{department.location || 'Headquarters'}</span>
              </div>
              <div className="metric-item" style={{ marginTop: '8px' }}>
                <span className="metric-label">Status</span>
                <span className={`status-tag status-${department.status || 'active'}`}>
                  <span className="badge-dot"></span>
                  {department.status || 'active'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DepartmentDetailPage;
