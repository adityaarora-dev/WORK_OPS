import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createDepartment } from '../../services/departmentService';
import { getEmployees } from '../../services/employeeService';

export const DepartmentCreatePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentHead: '',
    location: 'Main Headquarters',
    status: 'active',
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    getEmployees({ limit: 100 })
      .then((res) => setEmployees(res.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Department name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        departmentHead: formData.departmentHead || null,
      };

      const result = await createDepartment(payload);
      if (result.success) {
        toast.success(`Department "${formData.name}" created successfully.`);
        navigate(`/departments/${result.data._id}`);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create department.');
      toast.error('Failed to create department.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/departments"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Departments</span>
          </Link>
          <h1 className="page-main-title">Create Department</h1>
          <p className="page-sub-title">
            Establish a new organizational division, assign leadership, and set location.
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
        <div className="form-section-title">Department Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">
              Department Name <span className="required-star">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Legal & Compliance, Logistics"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="departmentHead">Department Head / Director</label>
            <select
              id="departmentHead"
              value={formData.departmentHead}
              onChange={(e) => handleChange('departmentHead', e.target.value)}
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Facility / Location</label>
            <input
              id="location"
              type="text"
              placeholder="e.g. Corporate HQ, Remote"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Initial Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '8px' }}>
          <label htmlFor="description">Scope & Description</label>
          <textarea
            id="description"
            rows="3"
            placeholder="Brief statement of department scope and functional responsibilities..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <Link to="/departments" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Plus size={15} />
            <span>{loading ? 'Creating Department...' : 'Create Department'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentCreatePage;
