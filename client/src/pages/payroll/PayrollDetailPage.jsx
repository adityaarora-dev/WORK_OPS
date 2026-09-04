import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertCircle, Building2 } from 'lucide-react';
import { getPayrollById } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const PayrollDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getPayrollById(id)
      .then((res) => {
        if (isMounted) {
          setPayroll(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Unable to retrieve paystub');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Generating digital paystub..." />;
  }

  if (error || !payroll) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div className="action-banner banner-error">
          <AlertCircle size={16} />
          <span>{error || 'Paystub not found'}</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => navigate('/payroll')}
        >
          <ArrowLeft size={15} />
          <span>Return to Payroll</span>
        </button>
      </div>
    );
  }

  const emp = payroll.employee || {};
  const monthName = payroll.payPeriod?.month
    ? new Date(0, payroll.payPeriod.month - 1).toLocaleString('default', { month: 'long' })
    : '';

  return (
    <div className="employee-detail-wrapper">
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/payroll"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Payroll</span>
          </Link>
          <h1 className="page-main-title">Digital Earnings Statement</h1>
          <p className="page-sub-title">
            Statement for {monthName} {payroll.payPeriod?.year || 2026}
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Paystub</span>
          </button>
        </div>
      </div>

      {/* Paystub Document Card */}
      <div
        className="form-card"
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          padding: '36px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Paystub Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--border-default)',
            paddingBottom: '20px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Building2 size={20} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>HR Management System</h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              100 Enterprise Way, Suite 400 • Corporate Payroll Division
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              className={`status-tag status-${payroll.paymentStatus}`}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              <span className="badge-dot"></span>
              {payroll.paymentStatus?.toUpperCase()}
            </span>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '6px',
              }}
            >
              ID: {payroll._id?.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Employee & Period Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            padding: '16px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Employee Details
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
              {emp.firstName} {emp.lastName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {emp.designation || 'Staff Member'}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
              Employee ID: {emp.employeeId || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Payment Information
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              <strong>Period:</strong> {monthName} {payroll.payPeriod?.year}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <strong>Disbursement:</strong> {payroll.paymentMethod || 'Direct Deposit'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <strong>Date:</strong>{' '}
              {payroll.paymentDate
                ? new Date(payroll.paymentDate).toLocaleDateString()
                : 'Current Period'}
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
          {/* Earnings */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                borderBottom: '1px solid var(--border-default)',
                paddingBottom: '8px',
                marginBottom: '12px',
              }}
            >
              Earnings Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Basic Salary</span>
                <span>${(payroll.basicSalary || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Allowances</span>
                <span>${(payroll.allowances || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overtime</span>
                <span>${(payroll.overtime || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bonus / Incentive</span>
                <span>${(payroll.bonus || 0).toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                  marginTop: '4px',
                }}
              >
                <span>Total Gross Earnings</span>
                <span>${(payroll.grossSalary || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 600,
                borderBottom: '1px solid var(--border-default)',
                paddingBottom: '8px',
                marginBottom: '12px',
              }}
            >
              Deductions & Withholdings
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Standard Deductions</span>
                <span>${(payroll.deductions || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Income Tax Withholding</span>
                <span>${(payroll.tax || 0).toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                  marginTop: '4px',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Total Deductions</span>
                <span>-${((payroll.deductions || 0) + (payroll.tax || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay Callout */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--primary-text)',
                letterSpacing: '0.04em',
              }}
            >
              Net Disbursed Take-Home Pay
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Gross Earnings minus Authorized Taxes & Deductions
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.02em' }}>
            ${(payroll.netSalary || 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDetailPage;
