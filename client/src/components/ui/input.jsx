import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, type = 'text', error = false, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] shadow-xs transition-colors placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-60',
        error
          ? 'border-[var(--danger)] focus-visible:ring-[var(--danger-border)]'
          : 'border-[var(--border-default)] focus-visible:border-[var(--border-focus)] focus-visible:ring-[var(--primary-subtle)] focus-visible:ring-offset-[var(--bg-canvas)]',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
