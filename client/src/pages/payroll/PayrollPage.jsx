import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getPayroll,
  getPayrollSummary,
  createPayroll,
  updatePayroll,
} from '../../services/payrollService';
import { getEmployees } from '../../services/employeeService';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const PayrollPage = () => {
  const { user } = useAuth();
  const isAdminOrHr = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal for generating payroll
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newPayrollData, setNewPayrollData] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: 2026,
    basicSalary: 6500,
    allowances: 800,
    overtime: 250,
    bonus: 500,
    deductions: 350,
    tax: 950,
    paymentStatus: 'paid',
    paymentMethod: 'direct-deposit',
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getPayroll({
        page,
        limit: 10,
        status: selectedStatus,
        month: selectedMonth,
        year: selectedYear,
      }),
      getPayrollSummary().catch(() => ({ data: null })),
    ])
      .then(([payRes, sumRes]) => {
        if (isMounted) {
          setRecords(payRes.data || []);
          setPagination(payRes.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          if (sumRes.data) setSummary(sumRes.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load payroll records');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, selectedStatus, selectedMonth, selectedYear]);

  const reloadData = () => {
    setLoading(true);
    getPayroll({
      page,
      limit: 10,
      status: selectedStatus,
      month: selectedMonth,
      year: selectedYear,
    })
      .then((res) => {
        setRecords(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load payroll records');
      })
      .finally(() => setLoading(false));

    getPayrollSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {});
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setModalError(null);
    if (employees.length === 0) {
      getEmployees({ limit: 100 })
        .then((res) => setEmployees(res.data || []))
        .catch(() => {});
    }
  };

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!newPayrollData.employee) {
      setModalError('Please select an employee.');
      return;
    }

    setModalSubmitting(true);
    try {
      await createPayroll(newPayrollData);
      setShowModal(false);
      toast.success('Payroll statement generated successfully.');
      reloadData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to create payroll');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await updatePayroll(id, { paymentStatus: 'paid' });
      toast.success('Payroll status marked as paid.');
      reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update payment status');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="employee-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            {isAdminOrHr ? 'Payroll & Compensation Management' : 'My Paystubs & Earnings'}
          </h1>
          <p className="page-sub-title">
            Direct deposit processing, tax withholding calculations, and earnings disbursement.
          </p>
        </div>

        {isAdminOrHr && (
          <div className="header-actions">
            <button type="button" className="btn btn-primary" onClick={handleOpenModal}>
              <Plus size={15} />
              <span>Generate Payroll</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Disbursed"
          value={`$${(summary?.totalDisbursed ?? 0).toLocaleString()}`}
          icon={<Banknote size={16} />}
          subtitle="Processed salary disbursement"
        />
        <StatCard
          title="Disbursed Vouchers"
          value={summary?.totalPaid ?? 0}
          icon={<CheckCircle2 size={16} />}
          subtitle="Settled pay periods"
        />
        <StatCard
          title="Pending Settlement"
          value={summary?.pendingRecords ?? 0}
          icon={<Clock size={16} />}
          subtitle="Awaiting final disbursement"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card">
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
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Months</option>
            {monthNames.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {(selectedStatus || selectedMonth) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedStatus('');
                setSelectedMonth('');
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="table-card">
        {loading ? (
          <LoadingSpinner message="Loading payroll records..." />
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={reloadData}
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Banknote size={24} />}
            title="No payroll records found"
            description="No disbursement statements matching the selected filters."
            action={
              isAdminOrHr && (
                <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenModal}>
                  <Plus size={14} />
                  <span>Generate Voucher</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Pay Period</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Disbursed</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => {
                  const emp = item.employee || {};
                  const period = `${monthNames[(item.payPeriod?.month || 1) - 1]} ${item.payPeriod?.year || 2026}`;

                  return (
                    <tr key={item._id}>
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
                            <div className="cell-secondary">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{period}</span>
                      </td>
                      <td>
                        <span>${(item.grossSalary || 0).toLocaleString()}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>
                          -${((item.deductions || 0) + (item.tax || 0)).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ${(item.netSalary || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag status-${item.paymentStatus}`}>
                          <span className="badge-dot"></span>
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <Link
                            to={`/payroll/${item._id}`}
                            className="btn btn-ghost btn-sm"
                            title="View Earnings Statement"
                          >
                            <FileText size={14} />
                            <span>Statement</span>
                          </Link>

                          {isAdminOrHr && item.paymentStatus !== 'paid' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleMarkPaid(item._id)}
                              title="Mark as Settled / Paid"
                              style={{ color: 'var(--success)' }}
                            >
                              <Check size={14} />
                              <span>Mark Paid</span>
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
        )}

        {/* Pagination */}
        {!loading && records.length > 0 && (
          <div className="table-pagination">
            <span>
              Showing {records.length} of {pagination.total} statements
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

      {/* Generate Payroll Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <h3>Generate Compensation Voucher</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="action-banner banner-error" style={{ margin: '16px 20px 0' }}>
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePayroll}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="modalEmployee">Select Employee *</label>
                    <select
                      id="modalEmployee"
                      value={newPayrollData.employee}
                      onChange={(e) =>
                        setNewPayrollData({ ...newPayrollData, employee: e.target.value })
                      }
                      required
                    >
                      <option value="">-- Choose employee --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalMonth">Pay Period Month</label>
                    <select
                      id="modalMonth"
                      value={newPayrollData.month}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          month: parseInt(e.target.value, 10),
                        })
                      }
                    >
                      {monthNames.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalYear">Pay Period Year</label>
                    <input
                      id="modalYear"
                      type="number"
                      value={newPayrollData.year}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          year: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalBasic">Base Salary ($)</label>
                    <input
                      id="modalBasic"
                      type="number"
                      value={newPayrollData.basicSalary}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          basicSalary: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalAllowances">Allowances ($)</label>
                    <input
                      id="modalAllowances"
                      type="number"
                      value={newPayrollData.allowances}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          allowances: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalOvertime">Overtime ($)</label>
                    <input
                      id="modalOvertime"
                      type="number"
                      value={newPayrollData.overtime}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          overtime: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalBonus">Bonus ($)</label>
                    <input
                      id="modalBonus"
                      type="number"
                      value={newPayrollData.bonus}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          bonus: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalDeductions">Standard Deductions ($)</label>
                    <input
                      id="modalDeductions"
                      type="number"
                      value={newPayrollData.deductions}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          deductions: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalTax">Income Tax Withholding ($)</label>
                    <input
                      id="modalTax"
                      type="number"
                      value={newPayrollData.tax}
                      onChange={(e) =>
                        setNewPayrollData({
                          ...newPayrollData,
                          tax: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalStatus">Initial Payment Status</label>
                    <select
                      id="modalStatus"
                      value={newPayrollData.paymentStatus}
                      onChange={(e) =>
                        setNewPayrollData({ ...newPayrollData, paymentStatus: e.target.value })
                      }
                    >
                      <option value="paid">Paid (Disbursed)</option>
                      <option value="pending">Pending</option>
                      <option value="processed">Processed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="modalMethod">Payment Method</label>
                    <select
                      id="modalMethod"
                      value={newPayrollData.paymentMethod}
                      onChange={(e) =>
                        setNewPayrollData({ ...newPayrollData, paymentMethod: e.target.value })
                      }
                    >
                      <option value="direct-deposit">Direct Deposit</option>
                      <option value="bank-transfer">Bank Wire Transfer</option>
                      <option value="check">Company Check</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
                  <Plus size={15} />
                  <span>{modalSubmitting ? 'Generating...' : 'Confirm Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
