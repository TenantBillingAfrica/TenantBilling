import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, LogOut, CheckCircle, Search, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listTenants } from '../../services/tenants.service';
import { listBuildings } from '../../services/buildings.service';
import { listMeterReadings, createMeterReading } from '../../services/meter-readings.service';

const MeterReaderDashboard = () => {
  const { user, logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [meterReadings, setMeterReadings] = useState([]);
  const [readingInputs, setReadingInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes, mRes] = await Promise.all([
        listTenants(),
        listBuildings(),
        listMeterReadings(),
      ]);
      setTenants(tRes.data);
      setBuildings(bRes.data);
      setMeterReadings(mRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const buildingMap = {};
  for (const b of buildings) {
    buildingMap[b.id] = b.name;
  }

  // Current period
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Set of tenants who already have readings this month
  const readThisMonth = new Set();
  for (const r of meterReadings) {
    if (r.createdAt?.startsWith(currentPeriod)) {
      readThisMonth.add(r.tenantId);
    }
  }

  // Only active tenants with meters
  const metered = tenants.filter(t => t.status === 'active' && t.meterNumber);

  // Filter by search
  const filtered = metered.filter(t =>
    !searchQuery ||
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.meterNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buildingMap[t.buildingId]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: unread first, then by building + unit
  const sorted = [...filtered].sort((a, b) => {
    const aRead = readThisMonth.has(a.id) ? 1 : 0;
    const bRead = readThisMonth.has(b.id) ? 1 : 0;
    if (aRead !== bRead) return aRead - bRead;
    const aBldg = buildingMap[a.buildingId] || '';
    const bBldg = buildingMap[b.buildingId] || '';
    if (aBldg !== bBldg) return aBldg.localeCompare(bBldg);
    return (a.unitNumber || '').localeCompare(b.unitNumber || '');
  });

  const handleSaveReading = async (tenant) => {
    const reading = readingInputs[tenant.id];
    if (!reading && reading !== 0) return;
    setSavingId(tenant.id);
    try {
      await createMeterReading({ tenantId: tenant.id, meterNumber: tenant.meterNumber, reading: Number(reading) });
      setReadingInputs(prev => ({ ...prev, [tenant.id]: '' }));
      const mRes = await listMeterReadings();
      setMeterReadings(mRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save reading');
    } finally {
      setSavingId(null);
    }
  };

  // Get last reading for a tenant
  const getLastReading = (tenantId) => {
    const readings = meterReadings
      .filter(r => r.tenantId === tenantId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return readings[0];
  };

  const totalMeters = metered.length;
  const readCount = metered.filter(t => readThisMonth.has(t.id)).length;
  const unreadCount = totalMeters - readCount;

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Droplets size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Meter Readings</h1>
              <p className="text-xs text-white/60">{user?.instanceName || 'TenantBilling'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name || 'Staff'}</p>
              <p className="text-xs text-white/50">Meter Reader</p>
            </div>
            <button
              onClick={logout}
              className="p-2.5 bg-white/10 rounded-xl border-none cursor-pointer hover:bg-white/20 transition-colors"
              title="Log out"
            >
              <LogOut size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30 text-center">
            <p className="text-3xl font-extrabold text-navy-800">{totalMeters}</p>
            <p className="text-xs text-gray-500 mt-1">Total Meters</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200/50 text-center">
            <p className="text-3xl font-extrabold text-emerald-600">{readCount}</p>
            <p className="text-xs text-gray-500 mt-1">Read This Month</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200/50 text-center">
            <p className="text-3xl font-extrabold text-amber-600">{unreadCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
        </div>

        {/* Period label */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-navy-800">
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center bg-white rounded-xl shadow-sm px-4 py-2 border border-purple-100/40 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenant, unit, meter..."
              className="px-3 py-0 text-sm border-none outline-none bg-transparent text-navy-800 placeholder-gray-400 w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader size={32} className="text-purple-400 animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm text-gray-400 shadow-sm border border-purple-100/30">
            No tenants with water meters found.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(tenant => {
              const isRead = readThisMonth.has(tenant.id);
              const lastReading = getLastReading(tenant.id);
              return (
                <div
                  key={tenant.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                    isRead ? 'border-emerald-200/50 opacity-75' : 'border-purple-100/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-navy-800 truncate">{tenant.name}</p>
                        {isRead && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                            <CheckCircle size={12} /> Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {buildingMap[tenant.buildingId] || '--'} &middot; Unit {tenant.unitNumber || '--'} &middot; Meter {tenant.meterNumber}
                      </p>
                      {lastReading && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last reading: {lastReading.reading} ({lastReading.createdAt?.slice(0, 10)})
                        </p>
                      )}
                    </div>
                    {!isRead && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          placeholder="Reading"
                          value={readingInputs[tenant.id] || ''}
                          onChange={(e) => setReadingInputs(prev => ({ ...prev, [tenant.id]: e.target.value }))}
                          className="w-28 px-3 py-2.5 rounded-xl border border-purple-200/60 text-sm bg-gray-50 text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                        />
                        <button
                          onClick={() => handleSaveReading(tenant)}
                          disabled={savingId === tenant.id || !readingInputs[tenant.id]}
                          className="px-5 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all disabled:opacity-50"
                        >
                          {savingId === tenant.id ? '...' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterReaderDashboard;
