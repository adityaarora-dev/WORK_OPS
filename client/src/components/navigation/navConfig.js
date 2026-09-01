/**
 * Centralized Role-Aware Navigation Configuration.
 * Defines permitted navigation items per role strictly according to Section 4.
 *
 * NOTE: Frontend navigation visibility is for user experience only.
 * Backend authorization remains the ultimate source of truth.
 */

export const ROLE_NAVIGATION = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'User Management', path: '/admin/users', icon: '🔑' },
    { label: 'Employee Management', path: '/employees', icon: '👥' },
    { label: 'Departments', path: '/departments', icon: '🏢' },
    { label: 'Attendance', path: '/attendance', icon: '⏱️' },
    { label: 'Leave Management', path: '/leave', icon: '📅' },
    { label: 'Payroll', path: '/payroll', icon: '💵' },
    { label: 'Performance', path: '/performance', icon: '📈' },
    { label: 'Recruitment', path: '/recruitment', icon: '🎯' },
    { label: 'Reports', path: '/reports', icon: '📑' },
    { label: 'System Administration', path: '/system-admin', icon: '⚙️' },
    { label: 'Settings', path: '/settings', icon: '🛠️' },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ],

  hr: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Employee Management', path: '/employees', icon: '👥' },
    { label: 'Departments', path: '/departments', icon: '🏢' },
    { label: 'Attendance', path: '/attendance', icon: '⏱️' },
    { label: 'Leave Management', path: '/leave', icon: '📅' },
    { label: 'HR Analytics', path: '/hr-analytics', icon: '📊' },
    { label: 'Reports', path: '/reports', icon: '📑' },
    { label: 'Profile', path: '/profile', icon: '👤' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ],

  manager: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'My Team', path: '/employees', icon: '👥' },
    { label: 'Team Attendance', path: '/attendance', icon: '⏱️' },
    { label: 'Team Leave', path: '/leave', icon: '📅' },
    { label: 'Team Performance', path: '/performance', icon: '📈' },
    { label: 'Team Reports', path: '/reports', icon: '📑' },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ],

  employee: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'My Profile', path: '/profile', icon: '👤' },
    { label: 'My Attendance', path: '/attendance', icon: '⏱️' },
    { label: 'My Leave', path: '/leave', icon: '📅' },
    { label: 'My Payroll', path: '/payroll', icon: '💵' },
    { label: 'My Documents', path: '/documents', icon: '📁' },
    { label: 'My Performance', path: '/performance', icon: '📈' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ],
};

/**
 * Returns the permitted navigation list for a given role.
 *
 * @param {string} role - 'admin' | 'hr' | 'manager' | 'employee'
 * @returns {Array<{ label: string, path: string, icon: string }>}
 */
export const getNavigationForRole = (role) => {
  const normalized = (role || 'employee').toLowerCase();
  return ROLE_NAVIGATION[normalized] || ROLE_NAVIGATION.employee;
};

export default ROLE_NAVIGATION;
