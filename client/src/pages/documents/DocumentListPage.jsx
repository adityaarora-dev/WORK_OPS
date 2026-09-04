import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FileImage,
  Upload,
  Download,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  getDocuments,
  downloadDocument,
  archiveDocument,
} from '../../services/documentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';

export const DocumentListPage = () => {
  const { user } = useAuth();
  const isAdminOrHr = ['admin', 'hr'].includes(user?.role?.toLowerCase());

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Downloading / Processing state
  const [downloadingId, setDownloadingId] = useState(null);
  const [archiveModal, setArchiveModal] = useState({
    isOpen: false,
    docId: null,
    docTitle: '',
  });
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getDocuments({
      page,
      limit: 10,
      documentType: selectedType,
      status: selectedStatus,
    })
      .then((res) => {
        if (isMounted) {
          setDocuments(res.data || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load documents');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, selectedType, selectedStatus]);

  const reloadData = () => {
    setLoading(true);
    getDocuments({
      page,
      limit: 10,
      documentType: selectedType,
      status: selectedStatus,
    })
      .then((res) => {
        setDocuments(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load documents');
      })
      .finally(() => setLoading(false));
  };

  const handleDownload = async (id, fileName) => {
    setDownloadingId(id);
    try {
      await downloadDocument(id, fileName);
      toast.success(`Downloading ${fileName}...`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveModal.docId) return;
    setArchiving(true);
    try {
      await archiveDocument(archiveModal.docId);
      toast.success(`Document "${archiveModal.docTitle}" archived.`);
      setArchiveModal({ isOpen: false, docId: null, docTitle: '' });
      reloadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to archive document');
    } finally {
      setArchiving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) {
      return <FileImage size={16} style={{ color: 'var(--primary)' }} />;
    }
    return <FileText size={16} style={{ color: 'var(--primary)' }} />;
  };

  return (
    <div className="employee-page-container">
      <div className="dashboard-page-header">
        <div>
          <h1 className="page-main-title">
            {user?.role === 'employee' ? 'My Document Center' : 'Document Repository'}
          </h1>
          <p className="page-sub-title">
            Encrypted file storage for contracts, certifications, verification IDs, and tax forms.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/documents/upload" className="btn btn-primary">
            <Upload size={15} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="filter-card">
        <div className="dropdown-filters">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Document Types</option>
            <option value="resume">Resume / CV</option>
            <option value="offer-letter">Offer Letter</option>
            <option value="contract">Employment Contract</option>
            <option value="id-proof">Government ID Proof</option>
            <option value="address-proof">Address Proof</option>
            <option value="certificate">Certification</option>
            <option value="tax-form">Tax Withholding Form</option>
            <option value="other">Other Documents</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="active">Active Documents</option>
            <option value="archived">Archived Documents</option>
            <option value="">All Records</option>
          </select>

          {(selectedType || selectedStatus !== 'active') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSelectedType('');
                setSelectedStatus('active');
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        {loading ? (
          <LoadingSpinner message="Loading document repository..." />
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={reloadData}
              style={{ marginTop: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No documents uploaded"
            description="No documents match the active filter criteria in the secure vault."
            action={
              <Link to="/documents/upload" className="btn btn-primary btn-sm">
                <Upload size={14} />
                <span>Upload First Document</span>
              </Link>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>File Size</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const emp = doc.employee || {};
                  return (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-surface-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div>
                            <div className="cell-primary">{doc.title}</div>
                            <div className="cell-secondary" style={{ fontSize: '11px' }}>
                              {doc.originalName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {emp.firstName ? (
                          <div>
                            <span style={{ fontWeight: 500 }}>
                              {emp.firstName} {emp.lastName}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {emp.employeeId}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {doc.documentType?.replace('-', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag status-${doc.status || 'active'}`}>
                          <span className="badge-dot"></span>
                          {doc.status || 'active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDownload(doc._id, doc.originalName)}
                            disabled={downloadingId === doc._id}
                            title="Download Secure File"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>

                          {isAdminOrHr && doc.status !== 'archived' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                setArchiveModal({
                                  isOpen: true,
                                  docId: doc._id,
                                  docTitle: doc.title,
                                })
                              }
                              title="Archive Document"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Archive size={14} />
                              <span>Archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && documents.length > 0 && (
          <div className="table-pagination">
            <span>
              Showing {documents.length} of {pagination.total} documents
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span style={{ padding: '0 8px', fontWeight: 500 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Archive Document Confirmation Modal */}
      <ConfirmModal
        isOpen={archiveModal.isOpen}
        title="Archive Document"
        message={`Are you sure you want to archive "${archiveModal.docTitle}"? It will be moved to archived records and remain preserved.`}
        confirmText="Archive Document"
        cancelText="Cancel"
        isDestructive={false}
        loading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveModal({ isOpen: false, docId: null, docTitle: '' })}
      />
    </div>
  );
};

export default DocumentListPage;
