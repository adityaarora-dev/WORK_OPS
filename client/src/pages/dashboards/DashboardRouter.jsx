import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import HrDashboard from './HrDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export const DashboardRouter = () => {
  const { user } = useAuth();
  const role = (user?.role || 'employee').toLowerCase();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'hr':
      return <HrDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
    default:
      return <EmployeeDashboard />;
  }
};

export default DashboardRouter;
