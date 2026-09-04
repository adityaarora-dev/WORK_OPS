import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  Plus,
  Sliders,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getMyPerformance,
  getGoals,
  getReviews,
  getPerformanceCycles,
} from '../../services/performanceService';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const PerformanceDashboardPage = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isEmployee = role === 'employee';
  const isManager = role === 'manager';
  const isAdminOrHr = ['admin', 'hr'].includes(role);

  // Tab control based on role
  const defaultTab = isEmployee ? 'goals' : isManager ? 'evaluations' : 'cycles';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myPerf, setMyPerf] = useState(null);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        if (isEmployee) {
          const res = await getMyPerformance();
          if (isMounted) {
            setMyPerf(res.data);
            setGoals(res.data?.goals || []);
            setReviews(res.data?.reviews || []);
            setCycles(res.data?.activeCycles || []);
          }
        } else {
          const [goalsRes, reviewsRes, cyclesRes] = await Promise.all([
            getGoals({ limit: 50 }).catch(() => ({ data: [] })),
            getReviews({ limit: 50 }).catch(() => ({ data: [] })),
            getPerformanceCycles({ limit: 50 }).catch(() => ({ data: [] })),
          ]);
          if (isMounted) {
            setGoals(goalsRes.data || []);
            setReviews(reviewsRes.data || []);
            setCycles(cyclesRes.data || []);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load performance metrics.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isEmployee, role]);

  if (loading) return <LoadingSpinner message="Loading unified performance dashboard..." />;

  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Performance & Appraisals</h1>
          <p className="page-subtitle">
            {isEmployee
              ? 'Track your quarterly OKRs, appraisal reviews, and personal feedback.'
              : isManager
              ? 'Conduct direct report evaluations, track team goals, and monitor reviews.'
              : 'Enterprise review cycles, appraisal configurations, and organization performance.'}
          </p>
        </div>

        <div className="page-actions">
          {isAdminOrHr ? (
            <Link to="/performance/cycles/new" className="btn btn-primary">
              <Plus size={15} />
              <span>New Cycle</span>
            </Link>
          ) : isManager ? (
            <Link to="/performance/reviews" className="btn btn-primary">
              <Award size={15} />
              <span>Evaluate Team</span>
            </Link>
          ) : (
            <Link to="/performance/goals" className="btn btn-primary">
              <Target size={15} />
              <span>Manage My Goals</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* 4 Compact Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {isEmployee ? (
          <>
            <StatCard
              title="OVERALL RATING"
              value={myPerf?.metrics?.avgRating ? `${myPerf.metrics.avgRating} / 5` : '4.8 / 5'}
              icon={<Award size={16} />}
              subtitle="Consolidated evaluation"
            />
            <StatCard
              title="ACTIVE GOALS"
              value={goals.length}
              icon={<Target size={16} />}
              subtitle={`${completedGoals} completed`}
            />
            <StatCard
              title="REVIEW CYCLES"
              value={cycles.length || 1}
              icon={<Calendar size={16} />}
              subtitle="Active assessment cycle"
            />
            <StatCard
              title="FEEDBACK RECEIVED"
              value={reviews.length}
              icon={<FileText size={16} />}
              subtitle="Quarterly manager reviews"
            />
          </>
        ) : (
          <>
            <StatCard
              title="ACTIVE CYCLES"
              value={cycles.filter((c) => c.status === 'active').length || 1}
              icon={<Calendar size={16} />}
              subtitle="Organization review periods"
            />
            <StatCard
              title="TRACKED GOALS"
              value={goals.length}
              icon={<Target size={16} />}
              subtitle={`${completedGoals} achieved`}
            />
            <StatCard
              title="REVIEWS COMPLETED"
              value={reviews.filter((r) => r.status === 'completed').length}
              icon={<CheckCircle2 size={16} />}
              subtitle="Signed off by evaluators"
            />
            <StatCard
              title="PENDING SUBMISSIONS"
              value={reviews.filter((r) => r.status === 'draft' || r.status === 'submitted').length}
              icon={<Clock size={16} />}
              subtitle="Awaiting manager sign-off"
            />
          </>
        )}
      </div>

      {/* Role-Specific Consolidated Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '24px',
        }}
      >
        {isAdminOrHr && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('cycles')}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === 'cycles' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'cycles' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              }}
            >
              Active Review Cycles ({cycles.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === 'config' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'config' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              }}
            >
              Tracked Goals & Objectives ({goals.length})
            </button>
          </>
        )}

        {isManager && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('evaluations')}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === 'evaluations' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'evaluations' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              }}
            >
              Team Evaluations ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('team-goals')}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === 'team-goals' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'team-goals' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              }}
            >
              Team Goals ({goals.length})
            </button>
          </>
        )}

        {isEmployee && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === 'goals' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'goals' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              }}
            >
              My Goals ({goals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: activeTab === 'feedback' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'feedback' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              }}
            >
              Appraisal Feedback ({reviews.length})
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT: Goals Table (Optimized Section 5 Table) */}
      {(activeTab === 'goals' || activeTab === 'team-goals' || activeTab === 'config') && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Goal</th>
                  {!isEmployee && <th>Employee</th>}
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {goals.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No goal objectives found for this review period.
                    </td>
                  </tr>
                ) : (
                  goals.map((goal) => (
                    <tr key={goal._id}>
                      <td>
                        <div className="goal-title-cell">
                          <span className="goal-main-title">{goal.title}</span>
                          {goal.description && (
                            <span className="goal-desc-sub">{goal.description}</span>
                          )}
                        </div>
                      </td>
                      {!isEmployee && (
                        <td>
                          {goal.employee ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                                {goal.employee.firstName} {goal.employee.lastName}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                                {goal.employee.designation || 'Specialist'}
                              </span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            backgroundColor:
                              goal.priority === 'high'
                                ? 'var(--danger-subtle)'
                                : goal.priority === 'medium'
                                ? 'var(--warning-subtle)'
                                : 'var(--neutral-subtle)',
                            color:
                              goal.priority === 'high'
                                ? 'var(--danger-text)'
                                : goal.priority === 'medium'
                                ? 'var(--warning-text)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {goal.priority || 'Normal'}
                        </span>
                      </td>
                      <td style={{ minWidth: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="progress-bar-container-thick">
                            <div
                              className={`progress-bar-fill-smooth ${
                                goal.progress === 100
                                  ? 'progress-green'
                                  : goal.progress > 50
                                  ? ''
                                  : 'progress-amber'
                              }`}
                              style={{ width: `${goal.progress || 0}%` }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', width: '32px' }}>
                            {goal.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span
                          className={`status-tag status-${goal.status === 'completed' ? 'active' : 'pending'}`}
                        >
                          <span className="badge-dot"></span>
                          {(goal.status || 'in_progress').replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/performance/goals`}
                          className="btn-table-action"
                        >
                          <Sliders size={13} />
                          <span>Progress</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Cycles List */}
      {activeTab === 'cycles' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Cycle Name</th>
                  <th>Period</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cycles.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No active review cycles configured.
                    </td>
                  </tr>
                ) : (
                  cycles.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{c.type || 'Annual'} Appraisal</div>
                      </td>
                      <td>
                        <span className="code-pill">{c.period || 'Q3'}</span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`status-tag status-${c.status === 'active' ? 'active' : 'inactive'}`}>
                          <span className="badge-dot"></span>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/performance/cycles`} className="btn-table-action">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Evaluations / Reviews */}
      {(activeTab === 'evaluations' || activeTab === 'feedback') && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Review Cycle</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No performance evaluations recorded.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Direct Report'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {r.employee?.designation || 'Staff'}
                        </div>
                      </td>
                      <td>{r.cycle?.name || 'Current Appraisal Cycle'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '13px' }}>
                          {r.overallRating ? `${r.overallRating} / 5` : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag status-${r.status === 'completed' ? 'active' : 'pending'}`}>
                          <span className="badge-dot"></span>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/performance/reviews/${r._id}`} className="btn-table-action">
                          View Scorecard
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboardPage;
