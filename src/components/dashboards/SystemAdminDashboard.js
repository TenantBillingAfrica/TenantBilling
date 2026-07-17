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

const STAT_GRADIENTS = [
  'from-purple-500 to-indigo-600',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
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
      {/* Sidebar - navy/purple gradient with rounded right edge */}
      <div
        className="w-60 flex-shrink-0 flex flex-col rounded-r-3xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a0a3e 0%, #2d1b69 100%)' }}
      >
        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">System Admin</p>
          <p className="text-sm font-bold text-white mt-1">TenantBilling</p>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl border-none cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-transparent text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                {t(tab.label)}
              </button>
            );
          })}
        </nav>
        {/* Sidebar footer accent */}
        <div className="px-5 py-5">
          <div className="h-1 w-12 rounded-full bg-sunshine-400/40" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8 bg-lavender-50">
        {activeTab === 'overview' && (
          <>
            <h2 className="text-2xl font-extrabold text-navy-800 mb-8 tracking-tight">{t('admin_dashboard')}</h2>

            {/* Stat cards with gradient icon backgrounds */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Active Instances', value: stats.totalInstances, icon: Building2 },
                { label: 'Total Tenants', value: stats.totalTenants.toLocaleString(), icon: Users },
                { label: 'Pending Applications', value: stats.pendingApps, icon: Clock },
                { label: 'Monthly Revenue', value: `KES ${(stats.monthlyRevenue / 1000).toFixed(0)}K`, icon: DollarSign },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-50 hover:shadow-lg hover:shadow-purple-100/30 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</p>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[i]} flex items-center justify-center`}>
                        <Icon size={18} className="text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold text-navy-800">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Revenue split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <DollarSign size={14} className="text-white" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Platform Share (30%)</p>
                </div>
                <p className="text-3xl font-extrabold text-navy-800">KES {stats.platformShare.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <DollarSign size={14} className="text-white" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Operator Share (70%)</p>
                </div>
                <p className="text-3xl font-extrabold text-navy-800">KES {stats.operatorShare.toLocaleString()}</p>
              </div>
            </div>

            {/* Recent applications table */}
            <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-50 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-sm font-bold text-navy-800">Recent Applications</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Company', 'Owner', 'Country', 'Status', 'Tenants', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_APPLICATIONS.map(app => (
                    <tr key={app.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-navy-800">{app.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.country}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-500">{app.tenants}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-navy-800 hover:bg-lavender-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="View">
                            <Eye size={15} />
                          </button>
                          <button className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Approve">
                            <CheckCircle size={15} />
                          </button>
                          <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Reject">
                            <XCircle size={15} />
                          </button>
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
            <h2 className="text-2xl font-extrabold text-navy-800 mb-8 tracking-tight">{t('admin_performance')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Uptime', value: '99.9%', gradient: 'from-emerald-400 to-teal-500', icon: CheckCircle },
                { label: 'Avg Response Time', value: '142ms', gradient: 'from-cyan-400 to-blue-500', icon: Clock },
                { label: 'Active Sessions', value: '23', gradient: 'from-purple-500 to-indigo-600', icon: Users },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-50 hover:shadow-lg hover:shadow-purple-100/30 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                        <Icon size={18} className="text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold text-navy-800">{s.value}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'pnl' && (
          <>
            <h2 className="text-2xl font-extrabold text-navy-800 mb-8 tracking-tight">{t('admin_pnl')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Gross Revenue', value: `KES ${stats.monthlyRevenue.toLocaleString()}`, gradient: 'from-amber-400 to-orange-500', icon: DollarSign },
                { label: 'Fivcom Share (70%)', value: `KES ${stats.operatorShare.toLocaleString()}`, gradient: 'from-emerald-400 to-teal-500', icon: TrendingUp },
                { label: 'Platform Share (30%)', value: `KES ${stats.platformShare.toLocaleString()}`, gradient: 'from-purple-500 to-indigo-600', icon: DollarSign },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-50 hover:shadow-lg hover:shadow-purple-100/30 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                        <Icon size={18} className="text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold text-navy-800">{s.value}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <h2 className="text-2xl font-extrabold text-navy-800 mb-8 tracking-tight">{t('admin_settings')}</h2>
            <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-50 p-8 max-w-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Settings size={18} className="text-white" />
                </div>
                <p className="text-sm font-bold text-navy-800">Mobile Money Configuration</p>
              </div>
              {['M-Pesa API Key', 'M-Pesa Secret', 'Paybill Number', 'Callback URL'].map((field) => (
                <div key={field} className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{field}</label>
                  <input
                    type={field.includes('Secret') || field.includes('Key') ? 'password' : 'text'}
                    placeholder={`Enter ${field.toLowerCase()}`}
                    className="w-full px-4 py-3 border border-gray-200 text-sm text-navy-800 placeholder:text-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all"
                  />
                </div>
              ))}
              <button className="px-8 py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all">
                {t('save')}
              </button>
            </div>
          </>
        )}

        {activeTab === 'applications' && (
          <>
            <h2 className="text-2xl font-extrabold text-navy-800 mb-8 tracking-tight">{t('admin_applications')}</h2>
            <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Company', 'Owner', 'Email', 'Country', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_APPLICATIONS.map(app => (
                    <tr key={app.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-navy-800">{app.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.country}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{app.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Approve">
                            <CheckCircle size={15} />
                          </button>
                          <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Suspend">
                            <XCircle size={15} />
                          </button>
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
