import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  X,
  Plus,
  Eye,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { getDepartments, deactivateDepartment } from '../../services/departmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';

export const DepartmentListPage = () => {
  const { user } = useAuth();
  const isAdminOrHr = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Deactivate modal state
  const [deactivateModal, setDeactivateModal] = useState({
    isOpen: false,
    departmentId: null,
    departmentName: '',
  });
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getDepartments({
      page,
      limit: 10,
      search,
      status: selectedStatus,
    })
      .then((res) => {
        if (isMounted) {
          setDepartments(res.data || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load departments');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, search, selectedStatus]);

  const reloadDepartments = () => {
    setLoading(true);
    getDepartments({
      page,
      limit: 10,
      search,
      status: selectedStatus,
    })
      .then((res) => {
        setDepartments(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load departments');
      })
      .finally(() => setLoading(false));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    reloadDepartments();
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateModal.departmentId) return;

    setDeactivating(true);
    try {
      await deactivateDepartment(deactivateModal.departmentId);
      toast.success(`Department "${deactivateModal.departmentName}" deactivated successfully.`);
      setDeactivateModal({ isOpen: false, departmentId: null, departmentName: '' });
      reloadDepartments();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to deactivate department.'
      );
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="employee-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Department Management</h1>
          <p className="page-sub-title">
            Organizational hierarchy, department leadership, and workforce allocations.
          </p>
        </div>

        {isAdminOrHr && (
          <div className="header-actions">
            <Link to="/departments/new" className="btn btn-primary">
              <Plus size={15} />
              <span>Create Department</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-group">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by department name or code..."
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
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        {loading ? (
          <LoadingSpinner message="Loading departments..." />
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={reloadDepartments}
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={<Building2 size={24} />}
            title="No departments found"
            description={
              search || selectedStatus
                ? 'Try adjusting your search criteria or status filter.'
                : 'No organizational departments have been set up yet.'
            }
            action={
              isAdminOrHr && (
                <Link to="/departments/new" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Create First Department</span>
                </Link>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>Department Head</th>
                  <th>Staff Count</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-surface-subtle)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Building2 size={14} />
                        </div>
                        <div>
                          <div className="cell-primary">{dept.name}</div>
                          {dept.description && (
                            <div className="cell-secondary" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dept.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="code-pill">{dept.code || dept.departmentId}</span>
                    </td>
                    <td>
                      {dept.head ? (
                        <span style={{ fontSize: '13px' }}>
                          {dept.head.firstName} {dept.head.lastName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        <Users size={12} style={{ marginRight: '3px' }} />
                        {dept.employeeCount ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={`status-tag status-${dept.status || 'active'}`}>
                        <span className="badge-dot"></span>
                        {dept.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/departments/${dept._id}`}
                          className="btn btn-ghost btn-sm"
                          title="View Department"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Link>

                        {isAdminOrHr && (
                          <>
                            <Link
                              to={`/departments/${dept._id}/edit`}
                              className="btn btn-ghost btn-sm"
                              title="Edit Department"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </Link>

                            {dept.status !== 'inactive' && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  setDeactivateModal({
                                    isOpen: true,
                                    departmentId: dept._id,
                                    departmentName: dept.name,
                                  })
                                }
                                title="Deactivate Department"
                                style={{ color: 'var(--danger)' }}
                              >
                                <Archive size={14} />
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

        {/* Pagination */}
        {!loading && departments.length > 0 && (
          <div className="table-pagination">
            <span>
              Showing {departments.length} of {pagination.total} departments
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
        title="Deactivate Department"
        message={`Are you sure you want to deactivate the "${deactivateModal.departmentName}" department? Note: A department cannot be deactivated if there are active employees currently assigned to it.`}
        confirmText="Deactivate Department"
        cancelText="Cancel"
        isDestructive={true}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={() =>
          setDeactivateModal({ isOpen: false, departmentId: null, departmentName: '' })
        }
      />
    </div>
  );
};

export default DepartmentListPage;
