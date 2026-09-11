import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium tracking-tight rounded-md border transition-colors select-none tabular-nums',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary-subtle)] text-[var(--primary-text)] border-[var(--primary-border)]',
        primary:
          'bg-[var(--primary-subtle)] text-[var(--primary-text)] border-[var(--primary-border)]',
        secondary:
          'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]',
        outline:
          'border-[var(--border-default)] text-[var(--text-secondary)] bg-transparent',
        success:
          'bg-[var(--success-subtle)] text-[var(--success-text)] border-[var(--success-border)]',
        warning:
          'bg-[var(--warning-subtle)] text-[var(--warning-text)] border-[var(--warning-border)]',
        destructive:
          'bg-[var(--danger-subtle)] text-[var(--danger-text)] border-[var(--danger-border)]',
        info:
          'bg-[var(--info-subtle)] text-[var(--info-text)] border-[var(--info-border)]',
        admin:
          'bg-[var(--role-admin-subtle)] text-[var(--role-admin-text)] border-[var(--role-admin-border)]',
        hr:
          'bg-[var(--role-hr-subtle)] text-[var(--role-hr-text)] border-[var(--role-hr-border)]',
        manager:
          'bg-[var(--role-manager-subtle)] text-[var(--role-manager-text)] border-[var(--role-manager-border)]',
        employee:
          'bg-[var(--role-employee-subtle)] text-[var(--role-employee-text)] border-[var(--role-employee-border)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, dot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-[var(--success)]',
            variant === 'warning' && 'bg-[var(--warning)]',
            variant === 'destructive' && 'bg-[var(--danger)]',
            variant === 'info' && 'bg-[var(--info)]',
            variant === 'admin' && 'bg-[var(--role-admin)]',
            variant === 'hr' && 'bg-[var(--role-hr)]',
            variant === 'manager' && 'bg-[var(--role-manager)]',
            variant === 'employee' && 'bg-[var(--role-employee)]',
            (!variant || variant === 'default' || variant === 'primary') && 'bg-[var(--primary)]',
            (variant === 'secondary' || variant === 'outline') && 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
