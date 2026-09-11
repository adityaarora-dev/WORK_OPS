import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export const ThemeToggle = ({ variant = 'segmented', className = '' }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compact Segmented Pill (Linear / Stripe / Skiper style with micro-spring)
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center p-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] transition-colors',
          className
        )}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center justify-center p-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
            theme === 'light'
              ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm border border-[var(--border-subtle)] scale-[1.02]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          )}
          title="Light Mode"
          aria-label="Light mode"
          aria-pressed={theme === 'light'}
        >
          <Sun size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center justify-center p-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
            theme === 'dark'
              ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm border border-[var(--border-subtle)] scale-[1.02]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          )}
          title="Dark Mode"
          aria-label="Dark mode"
          aria-pressed={theme === 'dark'}
        >
          <Moon size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center justify-center p-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
            theme === 'system'
              ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm border border-[var(--border-subtle)] scale-[1.02]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          )}
          title="System Preference"
          aria-label="System preference"
          aria-pressed={theme === 'system'}
        >
          <Monitor size={14} strokeWidth={2} />
        </button>
      </div>
    );
  }

  // Dropdown Button variant (Vercel style)
  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] cursor-pointer"
        aria-label="Toggle theme menu"
        aria-expanded={dropdownOpen}
      >
        {resolvedTheme === 'dark' ? (
          <Moon size={15} strokeWidth={1.8} className="text-[var(--primary)]" />
        ) : (
          <Sun size={15} strokeWidth={1.8} className="text-[var(--primary)]" />
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-floating)] p-1 shadow-lg shadow-black/20 z-50">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setDropdownOpen(false);
            }}
            className={cn(
              'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
              theme === 'light'
                ? 'bg-[var(--bg-surface-raised)] text-[var(--primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] text-left'
            )}
          >
            <span className="flex items-center gap-2">
              <Sun size={14} strokeWidth={1.8} /> Light
            </span>
            {theme === 'light' && <Check size={13} className="text-[var(--primary)]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setDropdownOpen(false);
            }}
            className={cn(
              'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
              theme === 'dark'
                ? 'bg-[var(--bg-surface-raised)] text-[var(--primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] text-left'
            )}
          >
            <span className="flex items-center gap-2">
              <Moon size={14} strokeWidth={1.8} /> Dark
            </span>
            {theme === 'dark' && <Check size={13} className="text-[var(--primary)]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setDropdownOpen(false);
            }}
            className={cn(
              'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
              theme === 'system'
                ? 'bg-[var(--bg-surface-raised)] text-[var(--primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] text-left'
            )}
          >
            <span className="flex items-center gap-2">
              <Monitor size={14} strokeWidth={1.8} /> System
            </span>
            {theme === 'system' && <Check size={13} className="text-[var(--primary)]" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
