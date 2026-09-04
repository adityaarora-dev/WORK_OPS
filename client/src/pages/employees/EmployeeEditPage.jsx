import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getEmployeeById, updateEmployee, getEmployees } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const EmployeeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    Promise.all([
      getEmployeeById(id),
      getEmployees({ limit: 50 }),
    ])
      .then(([empRes, mgrRes]) => {
        const emp = empRes.data;
        setFormData({
          employeeId: emp.employeeId,
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          email: emp.email || '',
          phone: emp.phone || '',
          alternatePhone: emp.alternatePhone || '',
          department:
            (typeof emp.department === 'object' && emp.department !== null
              ? emp.department.name
              : emp.department) || '',
          designation: emp.designation || '',
          employmentType: emp.employmentType || 'full-time',
          employmentStatus: emp.employmentStatus || 'active',
          joiningDate: emp.joiningDate
            ? new Date(emp.joiningDate).toISOString().split('T')[0]
            : '',
          dateOfBirth: emp.dateOfBirth
            ? new Date(emp.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: emp.gender || 'prefer-not-to-say',
          manager: emp.manager?._id || '',
          address: {
            street: emp.address?.street || '',
            city: emp.address?.city || '',
            state: emp.address?.state || '',
            postalCode: emp.address?.postalCode || '',
            country: emp.address?.country || 'United States',
          },
          emergencyContact: {
            name: emp.emergencyContact?.name || '',
            phone: emp.emergencyContact?.phone || '',
            relationship: emp.emergencyContact?.relationship || '',
          },
        });

        // Filter out self from candidate managers
        setManagers((mgrRes.data || []).filter((m) => m._id !== emp._id));
      })
      .catch((err) => {
        setFormError(err.message || 'Failed to load employee details for editing.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        manager: formData.manager || null,
        dateOfBirth: formData.dateOfBirth || null,
      };

      await updateEmployee(id, payload);
      toast.success('Employee profile updated successfully.');
      navigate(`/employees/${id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to save changes.');
      toast.error(err.message || 'Failed to update employee.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading employee record for modification..." />;
  }

  if (!formData) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Employee record not found or inaccessible.</p>
        <Link to="/employees" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
          <ArrowLeft size={14} />
          <span>Return to Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <Link
            to={`/employees/${id}`}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Profile</span>
          </Link>
          <h1 className="page-main-title">
            Edit Employee: {formData.firstName} {formData.lastName}
          </h1>
          <p className="page-sub-title">
            Update role assignment, designation, status, and contact details.
          </p>
        </div>
      </div>

      {formError && (
        <div className="action-banner banner-error">
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        {/* Personal & Identification */}
        <div className="form-section-title">Personal Details & Identification</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="employeeId">Employee ID (System Assigned)</label>
            <input
              id="employeeId"
              type="text"
              value={formData.employeeId}
              disabled
              style={{ backgroundColor: 'var(--bg-surface-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Role & Assignment */}
        <div className="form-section-title">Organization & Status</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input
              id="designation"
              type="text"
              value={formData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="employmentStatus">Employment Status</label>
            <select
              id="employmentStatus"
              value={formData.employmentStatus}
              onChange={(e) => handleChange('employmentStatus', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manager">Reporting Supervisor</label>
            <select
              id="manager"
              value={formData.manager}
              onChange={(e) => handleChange('manager', e.target.value)}
            >
              <option value="">None (Executive / Root Direct Report)</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.firstName} {m.lastName} ({m.employeeId} - {m.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Info */}
        <div className="form-section-title">Contact & Address</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="street">Street Address</label>
            <input
              id="street"
              type="text"
              value={formData.address.street}
              onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              value={formData.address.city}
              onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State / Province</label>
            <input
              id="state"
              type="text"
              value={formData.address.state}
              onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Link to={`/employees/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Save size={15} />
            <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEditPage;
