import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SystemAdminDashboard from '../dashboards/SystemAdminDashboard';
import InstanceAdminDashboard from '../dashboards/InstanceAdminDashboard';
import MeterReaderDashboard from '../dashboards/MeterReaderDashboard';
import TenantStatementDashboard from '../dashboards/TenantStatementDashboard';

const DashboardPage = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'system_admin':
      return <SystemAdminDashboard />;
    case 'instance_admin':
      return <InstanceAdminDashboard />;
    case 'meter_reader':
      return <MeterReaderDashboard />;
    case 'tenant':
      return <TenantStatementDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardPage;
