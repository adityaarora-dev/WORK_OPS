import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  Calendar,
  Banknote,
  Award,
  UserPlus,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getOverview,
  getEmployeesReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getPerformanceReport,
  getRecruitmentReport,
  exportReportCsv,
} from '../../services/reportService';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useChartTheme } from '../../lib/chartTheme';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

export const ReportsDashboardPage = () => {
  const { user } = useAuth();
  const chartTheme = useChartTheme();
  const role = (user?.role || '').toLowerCase();
  const isAdminOrHr = role === 'admin' || role === 'hr';
  const isEmployee = role === 'employee';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Year filter for payroll
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  const loadTabData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = null;
      switch (activeTab) {
        case 'overview':
          res = await getOverview();
          break;
        case 'employees':
          res = await getEmployeesReport();
          break;
        case 'attendance':
          res = await getAttendanceReport();
          break;
        case 'leave':
          res = await getLeaveReport();
          break;
        case 'payroll':
          res = await getPayrollReport({ year: payrollYear });
          break;
        case 'performance':
          res = await getPerformanceReport();
          break;
        case 'recruitment':
          if (isAdminOrHr) {
            res = await getRecruitmentReport();
          }
          break;
        default:
          res = await getOverview();
      }
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdminOrHr, payrollYear]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const endpoint = `/reports/${activeTab}`;
      const filename = `hrms_${activeTab}_report_${Date.now()}.csv`;
      await exportReportCsv(endpoint, filename);
      toast.success(`Exported ${activeTab} report to CSV successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="reports-page" style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">Reports & Organizational Analytics</h1>
          <p className="page-sub-title">
            Aggregated corporate telemetry, compliance metrics, financial trends, and talent pipelines
          </p>
        </div>
        <div className="header-actions">
          {activeTab !== 'overview' && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleExport}
              disabled={exporting || loading}
            >
              <Download size={15} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadTabData}
            title="Refresh current report"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="reports-tab-nav">
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> Overview
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={16} /> Workforce & Demographics
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={16} /> Attendance & Hours
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          <Calendar size={16} /> Leave & Absenteeism
        </button>

        {role !== 'manager' && (
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
            onClick={() => setActiveTab('payroll')}
          >
            <Banknote size={16} /> {isEmployee ? 'My Payroll Statements' : 'Payroll Expenditure'}
          </button>
        )}

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <Award size={16} /> Performance & Goals
        </button>

        {isAdminOrHr && (
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'recruitment' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruitment')}
          >
            <UserPlus size={16} /> Recruitment Funnel
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Calculating analytics pipelines..." />
      ) : (
        <div>
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && data && (
            <div>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Total Headcount"
                  value={data.employees?.total || 0}
                  icon={<Users size={18} />}
                  subtitle={`${data.employees?.active || 0} Active members`}
                  variant="primary"
                />
                <StatCard
                  title="Attendance Rate"
                  value={`${data.attendance?.attendanceRate || 0}%`}
                  icon={<Clock size={18} />}
                  subtitle="Past 30 days compliance"
                  variant="success"
                />
                <StatCard
                  title="Pending Leaves"
                  value={data.leave?.pending || 0}
                  icon={<Calendar size={18} />}
                  subtitle="Awaiting review"
                  variant="warning"
                />
                <StatCard
                  title="Avg Performance"
                  value={data.performance?.avgRating ? `${data.performance.avgRating} / 5` : 'N/A'}
                  icon={<Award size={18} />}
                  subtitle={`${data.performance?.totalEvaluations || 0} Evaluations`}
                  variant="info"
                />
              </div>

              {/* Recruitment & Financial quick summary if Admin/HR */}
              {isAdminOrHr && data.recruitment && (
                <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '24px' }}>
                  <div className="chart-card">
                    <div className="chart-card-title">Talent Acquisition</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--primary)' }}>
                      {data.recruitment.openJobs}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Open positions published · {data.recruitment.totalCandidates} total candidates in pool
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="chart-card-title">Active Applications</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--warning)' }}>
                      {data.recruitment.activeApps}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Candidates currently moving through screening and interview stages
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="chart-card-title">Net Payroll Spend</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--success)' }}>
                      INR {(data.payroll?.totalNetExpenditure || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      All-time net compensation disbursed
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: WORKFORCE & DEMOGRAPHICS */}
          {/* ========================================================================= */}
          {activeTab === 'employees' && data && (
            <div>
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '24px' }}>
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <div className="chart-card-title">Headcount by Department</div>
                      <div className="chart-card-subtitle">Active vs total personnel allocation</div>
                    </div>
                  </div>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.byDepartment || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} opacity={chartTheme.gridOpacity} />
                        <XAxis dataKey="departmentName" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                        <YAxis stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                        <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                        <Legend wrapperStyle={{ color: chartTheme.legendTextColor, fontSize: '11px' }} />
                        <Bar dataKey="count" name="Total Headcount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="active" name="Active" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <div className="chart-card-title">Employment Contract Types</div>
                      <div className="chart-card-subtitle">Distribution across contract structures</div>
                    </div>
                  </div>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.byEmploymentType || []}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          fontSize={11}
                        >
                          {(data.byEmploymentType || []).map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Joiners Table */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                  Recent Organizational Additions
                </div>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Contract Type</th>
                        <th>Status</th>
                        <th>Joining Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.recentJoiners || []).map((e) => (
                        <tr key={e._id}>
                          <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{e.employeeId}</td>
                          <td>{e.firstName} {e.lastName}</td>
                          <td>{e.designation}</td>
                          <td>{e.department?.name || 'Unassigned'}</td>
                          <td style={{ textTransform: 'capitalize' }}>{e.employmentType}</td>
                          <td>
                            <span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                              {e.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ATTENDANCE & HOURS */}
          {/* ========================================================================= */}
          {activeTab === 'attendance' && data && (
            <div>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Compliance Rate"
                  value={`${data.summary?.attendancePercentage || 0}%`}
                  icon={<Clock size={18} />}
                  variant="success"
                />
                <StatCard
                  title="Present Days Logged"
                  value={data.summary?.present || 0}
                  icon={<Clock size={18} />}
                  variant="primary"
                />
                <StatCard
                  title="Late Arrivals"
                  value={data.summary?.late || 0}
                  icon={<Clock size={18} />}
                  variant="warning"
                />
                <StatCard
                  title="Total Work Hours"
                  value={Math.round(data.summary?.totalHours || 0)}
                  icon={<Clock size={18} />}
                  variant="info"
                />
              </div>

              <div className="chart-card" style={{ marginBottom: '24px' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Daily Attendance Trend</div>
                    <div className="chart-card-subtitle">Present, absent, and late volume across date range</div>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} opacity={chartTheme.gridOpacity} />
                      <XAxis dataKey="date" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                      <YAxis stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                      <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                      <Legend wrapperStyle={{ color: chartTheme.legendTextColor, fontSize: '11px' }} />
                      <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="late" name="Late" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: LEAVE & ABSENTEEISM */}
          {/* ========================================================================= */}
          {activeTab === 'leave' && data && (
            <div>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Total Requests"
                  value={data.summary?.totalRequests || 0}
                  icon={<Calendar size={18} />}
                  variant="primary"
                />
                <StatCard
                  title="Approved Leaves"
                  value={data.summary?.approved || 0}
                  icon={<Calendar size={18} />}
                  variant="success"
                />
                <StatCard
                  title="Pending Approval"
                  value={data.summary?.pending || 0}
                  icon={<Calendar size={18} />}
                  variant="warning"
                />
                <StatCard
                  title="Approved Days Taken"
                  value={data.summary?.totalDaysApproved || 0}
                  icon={<Calendar size={18} />}
                  variant="info"
                />
              </div>

              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '24px' }}>
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <div className="chart-card-title">Monthly Leave Volume</div>
                      <div className="chart-card-subtitle">Approved days vs pending days</div>
                    </div>
                  </div>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} opacity={chartTheme.gridOpacity} />
                        <XAxis dataKey="month" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                        <YAxis stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                        <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                        <Legend wrapperStyle={{ color: chartTheme.legendTextColor, fontSize: '11px' }} />
                        <Bar dataKey="approvedDays" name="Approved Days" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pendingDays" name="Pending Days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <div className="chart-card-title">Leave Categories</div>
                      <div className="chart-card-subtitle">Breakdown by leave type</div>
                    </div>
                  </div>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.byType || []}
                          dataKey="totalDays"
                          nameKey="leaveType"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          fontSize={11}
                        >
                          {(data.byType || []).map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PAYROLL EXPENDITURE */}
          {/* ========================================================================= */}
          {activeTab === 'payroll' && data && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Showing financial compensation data for Calendar Year {data.year}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select Year:</span>
                  <select
                    className="form-control"
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(Number(e.target.value))}
                    style={{ width: '100px', padding: '4px 8px', fontSize: '13px' }}
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Total Net Paid"
                  value={`INR ${(data.summary?.totalNet || 0).toLocaleString()}`}
                  icon={<Banknote size={18} />}
                  variant="success"
                />
                <StatCard
                  title="Total Gross"
                  value={`INR ${(data.summary?.totalGross || 0).toLocaleString()}`}
                  icon={<Banknote size={18} />}
                  variant="primary"
                />
                <StatCard
                  title="Deductions & Taxes"
                  value={`INR ${(data.summary?.totalDeductions || 0).toLocaleString()}`}
                  icon={<Banknote size={18} />}
                  variant="warning"
                />
                <StatCard
                  title="Processed Slips"
                  value={data.summary?.totalRecords || 0}
                  icon={<Banknote size={18} />}
                  variant="info"
                />
              </div>

              <div className="chart-card" style={{ marginBottom: '24px' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Monthly Payroll Expenditure</div>
                    <div className="chart-card-subtitle">Gross vs Net salary disbursement (INR)</div>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} opacity={chartTheme.gridOpacity} />
                      <XAxis dataKey="month" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} tickFormatter={(m) => `M${m}`} />
                      <YAxis stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} tickFormatter={(v) => `₹${(v / 1000)}k`} />
                      <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                      <Legend wrapperStyle={{ color: chartTheme.legendTextColor, fontSize: '11px' }} />
                      <Bar dataKey="gross" name="Gross Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Net Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PERFORMANCE & GOALS */}
          {/* ========================================================================= */}
          {activeTab === 'performance' && data && (
            <div>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Average Score"
                  value={`${data.overview?.avgRating || 0} / 5`}
                  icon={<Award size={18} />}
                  variant="primary"
                />
                <StatCard
                  title="Evaluations Logged"
                  value={data.overview?.totalReviews || 0}
                  icon={<Award size={18} />}
                  variant="info"
                />
                <StatCard
                  title="Goal Completion Rate"
                  value={`${data.goals?.completionRate || 0}%`}
                  icon={<TrendingUp size={18} />}
                  variant="success"
                />
                <StatCard
                  title="Total Goals Tracked"
                  value={data.goals?.totalGoals || 0}
                  icon={<TrendingUp size={18} />}
                  variant="warning"
                />
              </div>

              <div className="chart-card" style={{ marginBottom: '24px' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">1 to 5 Rating Distribution</div>
                    <div className="chart-card-subtitle">Frequency breakdown of review evaluation scores</div>
                  </div>
                </div>
                <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.overview?.ratingDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} opacity={chartTheme.gridOpacity} />
                      <XAxis dataKey="stars" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} tickFormatter={(s) => `${s} Stars`} />
                      <YAxis stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                      <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                      <Bar dataKey="count" name="Reviews Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: RECRUITMENT FUNNEL */}
          {/* ========================================================================= */}
          {activeTab === 'recruitment' && data && isAdminOrHr && (
            <div>
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Open Requisitions"
                  value={data.metrics?.openJobs || 0}
                  icon={<UserPlus size={18} />}
                  variant="primary"
                />
                <StatCard
                  title="Talent Pool"
                  value={data.metrics?.totalCandidates || 0}
                  icon={<Users size={18} />}
                  variant="info"
                />
                <StatCard
                  title="Total Applications"
                  value={data.metrics?.totalApplications || 0}
                  icon={<UserPlus size={18} />}
                  variant="warning"
                />
                <StatCard
                  title="Hiring Success Rate"
                  value={`${data.metrics?.hiringRate || 0}%`}
                  icon={<Award size={18} />}
                  variant="success"
                />
              </div>

              <div className="chart-card" style={{ marginBottom: '24px' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Talent Pipeline Funnel Stages</div>
                    <div className="chart-card-subtitle">Candidate progression through hiring stages</div>
                  </div>
                </div>
                <div style={{ height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.funnel || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} opacity={chartTheme.gridOpacity} />
                      <XAxis type="number" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} />
                      <YAxis dataKey="stage" type="category" stroke={chartTheme.axisStroke} tick={{ fill: chartTheme.tickFill, fontSize: chartTheme.tickFontSize }} width={90} />
                      <Tooltip contentStyle={chartTheme.tooltipContentStyle} itemStyle={chartTheme.tooltipItemStyle} labelStyle={chartTheme.tooltipLabelStyle} />
                      <Bar dataKey="count" name="Candidates in Stage" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {(data.funnel || []).map((_, idx) => (
                          <Cell key={`funnel-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboardPage;
