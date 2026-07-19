import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './components/pages/HomePage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import DashboardPage from './components/pages/DashboardPage';
import TenantPortalPage from './components/pages/TenantPortalPage';

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const DashboardLayout = ({ children }) => (
  <div className="flex flex-col h-screen">
    <Navbar />
    <div className="flex-1 overflow-hidden">{children}</div>
  </div>
);

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
            <Route path="/tenant-portal" element={<TenantPortalPage />} />
            <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
