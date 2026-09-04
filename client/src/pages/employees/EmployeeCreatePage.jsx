import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createEmployee, getEmployees } from '../../services/employeeService';

export const EmployeeCreatePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    department: '',
    designation: '',
    employmentType: 'full-time',
    employmentStatus: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    gender: 'prefer-not-to-say',
    manager: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getEmployees({ limit: 50 })
      .then((res) => {
        setManagers(res.data || []);
      })
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
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

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!formData.department.trim()) errors.department = 'Department is required.';
    if (!formData.designation.trim()) errors.designation = 'Designation is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      setFormError('Please resolve required fields before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        manager: formData.manager || null,
        dateOfBirth: formData.dateOfBirth || null,
      };

      const result = await createEmployee(payload);
      if (result.success) {
        toast.success(`Employee ${formData.firstName} ${formData.lastName} onboarded successfully!`);
        navigate(`/employees/${result.data._id}`);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create employee record.');
      toast.error(err.message || 'Failed to onboard employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/employees"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Directory</span>
          </Link>
          <h1 className="page-main-title">Onboard New Employee</h1>
          <p className="page-sub-title">
            Register a verified profile across HR records, department assignment, and reporting lines.
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
        {/* SECTION 1: Personal Information */}
        <div className="form-section-title">1. Personal Details & Identification</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="firstName">
              First Name <span className="required-star">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="e.g. Eleanor"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
            {fieldErrors.firstName && (
              <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{fieldErrors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              Last Name <span className="required-star">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="e.g. Vance"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
            {fieldErrors.lastName && (
              <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{fieldErrors.lastName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Work Email <span className="required-star">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="e.g. eleanor.vance@company.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
            {fieldErrors.email && (
              <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* SECTION 2: Employment Details */}
        <div className="form-section-title" style={{ marginTop: '20px' }}>
          2. Role & Department Assignment
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="department">
              Department <span className="required-star">*</span>
            </label>
            <input
              id="department"
              type="text"
              placeholder="e.g. Engineering, Finance, HR"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              required
            />
            {fieldErrors.department && (
              <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{fieldErrors.department}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="designation">
              Designation / Title <span className="required-star">*</span>
            </label>
            <input
              id="designation"
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={formData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              required
            />
            {fieldErrors.designation && (
              <span style={{ color: 'var(--danger)', fontSize: '11px' }}>{fieldErrors.designation}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="employmentType">Employment Type</label>
            <select
              id="employmentType"
              value={formData.employmentType}
              onChange={(e) => handleChange('employmentType', e.target.value)}
            >
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contractor</option>
              <option value="intern">Internship</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="joiningDate">Joining Date</label>
            <input
              id="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => handleChange('joiningDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="manager">Reporting Supervisor / Manager</label>
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

        {/* SECTION 3: Contact & Address */}
        <div className="form-section-title" style={{ marginTop: '20px' }}>
          3. Contact Information
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="phone">Primary Phone</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +1 555 123 4567"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="street">Street Address</label>
            <input
              id="street"
              type="text"
              placeholder="e.g. 100 Main Street"
              value={formData.address.street}
              onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              placeholder="e.g. San Francisco"
              value={formData.address.city}
              onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              id="state"
              type="text"
              placeholder="e.g. CA"
              value={formData.address.state}
              onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              value={formData.address.country}
              onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 4: Emergency Contact */}
        <div className="form-section-title" style={{ marginTop: '20px' }}>
          4. Emergency Contact
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="emergencyName">Contact Name</label>
            <input
              id="emergencyName"
              type="text"
              placeholder="e.g. Jane Doe"
              value={formData.emergencyContact.name}
              onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencyPhone">Contact Phone</label>
            <input
              id="emergencyPhone"
              type="tel"
              placeholder="e.g. +1 555 987 6543"
              value={formData.emergencyContact.phone}
              onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencyRelationship">Relationship</label>
            <input
              id="emergencyRelationship"
              type="text"
              placeholder="e.g. Spouse, Parent, Sibling"
              value={formData.emergencyContact.relationship}
              onChange={(e) =>
                handleNestedChange('emergencyContact', 'relationship', e.target.value)
              }
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Link to="/employees" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <UserPlus size={15} />
            <span>{loading ? 'Submitting...' : 'Complete Onboarding'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreatePage;
