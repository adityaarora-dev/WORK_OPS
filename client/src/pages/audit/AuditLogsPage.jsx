import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  X,
  Eye,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';
import { getAuditLogs } from '../../services/auditService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Metadata modal state
  const [inspectItem, setInspectItem] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs({
        action: actionFilter.trim(),
        entityType: entityTypeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      });
      setLogs(res?.logs || []);
      setPagination(res?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load system audit logs.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityTypeFilter, startDate, endDate, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadgeColor = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('CONVERT') || act.includes('LOGIN')) {
      return 'badge-success';
    }
    if (act.includes('UPDATE') || act.includes('APPROVE') || act.includes('SUBMIT')) {
      return 'badge-info';
    }
    if (act.includes('DELETE') || act.includes('DEACTIVATE') || act.includes('REJECT')) {
      return 'badge-danger';
    }
    return 'badge-warning';
  };

  return (
    <div className="audit-logs-page" style={{ paddingBottom: '32px' }}>
      {/* Page Header */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">System Audit Logs</h1>
          <p className="page-sub-title">
            Immutable tracking record of security events, administrative updates, and corporate workflows
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={fetchLogs} title="Refresh Logs">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by action (e.g. LOGIN, CREATE)..."
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '34px' }}
            />
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <select
              className="form-control"
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entity Types</option>
              <option value="Employee">Employee</option>
              <option value="Department">Department</option>
              <option value="Leave">Leave</option>
              <option value="Payroll">Payroll</option>
              <option value="PerformanceReview">Performance Review</option>
              <option value="JobOpening">Job Opening</option>
              <option value="JobApplication">Job Application</option>
              <option value="Interview">Interview</option>
              <option value="User">User Account</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{ width: '135px', padding: '6px 8px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{ width: '135px', padding: '6px 8px', fontSize: '12px' }}
            />
          </div>

          {(actionFilter || entityTypeFilter || startDate || endDate) && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleResetFilters}
              style={{ fontSize: '12px' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Querying corporate audit trail..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert size={28} />}
          title="No Audit Logs Found"
          description="There are currently no recorded audit events matching your search criteria."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: 'right' }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {item.actorEmail || 'System Process'}
                      </div>
                      {item.actorRole && (
                        <span className={`role-badge badge-${item.actorRole}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                          {item.actorRole}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeColor(item.action)}`} style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {item.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.entityType}
                      </div>
                      {item.entityId && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {item.entityId}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {item.description}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {item.ipAddress || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.metadata && Object.keys(item.metadata).length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setInspectItem(item)}
                          style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata Inspector Modal */}
      {inspectItem && (
        <div className="modal-backdrop" onClick={() => setInspectItem(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} style={{ color: 'var(--primary)' }} />
                <h3 id="modal-title">Audit Metadata Inspector</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setInspectItem(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div>
                  <strong>Action:</strong> <span style={{ fontFamily: 'monospace' }}>{inspectItem.action}</span>
                </div>
                <div>
                  <strong>Entity:</strong> {inspectItem.entityType} ({inspectItem.entityId || 'N/A'})
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  maxHeight: '350px',
                  overflowY: 'auto',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(inspectItem.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectItem(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
