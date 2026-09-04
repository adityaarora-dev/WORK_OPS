import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { uploadDocument } from '../../services/documentService';
import { getEmployees } from '../../services/employeeService';

export const DocumentUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrHr = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  const [employees, setEmployees] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    employee: '',
    documentType: 'contract',
    title: '',
    description: '',
  });

  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isAdminOrHr) {
      getEmployees({ limit: 100 })
        .then((res) => setEmployees(res.data || []))
        .catch(() => {});
    }
  }, [isAdminOrHr]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('File size exceeds the 10MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
      setFormError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedFile) {
      setFormError('Please select a file to upload (PDF, JPEG, or PNG).');
      return;
    }

    if (isAdminOrHr && !formData.employee) {
      setFormError('Please associate the document with an employee.');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Document title is required.');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('title', formData.title.trim());
      data.append('documentType', formData.documentType);
      data.append('description', formData.description.trim());
      if (formData.employee) {
        data.append('employee', formData.employee);
      }

      await uploadDocument(data);
      toast.success('Document uploaded to secure vault successfully.');
      navigate('/documents');
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to upload document');
      toast.error('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="employee-form-container">
      <div className="dashboard-page-header">
        <div>
          <Link
            to="/documents"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', marginBottom: '8px', display: 'inline-flex' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Documents</span>
          </Link>
          <h1 className="page-main-title">Upload Employee Document</h1>
          <p className="page-sub-title">
            Store documents securely with access control policies and encrypted storage.
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
        <div className="form-section-title">Document Metadata</div>
        <div className="form-grid">
          {isAdminOrHr && (
            <div className="form-group">
              <label htmlFor="employee">
                Target Employee <span className="required-star">*</span>
              </label>
              <select
                id="employee"
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
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
          )}

          <div className="form-group">
            <label htmlFor="documentType">Category</label>
            <select
              id="documentType"
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
            >
              <option value="contract">Employment Contract</option>
              <option value="offer-letter">Offer Letter</option>
              <option value="resume">Resume / Curriculum Vitae</option>
              <option value="id-proof">Government Identification</option>
              <option value="address-proof">Proof of Address</option>
              <option value="certificate">Certification or Degree</option>
              <option value="tax-form">Tax Withholding Form</option>
              <option value="other">Other Official Document</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              Document Title <span className="required-star">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. 2026 Employment Agreement"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
        </div>

        {/* File Dropzone */}
        <div className="form-section-title" style={{ marginTop: '20px' }}>
          Select File
        </div>
        <div
          style={{
            border: '2px dashed var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '32px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface-subtle)',
            cursor: 'pointer',
            transition: 'border-color 0.12s ease',
          }}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              border: '1px solid var(--border-default)',
            }}
          >
            <Upload size={20} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {selectedFile ? selectedFile.name : 'Click to select a file from your device'}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Supported formats: PDF, JPEG, PNG • Maximum size: 10 MB
          </p>

          {selectedFile && (
            <div
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: 'var(--success-subtle)',
                color: 'var(--success-text)',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={13} />
              <span>
                File ready ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label htmlFor="description">Notes or Remarks</label>
          <textarea
            id="description"
            rows="2"
            placeholder="Optional notes or compliance details..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <Link to="/documents" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            <Upload size={15} />
            <span>{uploading ? 'Uploading Secure File...' : 'Upload to Vault'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploadPage;
