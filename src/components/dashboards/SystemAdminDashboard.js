import React, { useState } from 'react';
import {
  LayoutDashboard, Users, TrendingUp, DollarSign, Settings,
  CheckCircle, XCircle, Clock, Building2, Eye,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const MOCK_APPLICATIONS = [
  { id: 'app-001', name: 'James Kamau', company: 'Kamau Properties', country: 'KE', email: 'james@kamau.co.ke', status: 'pending', date: '2026-07-10', tenants: 0 },
  { id: 'app-002', name: 'Grace Achieng', company: 'Lakeview Apartments', country: 'KE', email: 'grace@lakeview.co.ke', status: 'active', date: '2026-06-15', tenants: 42 },
  { id: 'app-003', name: 'Moussa Diallo', company: 'Diallo Immobilier', country: 'CI', email: 'moussa@diallo.ci', status: 'active', date: '2026-05-20', tenants: 78 },
  { id: 'app-004', name: 'Fatima Okoro', company: 'Okoro Estates', country: 'NG', email: 'fatima@okoro.ng', status: 'suspended', date: '2026-04-01', tenants: 15 },
];

const TABS = [
  { key: 'overview', label: 'admin_dashboard', icon: LayoutDashboard },
  { key: 'applications', label: 'admin_applications', icon: Users },
  { key: 'performance', label: 'admin_performance', icon: TrendingUp },
  { key: 'pnl', label: 'admin_pnl', icon: DollarSign },
  { key: 'settings', label: 'admin_settings', icon: Settings },
];

const SystemAdminDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    totalInstances: MOCK_APPLICATIONS.filter(a => a.status === 'active').length,
    totalTenants: MOCK_APPLICATIONS.reduce((sum, a) => sum + a.tenants, 0),
    pendingApps: MOCK_APPLICATIONS.filter(a => a.status === 'pending').length,
    monthlyRevenue: MOCK_APPLICATIONS.reduce((sum, a) => sum + a.tenants, 0) * 1000,
    platformShare: MOCK_APPLICATIONS.reduce((sum, a) => sum + a.tenants, 0) * 300,
    operatorShare: MOCK_APPLICATIONS.reduce((sum, a) => sum + a.tenants, 0) * 700,
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'suspended': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-warm-50 text-gray-500 border border-gray-200';
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 bg-navy-800 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-4 border-b border-navy-700">
          <p className="text-xs font-mono uppercase tracking-widest text-white/50">System Admin</p>
        </div>
        <nav className="flex-1 py-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-none cursor-pointer transition-colors ${
                  isActive ? 'bg-navy-700 text-white' : 'bg-transparent text-white/50 hover:text-white hover:bg-navy-700'
                }`}
              >
                <Icon size={14} />
                {t(tab.label)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 bg-warm-50">
        {activeTab === 'overview' && (
          <>
            <h2 className="text-lg font-bold text-navy-800 mb-6">{t('admin_dashboard')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 mb-8">
              {[
                { label: 'Active Instances', value: stats.totalInstances, icon: Building2 },
                { label: 'Total Tenants', value: stats.totalTenants.toLocaleString(), icon: Users },
                { label: 'Pending Applications', value: stats.pendingApps, icon: Clock },
                { label: 'Monthly Revenue', value: `KES ${(stats.monthlyRevenue / 1000).toFixed(0)}K`, icon: DollarSign },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-mono uppercase tracking-wider text-white/50">{stat.label}</p>
                      <Icon size={16} className="text-gray-300" />
                    </div>
                    <p className="text-2xl font-extrabold text-navy-800">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Revenue split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-8">
              <div className="bg-white border border-gray-200 p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Platform Share (30%)</p>
                <p className="text-2xl font-extrabold text-navy-800">KES {stats.platformShare.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-gray-200 p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Operator Share (70%)</p>
                <p className="text-2xl font-extrabold text-navy-800">KES {stats.operatorShare.toLocaleString()}</p>
              </div>
            </div>

            {/* Recent applications */}
            <div className="bg-white border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-xs font-mono uppercase tracking-widest text-white/50">Recent Applications</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {['Company', 'Owner', 'Country', 'Status', 'Tenants', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-mono uppercase tracking-wider text-white/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_APPLICATIONS.map(app => (
                    <tr key={app.id} className="border-b border-zinc-50 hover:bg-warm-50">
                      <td className="px-5 py-3 text-sm font-semibold text-navy-800">{app.company}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{app.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{app.country}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase ${getStatusStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{app.tenants}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-white/50 hover:text-navy-800 bg-transparent border-none cursor-pointer"><Eye size={14} /></button>
                          <button className="p-1 text-emerald-400 hover:text-emerald-600 bg-transparent border-none cursor-pointer"><CheckCircle size={14} /></button>
                          <button className="p-1 text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer"><XCircle size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <h2 className="text-lg font-bold text-navy-800 mb-6">{t('admin_performance')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-8">
              {[
                { label: 'Uptime', value: '99.9%' },
                { label: 'Avg Response Time', value: '142ms' },
                { label: 'Active Sessions', value: '23' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 p-5">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2">{s.label}</p>
                  <p className="text-2xl font-extrabold text-navy-800">{s.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'pnl' && (
          <>
            <h2 className="text-lg font-bold text-navy-800 mb-6">{t('admin_pnl')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-8">
              {[
                { label: 'Gross Revenue', value: `KES ${stats.monthlyRevenue.toLocaleString()}` },
                { label: 'Fivcom Share (70%)', value: `KES ${stats.operatorShare.toLocaleString()}` },
                { label: 'Platform Share (30%)', value: `KES ${stats.platformShare.toLocaleString()}` },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 p-5">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2">{s.label}</p>
                  <p className="text-2xl font-extrabold text-navy-800">{s.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <h2 className="text-lg font-bold text-navy-800 mb-6">{t('admin_settings')}</h2>
            <div className="bg-white border border-gray-200 p-6 max-w-lg">
              <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-4">Mobile Money Configuration</p>
              {['M-Pesa API Key', 'M-Pesa Secret', 'Paybill Number', 'Callback URL'].map((field) => (
                <div key={field} className="mb-4">
                  <label className="block text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-1">{field}</label>
                  <input
                    type={field.includes('Secret') || field.includes('Key') ? 'password' : 'text'}
                    placeholder={`Enter ${field.toLowerCase()}`}
                    className="w-full px-3 py-2 border border-zinc-300 text-sm font-mono text-navy-800 placeholder:text-white/50 bg-transparent focus:outline-none focus:border-zinc-600"
                  />
                </div>
              ))}
              <button className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest border-none cursor-pointer hover:bg-navy-700">
                {t('save')}
              </button>
            </div>
          </>
        )}

        {activeTab === 'applications' && (
          <>
            <h2 className="text-lg font-bold text-navy-800 mb-6">{t('admin_applications')}</h2>
            <div className="bg-white border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {['Company', 'Owner', 'Email', 'Country', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-mono uppercase tracking-wider text-white/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_APPLICATIONS.map(app => (
                    <tr key={app.id} className="border-b border-zinc-50 hover:bg-warm-50">
                      <td className="px-5 py-3 text-sm font-semibold text-navy-800">{app.company}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{app.name}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{app.email}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{app.country}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-500">{app.date}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase ${getStatusStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-emerald-400 hover:text-emerald-600 bg-transparent border-none cursor-pointer" title="Approve"><CheckCircle size={14} /></button>
                          <button className="p-1 text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer" title="Suspend"><XCircle size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
