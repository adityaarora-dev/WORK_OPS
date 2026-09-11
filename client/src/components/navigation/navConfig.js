import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Banknote,
  FileText,
  TrendingUp,
  UserPlus,
  BarChart3,
  Shield,
  Settings,
  User,
  ShieldCheck,
  Bell,
  Activity,
} from 'lucide-react';

/**
 * Centralized Role-Aware Navigation Configuration with Lucide Icons.
 */
export const ROLE_NAVIGATION = {
  admin: [
    { label: 'Organization Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Governance', path: '/admin/users', icon: ShieldCheck },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { label: 'Security & Audit', path: '/audit-logs', icon: Shield },
    { label: 'System Configuration', path: '/system-admin', icon: Settings },
  ],

  hr: [
    { label: 'HR Overview', path: '/hr/dashboard', icon: LayoutDashboard },
    { label: 'Employee Directory', path: '/employees', icon: Users },
    { label: 'Recruitment Hub', path: '/recruitment', icon: UserPlus },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Leave Administration', path: '/leave', icon: CalendarDays },
    { label: 'Payroll Processing', path: '/payroll', icon: Banknote },
  ],

  manager: [
    { label: 'Team Console', path: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Team Members', path: '/employees', icon: Users },
    { label: 'Leave Approvals', path: '/leave', icon: CalendarDays },
    { label: 'Performance Reviews', path: '/performance', icon: TrendingUp },
  ],

  employee: [
    { label: 'My Workspace', path: '/employee/dashboard', icon: LayoutDashboard },
    { label: 'Time Off', path: '/leave', icon: CalendarDays },
    { label: 'Salary Slips', path: '/payroll', icon: Banknote },
    { label: 'Documents & Profile', path: '/profile', icon: User },
  ],
};

export const ROLE_NAVIGATION_SECTIONS = {
  admin: [
    {
      title: 'Platform Overview',
      items: [
        { label: 'Executive Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Departments', path: '/departments', icon: Building2 },
      ],
    },
    {
      title: 'Governance & Security',
      items: [
        { label: 'User Directory & Roles', path: '/admin/users', icon: ShieldCheck },
        { label: 'Security & Audit Logs', path: '/audit-logs', icon: Shield },
        { label: 'System Configuration', path: '/system-admin', icon: Settings },
      ],
    },
  ],

  hr: [
    {
      title: 'Operations Hub',
      items: [
        { label: 'HR Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'People & Talent',
      items: [
        { label: 'Employee Master', path: '/employees', icon: Users },
        { label: 'Recruitment & ATS', path: '/recruitment', icon: UserPlus },
      ],
    },
    {
      title: 'Time & Compensation',
      items: [
        { label: 'Daily Attendance', path: '/attendance', icon: Clock },
        { label: 'Leave Administration', path: '/leave', icon: CalendarDays },
        { label: 'Payroll & Vouchers', path: '/payroll', icon: Banknote },
      ],
    },
  ],

  manager: [
    {
      title: 'Console',
      items: [
        { label: 'Team Console', path: '/manager/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Team Management',
      items: [
        { label: 'Direct Reports', path: '/employees', icon: Users },
        { label: 'Leave Approvals', path: '/leave', icon: CalendarDays },
        { label: 'Performance Reviews', path: '/performance', icon: TrendingUp },
      ],
    },
  ],

  employee: [
    {
      title: 'Workspace',
      items: [
        { label: 'My Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
        { label: 'Documents & Profile', path: '/profile', icon: User },
      ],
    },
    {
      title: 'Self-Service',
      items: [
        { label: 'Leave & Time Off', path: '/leave', icon: CalendarDays },
        { label: 'Paystubs & Salary', path: '/payroll', icon: Banknote },
      ],
    },
  ],
};

export const getNavigationSectionsForRole = (role) => {
  const normalized = (role || 'employee').toLowerCase();
  return ROLE_NAVIGATION_SECTIONS[normalized] || ROLE_NAVIGATION_SECTIONS.employee;
};

export const getNavigationForRole = (role) => {
  const normalized = (role || 'employee').toLowerCase();
  return ROLE_NAVIGATION[normalized] || ROLE_NAVIGATION.employee;
};

export default ROLE_NAVIGATION;
