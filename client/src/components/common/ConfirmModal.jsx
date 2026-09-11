import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/button';

export const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  loading = false,
}) => {
  const dialogRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onCancel}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            {isDestructive && (
              <div className="w-7 h-7 rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger-border)] flex items-center justify-center text-[var(--danger)] flex-shrink-0">
                <AlertTriangle size={15} strokeWidth={2} />
              </div>
            )}
            <h3 id="modal-title" className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
            disabled={loading}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body p-5">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="modal-footer flex items-center justify-end gap-2.5 p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
