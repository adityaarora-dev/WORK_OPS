import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getDepartmentById, updateDepartment } from '../../services/departmentService';
import { getEmployees } from '../../services/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const DepartmentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    Promise.all([
      getDepartmentById(id),
      getEmployees({ limit: 100 }),
    ])
      .then(([deptRes, empRes]) => {
        const dept = deptRes.data;
        setFormData({
          departmentId: dept.departmentId,
          name: dept.name || '',
          description: dept.description || '',
          departmentHead: dept.departmentHead?._id || '',
          location: dept.location || 'Main Campus',
          status: dept.status || 'active',
        });
        setEmployees(empRes.data || []);
      })
      .catch((err) => {
        setFormError(err.response?.data?.message || err.message || 'Failed to load department.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        departmentHead: formData.departmentHead || null,
        location: formData.location.trim(),
        status: formData.status,
      };

      await updateDepartment(id, payload);
      toast.success('Department updated successfully.');
      navigate(`/departments/${id}`);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update department.');
      toast.error('Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading department configuration..." />;
  }

  if (!formData) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Department record not found or inaccessible.</p>
        <Link to="/departments" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
          <ArrowLeft size={14} />
          <span>Return to Departments</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <Link
            to={`/departments/${id}`}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Department</span>
          </Link>
          <h1 className="page-main-title">Edit Department: {formData.name}</h1>
          <p className="page-sub-title">
            Update organizational metadata, leadership assignment, and status.
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
            <label htmlFor="deptId">Department ID (System Assigned)</label>
            <input
              id="deptId"
              type="text"
              value={formData.departmentId}
              disabled
              style={{ backgroundColor: 'var(--bg-surface-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Department Name <span className="required-star">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="departmentHead">Department Head</label>
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
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
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
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <Link to={`/departments/${id}`} className="btn btn-secondary">
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

export default DepartmentEditPage;
