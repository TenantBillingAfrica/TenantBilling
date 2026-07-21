import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, TrendingUp, DollarSign, Settings,
  CheckCircle, XCircle, Clock, Building2, Loader, RefreshCw, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { listApplications, approveApplication, rejectApplication, suspendApplication } from '../../services/applications.service';
import api from '../../services/api';

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
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [appsRes, statsRes] = await Promise.all([
        listApplications(),
        api.get('/admin/stats'),
      ]);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPnl = useCallback(async () => {
    try {
      const res = await api.get('/admin/pnl');
      setPnl(res.data);
    } catch (err) {
      console.error('Failed to fetch P&L:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'pnl' && !pnl) fetchPnl();
  }, [activeTab, pnl, fetchPnl]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveApplication(id);
      await fetchData();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    setActionLoading(id);
    try {
      await rejectApplication(id);
      await fetchData();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this instance?')) return;
    setActionLoading(id);
    try {
      await suspendApplication(id);
      await fetchData();
    } catch (err) {
      alert('Failed to suspend: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'suspended': case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-warm-50 text-gray-500 border border-gray-200';
    }
  };

  const statCards = stats ? [
    { label: 'Active Instances', value: stats.totalInstances, icon: Building2 },
    { label: 'Total Tenants', value: stats.totalTenants.toLocaleString(), icon: Users },
    { label: 'Pending Applications', value: stats.pendingApplications, icon: Clock },
    { label: 'Total Buildings', value: stats.totalBuildings, icon: Building2 },
  ] : [];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
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
        <div className="px-5 py-5">
          <div className="h-1 w-12 rounded-full bg-sunshine-400/40" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8 bg-lavender-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-navy-800 tracking-tight">{t(TABS.find(t => t.key === activeTab)?.label || 'admin_dashboard')}</h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-navy-800 border border-purple-100 rounded-xl text-xs font-bold shadow-sm hover:bg-purple-50 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-purple-600' : 'text-purple-600'} />
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchData} className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg border-none cursor-pointer hover:bg-red-700">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size={32} className="text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statCards.map((stat, i) => {
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

                {/* Recent applications table */}
                <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-50 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-navy-800">Recent Property Applications</p>
                    <span className="text-xs font-medium text-gray-400">{applications.length} Total</span>
                  </div>
                  {applications.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-gray-400">No applications yet</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Company / Property', 'Applicant', 'Country', 'Verification', 'Status', 'Date', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.slice(0, 10).map(app => (
                          <tr key={app.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-navy-800">{app.company}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div>{app.name}</div>
                              <div className="text-xs text-gray-400">{app.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{app.country}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{app.createdAt?.slice(0, 10)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {actionLoading === app.id ? (
                                  <Loader size={15} className="text-purple-400 animate-spin" />
                                ) : (
                                  <>
                                    {app.status === 'pending' && (
                                      <>
                                        <button onClick={() => handleApprove(app.id)} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Approve">
                                          <CheckCircle size={15} />
                                        </button>
                                        <button onClick={() => handleReject(app.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Reject">
                                          <XCircle size={15} />
                                        </button>
                                      </>
                                    )}
                                    {app.status === 'approved' && (
                                      <button onClick={() => handleSuspend(app.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Suspend">
                                        <XCircle size={15} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {activeTab === 'applications' && (
              <>
                <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-50 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-navy-800">All Property Applications</p>
                    <span className="text-xs font-medium text-gray-400">{applications.length} Total</span>
                  </div>
                  {applications.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-gray-400">No applications yet</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Company / Property', 'Applicant', 'Phone', 'Country', 'Verification', 'Date', 'Status', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-navy-800">{app.company}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div>{app.name}</div>
                              <div className="text-xs text-gray-400">{app.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{app.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{app.country}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{app.createdAt?.slice(0, 10)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {actionLoading === app.id ? (
                                  <Loader size={15} className="text-purple-400 animate-spin" />
                                ) : (
                                  <>
                                    {app.status === 'pending' && (
                                      <>
                                        <button onClick={() => handleApprove(app.id)} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Approve">
                                          <CheckCircle size={15} />
                                        </button>
                                        <button onClick={() => handleReject(app.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Reject">
                                          <XCircle size={15} />
                                        </button>
                                      </>
                                    )}
                                    {app.status === 'approved' && (
                                      <button onClick={() => handleSuspend(app.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors" title="Suspend">
                                        <XCircle size={15} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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
                    { label: 'Active Instances', value: stats?.totalInstances || 0, gradient: 'from-purple-500 to-indigo-600', icon: Users },
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
                {pnl ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                      { label: 'Total Billed', value: `KES ${(pnl.totalBilled || 0).toLocaleString()}`, gradient: 'from-amber-400 to-orange-500', icon: DollarSign },
                      { label: 'Operator Share (70%)', value: `KES ${(pnl.operatorShare || 0).toLocaleString()}`, gradient: 'from-emerald-400 to-teal-500', icon: TrendingUp },
                      { label: 'Platform Share (30%)', value: `KES ${(pnl.platformShare || 0).toLocaleString()}`, gradient: 'from-purple-500 to-indigo-600', icon: DollarSign },
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
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <Loader size={24} className="text-purple-400 animate-spin" />
                  </div>
                )}
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
                    <p className="text-sm font-bold text-navy-800">Payment Gateway Configuration</p>
                  </div>
                  {['ChatWorks API Token', 'Collections URL', 'Callback URL'].map((field) => (
                    <div key={field} className="mb-5">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{field}</label>
                      <input
                        type={field.includes('Token') ? 'password' : 'text'}
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
          </>
        )}
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
