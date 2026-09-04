import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  UserPlus,
  Eye,
  Edit2,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getEmployees,
  deactivateEmployee,
  getDistinctDepartments,
} from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';

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

  // Deactivate modal state
  const [deactivateModal, setDeactivateModal] = useState({
    isOpen: false,
    employeeId: null,
    employeeName: '',
  });
  const [deactivating, setDeactivating] = useState(false);

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

  const handleConfirmDeactivate = async () => {
    if (!deactivateModal.employeeId) return;

    setDeactivating(true);
    try {
      await deactivateEmployee(deactivateModal.employeeId);
      toast.success(`Employee "${deactivateModal.employeeName}" has been deactivated.`);
      setDeactivateModal({ isOpen: false, employeeId: null, employeeName: '' });
      reloadEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate employee.');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="employee-page-container">
      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            {user?.role === 'manager' ? 'Team Directory' : 'Workforce Directory'}
          </h1>
          <p className="page-sub-title">
            {user?.role === 'manager'
              ? 'View records for team members within your managerial scope.'
              : 'Enterprise directory with profile records, department links, and status control.'}
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="header-actions">
            <Link to="/employees/new" className="btn btn-primary">
              <UserPlus size={15} />
              <span>Add Employee</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-group">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
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
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-secondary">
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
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        {loading ? (
          <LoadingSpinner message="Loading employee directory..." />
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={reloadEmployees}
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={
              search || selectedDept || selectedStatus
                ? 'Try adjusting your search query or filters to find records.'
                : 'No employees have been added to the system yet.'
            }
            action={
              isManagerOrAdmin && (
                <Link to="/employees/new" className="btn btn-primary btn-sm">
                  <UserPlus size={14} />
                  <span>Add First Employee</span>
                </Link>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
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
                    <td>
                      {typeof emp.department === 'object' && emp.department !== null
                        ? emp.department.name
                        : (emp.department || '—')}
                    </td>
                    <td>{emp.designation || '—'}</td>
                    <td>
                      <span className={`status-tag status-${emp.employmentStatus}`}>
                        <span className="badge-dot"></span>
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/employees/${emp._id}`}
                          className="btn btn-ghost btn-sm"
                          title="View Employee Profile"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Link>

                        {isManagerOrAdmin && (
                          <>
                            <Link
                              to={`/employees/${emp._id}/edit`}
                              className="btn btn-ghost btn-sm"
                              title="Edit Employee Details"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </Link>

                            {emp.employmentStatus !== 'inactive' && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  setDeactivateModal({
                                    isOpen: true,
                                    employeeId: emp._id,
                                    employeeName: `${emp.firstName} ${emp.lastName}`,
                                  })
                                }
                                title="Deactivate Employee"
                                style={{ color: 'var(--danger)' }}
                              >
                                <UserX size={14} />
                                <span>Deactivate</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {!loading && employees.length > 0 && (
          <div className="table-pagination">
            <span>
              Showing {employees.length} of {pagination.total} employees
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span style={{ padding: '0 8px', fontWeight: 500 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={deactivateModal.isOpen}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${deactivateModal.employeeName}? Their status will be set to inactive, but existing organizational records and history will be preserved.`}
        confirmText="Deactivate Employee"
        cancelText="Cancel"
        isDestructive={true}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={() =>
          setDeactivateModal({ isOpen: false, employeeId: null, employeeName: '' })
        }
      />
    </div>
  );
};

export default EmployeeListPage;
