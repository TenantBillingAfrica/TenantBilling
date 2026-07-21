import React, { useState, useEffect, useCallback } from 'react';
import { FileText, LogOut, Calendar, User, Building2, CreditCard, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TenantStatementDashboard = () => {
  const { user, logout } = useAuth();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStatement = useCallback(async (start, end) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      const query = params.toString();
      const res = await api.get(`/tenant-portal/my-statement${query ? `?${query}` : ''}`);
      setStatement(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load statement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load statement on mount (full tenancy period)
  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchStatement(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchStatement();
  };

  // Compute running balance
  const statementWithBalance = statement?.statement
    ? [...statement.statement]
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
        .reduce((acc, inv) => {
          const prevBalance = acc.length > 0 ? acc[acc.length - 1].runningBalance : 0;
          const paid = inv.status === 'paid' ? inv.totalAmount : 0;
          const runningBalance = prevBalance + inv.totalAmount - paid;
          acc.push({ ...inv, runningBalance });
          return acc;
        }, [])
    : [];

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header bar */}
      <div className="bg-white border-b border-purple-100/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png"
              alt="Tenant Billing"
              className="h-8"
            />
            <div>
              <h1 className="text-lg font-extrabold text-navy-800 leading-tight">My Statement</h1>
              <p className="text-xs text-gray-400">{user?.name || user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-navy-800 bg-transparent border border-gray-200 rounded-xl cursor-pointer hover:border-purple-300 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && !statement && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading your statement...</p>
            </div>
          </div>
        )}

        {statement && (
          <>
            {/* Tenant info card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-100/30 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-start gap-2.5">
                  <User size={16} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Tenant</p>
                    <p className="text-sm font-bold text-navy-800 mt-0.5">{statement.tenant.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2 size={16} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Unit</p>
                    <p className="text-sm font-bold text-navy-800 mt-0.5">
                      {statement.tenant.unitNumber || '-'}
                      {statement.tenant.buildingName ? `, ${statement.tenant.buildingName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar size={16} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Move-in</p>
                    <p className="text-sm font-bold text-navy-800 mt-0.5">{statement.tenant.moveInDate?.slice(0, 10) || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Status</p>
                  <span className={`inline-block mt-1 px-3 py-0.5 text-xs font-semibold rounded-full capitalize ${
                    statement.tenant.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {statement.tenant.vacatedAt ? 'Vacated' : statement.tenant.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-purple-400" />
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total Billed</p>
                </div>
                <p className="text-2xl font-extrabold text-navy-800">KES {(statement.summary.totalBilled || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total Paid</p>
                </div>
                <p className="text-2xl font-extrabold text-emerald-600">KES {(statement.summary.totalPaid || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className={statement.summary.balance > 0 ? 'text-red-400' : 'text-emerald-400'} />
                  <p className="text-xs text-gray-400 uppercase font-semibold">Outstanding Balance</p>
                </div>
                <p className={`text-2xl font-extrabold ${statement.summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  KES {(statement.summary.balance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Date filter */}
            <div className="bg-white rounded-2xl p-5 shadow-sm shadow-purple-100/20 border border-purple-100/30 mb-6">
              <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Loading...' : 'Filter'}
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="px-4 py-2.5 text-sm text-gray-500 bg-transparent border border-gray-200 rounded-full cursor-pointer hover:border-purple-300 transition-all"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {/* Statement table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-navy-800">
                  Statement History ({statement.summary.invoiceCount} invoice{statement.summary.invoiceCount !== 1 ? 's' : ''})
                </p>
              </div>
              {statementWithBalance.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">No invoices found for this period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Period', 'Rent', 'Service', 'Water', 'Total', 'Status', 'Paid Date', 'Receipt #', 'Balance'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {statementWithBalance.map((inv, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-lavender-50/50">
                          <td className="px-4 py-3 text-sm font-semibold text-navy-800 whitespace-nowrap">{inv.period}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">KES {(inv.rent || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">KES {(inv.serviceCharge || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {inv.waterUsage || 0}L (KES {(inv.waterCharge || 0).toLocaleString()})
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-navy-800 whitespace-nowrap">KES {(inv.totalAmount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{inv.paidAt?.slice(0, 10) || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap font-mono">
                            {inv.payment?.transactionId || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm font-bold whitespace-nowrap ${inv.runningBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            KES {(inv.runningBalance || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TenantStatementDashboard;
