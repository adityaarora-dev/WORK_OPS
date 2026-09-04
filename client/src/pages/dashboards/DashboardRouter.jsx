import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const DashboardRouter = () => {
  const { user } = useAuth();
  const role = (user?.role || 'employee').toLowerCase();

  switch (role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'hr':
      return <Navigate to="/hr/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'employee':
    default:
      return <Navigate to="/employee/dashboard" replace />;
  }
};

export default DashboardRouter;
