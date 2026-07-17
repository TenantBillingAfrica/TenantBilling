import React, { useState } from 'react';
import {
  Building2, Users, Droplets, FileText, CreditCard,
  UserPlus, Plus, Search, Edit, Trash2, Eye, Send,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const MOCK_BUILDINGS = [
  { id: 'bld-001', name: 'Sunrise Apartments', address: '123 Kenyatta Ave, Nairobi', units: 24, occupancy: 20, mobileMoney: true, cardPayment: true },
  { id: 'bld-002', name: 'Garden Court', address: '45 Moi Drive, Kisumu', units: 16, occupancy: 14, mobileMoney: true, cardPayment: false },
];

const MOCK_TENANTS = [
  { id: 'tn-001', name: 'Alice Wanjiku', unit: 'A-1-03', building: 'Sunrise Apartments', rent: 25000, serviceCharge: 3000, deposit: 50000, email: 'alice@mail.com', whatsapp: '+254700111111', nationalId: '12345678', meterNo: 'WM-001', status: 'active' },
  { id: 'tn-002', name: 'John Mutua', unit: 'A-2-07', building: 'Sunrise Apartments', rent: 30000, serviceCharge: 3500, deposit: 60000, email: 'john@mail.com', whatsapp: '+254700222222', nationalId: '23456789', meterNo: 'WM-002', status: 'active' },
  { id: 'tn-003', name: 'Mary Atieno', unit: 'B-1-02', building: 'Garden Court', rent: 18000, serviceCharge: 2000, deposit: 36000, email: 'mary@mail.com', whatsapp: '+254700333333', nationalId: '34567890', meterNo: 'WM-003', status: 'active' },
  { id: 'tn-004', name: 'Peter Njoroge', unit: 'A-3-12', building: 'Sunrise Apartments', rent: 35000, serviceCharge: 4000, deposit: 70000, email: 'peter@mail.com', whatsapp: '+254700444444', nationalId: '45678901', meterNo: 'WM-004', status: 'suspended' },
];

const MOCK_STAFF = [
  { id: 'st-001', name: 'Peter Ochieng', email: 'peter@meter.com', whatsapp: '+254700555555', status: 'active' },
  { id: 'st-002', name: 'Joseph Kipchoge', email: 'joseph@meter.com', whatsapp: '+254700666666', status: 'active' },
];

const MOCK_INVOICES = [
  { id: 'inv-001', tenant: 'Alice Wanjiku', unit: 'A-1-03', amount: 29500, waterUsage: 5.2, waterCharge: 1500, status: 'paid', date: '2026-07-01', paidDate: '2026-07-03' },
  { id: 'inv-002', tenant: 'John Mutua', unit: 'A-2-07', amount: 35200, waterUsage: 8.1, waterCharge: 1700, status: 'unpaid', date: '2026-07-01', paidDate: null },
  { id: 'inv-003', tenant: 'Mary Atieno', unit: 'B-1-02', amount: 21800, waterUsage: 3.4, waterCharge: 1800, status: 'overdue', date: '2026-06-01', paidDate: null },
];

const TABS = [
  { key: 'buildings', label: 'instance_buildings', icon: Building2, gradient: 'from-emerald-400 to-teal-500' },
  { key: 'tenants', label: 'instance_tenants', icon: Users, gradient: 'from-purple-500 to-indigo-600' },
  { key: 'staff', label: 'instance_staff', icon: UserPlus, gradient: 'from-amber-400 to-orange-500' },
  { key: 'meters', label: 'instance_meters', icon: Droplets, gradient: 'from-cyan-400 to-blue-500' },
  { key: 'billing', label: 'instance_billing', icon: FileText, gradient: 'from-rose-400 to-pink-500' },
  { key: 'payments', label: 'instance_payments', icon: CreditCard, gradient: 'from-green-400 to-emerald-500' },
];

const InstanceAdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('buildings');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': case 'paid': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'suspended': case 'overdue': return 'bg-red-50 text-red-700 border border-red-200';
      case 'unpaid': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-warm-50 text-gray-500 border border-gray-200';
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-60 bg-gradient-to-b from-navy-800 to-navy-900 text-white flex-shrink-0 flex flex-col">
        <div className="px-5 py-5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Dashboard</p>
          <p className="text-sm font-bold text-white truncate">{user?.instanceName || 'Instance'}</p>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl border-none cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                    : 'bg-transparent text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? `bg-gradient-to-br ${tab.gradient}`
                    : 'bg-white/10'
                }`}>
                  <Icon size={15} className="text-white" />
                </div>
                {t(tab.label)}
              </button>
            );
          })}
        </nav>
        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sunshine-400 to-orange-500 flex items-center justify-center text-xs font-bold text-navy-900">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-white/40 truncate">{user?.email || 'admin@instance.com'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-8 bg-lavender-50">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-800 tracking-tight">{t(`instance_${activeTab}`)}</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your {activeTab} from one place</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-xl shadow-sm shadow-purple-100/20 px-4 py-2.5 border border-purple-100/40 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-300 transition-all">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search')}
                className="px-3 py-0 text-sm border-none outline-none bg-transparent text-navy-800 placeholder-gray-400 w-48"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all">
              <Plus size={16} /> {t('create')}
            </button>
          </div>
        </div>

        {/* Buildings tab */}
        {activeTab === 'buildings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_BUILDINGS.map(bld => (
              <div key={bld.id} className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-100/30 hover:shadow-xl hover:shadow-purple-100/30 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <h3 className="text-base font-bold text-navy-800">{bld.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-gray-400 hover:text-navy-800 hover:bg-lavender-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Edit size={15} /></button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-5">{bld.address}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-lavender-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-extrabold text-navy-800">{bld.units}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Units</p>
                  </div>
                  <div className="bg-lavender-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-extrabold text-navy-800">{bld.occupancy}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Occupied</p>
                  </div>
                  <div className="bg-lavender-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-extrabold text-navy-800">{Math.round((bld.occupancy / bld.units) * 100)}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Rate</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  {bld.mobileMoney && <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">M-Pesa</span>}
                  {bld.cardPayment && <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-600 border border-purple-200">Card</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tenants tab */}
        {activeTab === 'tenants' && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Unit', 'Building', 'Rent', 'Service', 'Meter', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TENANTS.map(tenant => (
                  <tr key={tenant.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-navy-800">{tenant.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tenant.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-navy-800">{tenant.unit}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{tenant.building}</td>
                    <td className="px-5 py-4 text-sm text-navy-800 font-medium">KES {tenant.rent.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">KES {tenant.serviceCharge.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">{tenant.meterNo}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-navy-800 hover:bg-lavender-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Eye size={15} /></button>
                        <button className="p-1.5 text-gray-400 hover:text-navy-800 hover:bg-lavender-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Edit size={15} /></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Staff tab */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Email', 'WhatsApp', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_STAFF.map(staff => (
                  <tr key={staff.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                          {staff.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-navy-800">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{staff.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{staff.whatsapp}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(staff.status)}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-navy-800 hover:bg-lavender-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Edit size={15} /></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Meters tab */}
        {activeTab === 'meters' && (
          <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-100/30 p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Droplets size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-800">Water Meter Readings</h3>
                <p className="text-xs text-gray-400">July 2026</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_TENANTS.filter(t => t.status === 'active').map(tenant => (
                <div key={tenant.id} className="bg-lavender-50 rounded-2xl p-5 border border-purple-100/40 hover:shadow-md hover:shadow-purple-100/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-navy-800">{tenant.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Unit {tenant.unit} &middot; Meter {tenant.meterNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Current reading"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200/60 text-sm bg-white text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                    />
                    <button className="px-5 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all">
                      {t('save')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing tab */}
        {activeTab === 'billing' && (
          <>
            <div className="flex items-center justify-end mb-6">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all">
                <Send size={16} /> Generate & Send Invoices
              </button>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Invoice', 'Tenant', 'Unit', 'Water (L)', 'Water Charge', 'Total', 'Status', 'Paid Date'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INVOICES.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                      <td className="px-5 py-4 text-xs text-gray-400">{inv.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-navy-800">{inv.tenant}</td>
                      <td className="px-5 py-4 text-sm text-navy-800 font-medium">{inv.unit}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{inv.waterUsage}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">KES {inv.waterCharge.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-navy-800">KES {inv.amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">{inv.paidDate || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Payments tab */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Collected This Month', value: 'KES 29,500', gradient: 'from-emerald-400 to-teal-500', icon: CreditCard },
              { label: 'Outstanding', value: 'KES 57,000', gradient: 'from-amber-400 to-orange-500', icon: FileText },
              { label: 'Collection Rate', value: '34%', gradient: 'from-purple-500 to-indigo-600', icon: Building2 },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-100/30 hover:shadow-xl hover:shadow-purple-100/30 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-500">{s.label}</p>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                      <Icon size={18} className="text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-navy-800">{s.value}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstanceAdminDashboard;
