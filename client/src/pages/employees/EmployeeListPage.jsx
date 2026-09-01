import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getEmployees,
  deactivateEmployee,
  getDistinctDepartments,
} from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const EmployeeListPage = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Deactivate feedback
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Load distinct departments once
  useEffect(() => {
    getDistinctDepartments()
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch employees
  useEffect(() => {
    let isMounted = true;

    getEmployees({
      page,
      limit: 10,
      search,
      department: selectedDept,
      employmentStatus: selectedStatus,
    })
      .then((res) => {
        if (isMounted) {
          setEmployees(res.data || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load employee directory.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, search, selectedDept, selectedStatus]);

  const reloadEmployees = () => {
    setLoading(true);
    getEmployees({
      page,
      limit: 10,
      search,
      department: selectedDept,
      employmentStatus: selectedStatus,
    })
      .then((res) => {
        setEmployees(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load employee directory.');
      })
      .finally(() => setLoading(false));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    reloadEmployees();
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate employee "${name}"? Their status will be set to inactive.`)) {
      return;
    }

    setDeactivatingId(id);
    setActionNotice(null);
    try {
      await deactivateEmployee(id);
      setActionNotice({ type: 'success', message: `Employee "${name}" deactivated successfully.` });
      reloadEmployees();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to deactivate employee.' });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="employee-page-container">
      {/* Header Banner */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            {user?.role === 'manager' ? 'My Team Directory' : 'Employee Directory'}
          </h1>
          <p className="page-sub-title">
            {user?.role === 'manager'
              ? 'View records for employees assigned directly to your management scope.'
              : 'Comprehensive company directory with role-based oversight and profile access.'}
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="header-actions">
            <Link to="/employees/new" className="btn-primary">
              <span>➕</span> Add New Employee
            </Link>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className={`action-banner banner-${actionNotice.type}`}>
          <span>{actionNotice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, ID, email, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <div className="dropdown-filters">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="panel-card table-panel">
        {loading ? (
          <LoadingSpinner message="Retrieving employee directory..." />
        ) : error ? (
          <div className="error-banner-panel">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn-secondary mt-2" onClick={reloadEmployees}>
              Retry
            </button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No employees found"
            description="No employee records match the active search query or filter parameters."
            action={
              (search || selectedDept || selectedStatus) && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSelectedDept('');
                    setSelectedStatus('');
                    setPage(1);
                  }}
                >
                  Clear Filters
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="panel-table-responsive">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const isDeactivating = deactivatingId === emp._id;
                    const canEdit = isManagerOrAdmin;

                    return (
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
                          <span className="type-tag">{emp.employmentType}</span>
                        </td>
                        <td>
                          <span className={`status-tag status-${emp.employmentStatus}`}>
                            {emp.employmentStatus}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="table-actions-group">
                            <Link
                              to={`/employees/${emp._id}`}
                              className="action-btn-icon"
                              title="View Full Profile"
                            >
                              👁️
                            </Link>

                            {canEdit && (
                              <Link
                                to={`/employees/${emp._id}/edit`}
                                className="action-btn-icon"
                                title="Edit Employee"
                              >
                                ✏️
                              </Link>
                            )}

                            {canEdit && emp.employmentStatus !== 'inactive' && (
                              <button
                                className="action-btn-icon btn-danger-icon"
                                onClick={() =>
                                  handleDeactivate(emp._id, `${emp.firstName} ${emp.lastName}`)
                                }
                                disabled={isDeactivating}
                                title="Deactivate Employee"
                              >
                                🚫
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing {employees.length} of {pagination.total} employees (Page {pagination.page} of{' '}
                {pagination.totalPages || 1})
              </span>

              <div className="pagination-buttons">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Previous
                </button>
                <span className="current-page-pill">{page}</span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeListPage;
