import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  // Fetch candidate managers
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
        navigate(`/employees/${result.data._id}`);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create employee record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <div className="breadcrumb-line">
            <Link to="/employees">← Back to Employee Directory</Link>
          </div>
          <h1 className="page-main-title">Onboard New Employee</h1>
          <p className="page-sub-title">
            Register a verified profile across HR records, department assignment, and reporting lines.
          </p>
        </div>
      </div>

      {formError && (
        <div className="error-banner mb-4">
          <span className="error-icon">⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="employee-multi-form">
        {/* SECTION 1: Personal Information */}
        <section className="form-card-section">
          <div className="section-header">
            <span className="section-number">1</span>
            <div>
              <h3>Personal Information</h3>
              <p className="section-sub">Basic legal identification and demographics</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="form-group">
              <label htmlFor="firstName">
                First Name <span className="required-star">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="e.g. John"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={fieldErrors.firstName ? 'input-error' : ''}
                required
              />
              {fieldErrors.firstName && <span className="field-error-msg">{fieldErrors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                Last Name <span className="required-star">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={fieldErrors.lastName ? 'input-error' : ''}
                required
              />
              {fieldErrors.lastName && <span className="field-error-msg">{fieldErrors.lastName}</span>}
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
        </section>

        {/* SECTION 2: Contact & Address */}
        <section className="form-card-section">
          <div className="section-header">
            <span className="section-number">2</span>
            <div>
              <h3>Contact & Residential Information</h3>
              <p className="section-sub">Communication channels and address</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="form-group">
              <label htmlFor="email">
                Company / Primary Email <span className="required-star">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. john.doe@hrms.local"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={fieldErrors.email ? 'input-error' : ''}
                required
              />
              {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. +1 (555) 012-3456"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="alternatePhone">Alternate Phone</label>
              <input
                id="alternatePhone"
                type="tel"
                placeholder="Secondary contact"
                value={formData.alternatePhone}
                onChange={(e) => handleChange('alternatePhone', e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="street">Street Address</label>
              <input
                id="street"
                type="text"
                placeholder="e.g. 100 Enterprise Way, Suite 400"
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
              <label htmlFor="state">State / Province</label>
              <input
                id="state"
                type="text"
                placeholder="e.g. CA"
                value={formData.address.state}
                onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">Postal Code</label>
              <input
                id="postalCode"
                type="text"
                placeholder="e.g. 94105"
                value={formData.address.postalCode}
                onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
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
        </section>

        {/* SECTION 3: Employment Details */}
        <section className="form-card-section">
          <div className="section-header">
            <span className="section-number">3</span>
            <div>
              <h3>Employment & Department Assignment</h3>
              <p className="section-sub">Corporate role, reporting hierarchy, and work status</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="form-group">
              <label htmlFor="department">
                Department <span className="required-star">*</span>
              </label>
              <input
                id="department"
                type="text"
                placeholder="e.g. Engineering, HR, Product, Marketing"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className={fieldErrors.department ? 'input-error' : ''}
                required
              />
              {fieldErrors.department && (
                <span className="field-error-msg">{fieldErrors.department}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="designation">
                Designation / Job Title <span className="required-star">*</span>
              </label>
              <input
                id="designation"
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                className={fieldErrors.designation ? 'input-error' : ''}
                required
              />
              {fieldErrors.designation && (
                <span className="field-error-msg">{fieldErrors.designation}</span>
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
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="employmentStatus">Employment Status</label>
              <select
                id="employmentStatus"
                value={formData.employmentStatus}
                onChange={(e) => handleChange('employmentStatus', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
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
              <label htmlFor="manager">Reporting Manager</label>
              <select
                id="manager"
                value={formData.manager}
                onChange={(e) => handleChange('manager', e.target.value)}
              >
                <option value="">-- None / Direct Report to Executive --</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} ({m.employeeId} - {m.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 4: Emergency Contact */}
        <section className="form-card-section">
          <div className="section-header">
            <span className="section-number">4</span>
            <div>
              <h3>Emergency Contact</h3>
              <p className="section-sub">Next-of-kin contact details</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="form-group">
              <label htmlFor="emergencyName">Contact Name</label>
              <input
                id="emergencyName"
                type="text"
                placeholder="Full name of contact"
                value={formData.emergencyContact.name}
                onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyPhone">Contact Phone</label>
              <input
                id="emergencyPhone"
                type="tel"
                placeholder="+1 (555) 000-0000"
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
        </section>

        {/* Form Controls */}
        <div className="form-actions-bar">
          <Link to="/employees" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Profile...' : 'Save & Onboard Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreatePage;
