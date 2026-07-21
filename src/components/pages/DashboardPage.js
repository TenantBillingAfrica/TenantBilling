import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SystemAdminDashboard from '../dashboards/SystemAdminDashboard';
import InstanceAdminDashboard from '../dashboards/InstanceAdminDashboard';
import TenantStatementDashboard from '../dashboards/TenantStatementDashboard';

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'system_admin':
      return <SystemAdminDashboard />;
    case 'instance_admin':
    case 'meter_reader':
      return <InstanceAdminDashboard />;
    case 'tenant':
      return <TenantStatementDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardPage;
