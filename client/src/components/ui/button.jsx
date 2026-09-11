import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-white shadow-xs hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-[var(--bg-canvas)]',
        primary:
          'bg-[var(--primary)] text-white shadow-xs hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-[var(--bg-canvas)]',
        secondary:
          'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)] active:bg-[var(--bg-surface-pressed)] focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-[var(--bg-canvas)]',
        outline:
          'border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-[var(--bg-canvas)]',
        ghost:
          'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-[var(--bg-canvas)]',
        destructive:
          'bg-[var(--danger)] text-white shadow-xs hover:bg-[var(--danger-hover)] active:opacity-90 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-[var(--bg-canvas)]',
        link:
          'text-[var(--primary)] underline-offset-4 hover:underline hover:text-[var(--primary-hover)] p-0 h-auto font-medium shadow-none',
      },
      size: {
        default: 'h-8 px-3.5',
        sm: 'h-7 px-2.5 text-[11px] rounded-md',
        lg: 'h-9 px-4 text-sm',
        icon: 'h-8 w-8 p-0',
        iconSm: 'h-7 w-7 rounded-md p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button = forwardRef(
  ({ className, variant, size, loading = false, disabled = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
