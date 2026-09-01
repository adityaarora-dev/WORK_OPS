import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
          department: emp.department || '',
          designation: emp.designation || '',
          employmentType: emp.employmentType || 'full-time',
          employmentStatus: emp.employmentStatus || 'active',
          joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
          dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
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
      navigate(`/employees/${id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading employee record for modification..." />;
  }

  if (!formData) {
    return (
      <div className="error-view-wrapper">
        <p>Employee record not found or inaccessible.</p>
        <Link to="/employees" className="btn-secondary mt-3">
          ← Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <div className="breadcrumb-line">
            <Link to={`/employees/${id}`}>← Back to Profile</Link>
          </div>
          <h1 className="page-main-title">
            Edit Employee: {formData.firstName} {formData.lastName}
          </h1>
          <p className="page-sub-title">
            Modify corporate designations, reporting hierarchy, and contact records. (Employee ID:{' '}
            <strong>{formData.employeeId}</strong>)
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
              <p className="section-sub">Legal names and demographic data</p>
            </div>
          </div>

          <div className="form-fields-grid">
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

        {/* SECTION 2: Employment Details */}
        <section className="form-card-section">
          <div className="section-header">
            <span className="section-number">2</span>
            <div>
              <h3>Employment Status & Organization</h3>
              <p className="section-sub">Department, role, and reporting lines</p>
            </div>
          </div>

          <div className="form-fields-grid">
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
              <label htmlFor="designation">Designation / Job Title</label>
              <input
                id="designation"
                type="text"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                required
              />
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
              <label htmlFor="manager">Reporting Supervisor / Manager</label>
              <select
                id="manager"
                value={formData.manager}
                onChange={(e) => handleChange('manager', e.target.value)}
              >
                <option value="">-- None / Executive --</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} ({m.employeeId} - {m.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 3: Contact & Address */}
        <section className="form-card-section">
          <div className="section-header">
            <span className="section-number">3</span>
            <div>
              <h3>Contact & Emergency Information</h3>
              <p className="section-sub">Communication and emergency numbers</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
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
              <label htmlFor="state">State</label>
              <input
                id="state"
                type="text"
                value={formData.address.state}
                onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyName">Emergency Contact Name</label>
              <input
                id="emergencyName"
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyPhone">Emergency Contact Phone</label>
              <input
                id="emergencyPhone"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="form-actions-bar">
          <Link to={`/employees/${id}`} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEditPage;
