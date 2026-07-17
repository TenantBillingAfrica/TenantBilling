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
  { key: 'buildings', label: 'instance_buildings', icon: Building2 },
  { key: 'tenants', label: 'instance_tenants', icon: Users },
  { key: 'staff', label: 'instance_staff', icon: UserPlus },
  { key: 'meters', label: 'instance_meters', icon: Droplets },
  { key: 'billing', label: 'instance_billing', icon: FileText },
  { key: 'payments', label: 'instance_payments', icon: CreditCard },
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
      <div className="w-56 bg-navy-800 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-4 border-b border-navy-700">
          <p className="text-xs font-mono uppercase tracking-widest text-white/50">{user?.instanceName || 'Instance'}</p>
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

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6 bg-warm-50">
        {/* Search bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-navy-800">{t(`instance_${activeTab}`)}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 bg-white px-3">
              <Search size={14} className="text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search')}
                className="px-2 py-2 text-sm font-mono border-none outline-none bg-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white text-xs font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-navy-700">
              <Plus size={14} /> {t('create')}
            </button>
          </div>
        </div>

        {/* Buildings tab */}
        {activeTab === 'buildings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {MOCK_BUILDINGS.map(bld => (
              <div key={bld.id} className="bg-white border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy-800">{bld.name}</h3>
                  <div className="flex items-center gap-1">
                    <button className="p-1 text-white/50 hover:text-navy-800 bg-transparent border-none cursor-pointer"><Edit size={14} /></button>
                    <button className="p-1 text-white/50 hover:text-red-600 bg-transparent border-none cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-4">{bld.address}</p>
                <div className="grid grid-cols-3 gap-0">
                  <div className="border border-gray-100 p-2 text-center">
                    <p className="text-lg font-extrabold text-navy-800">{bld.units}</p>
                    <p className="text-xs font-mono text-white/50">Units</p>
                  </div>
                  <div className="border border-gray-100 p-2 text-center">
                    <p className="text-lg font-extrabold text-navy-800">{bld.occupancy}</p>
                    <p className="text-xs font-mono text-white/50">Occupied</p>
                  </div>
                  <div className="border border-gray-100 p-2 text-center">
                    <p className="text-lg font-extrabold text-navy-800">{Math.round((bld.occupancy / bld.units) * 100)}%</p>
                    <p className="text-xs font-mono text-white/50">Rate</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {bld.mobileMoney && <span className="px-2 py-0.5 text-xs font-mono border border-gray-200 text-gray-500">M-Pesa</span>}
                  {bld.cardPayment && <span className="px-2 py-0.5 text-xs font-mono border border-gray-200 text-gray-500">Card</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tenants tab */}
        {activeTab === 'tenants' && (
          <div className="bg-white border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Unit', 'Building', 'Rent', 'Service', 'Meter', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-white/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TENANTS.map(tenant => (
                  <tr key={tenant.id} className="border-b border-zinc-50 hover:bg-warm-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy-800">{tenant.name}</p>
                      <p className="text-xs font-mono text-white/50">{tenant.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-navy-800 font-semibold">{tenant.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tenant.building}</td>
                    <td className="px-4 py-3 text-sm font-mono text-navy-800">KES {tenant.rent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">KES {tenant.serviceCharge.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{tenant.meterNo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-mono uppercase ${getStatusStyle(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-white/50 hover:text-navy-800 bg-transparent border-none cursor-pointer"><Eye size={14} /></button>
                        <button className="p-1 text-white/50 hover:text-navy-800 bg-transparent border-none cursor-pointer"><Edit size={14} /></button>
                        <button className="p-1 text-white/50 hover:text-red-600 bg-transparent border-none cursor-pointer"><Trash2 size={14} /></button>
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
          <div className="bg-white border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Email', 'WhatsApp', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-mono uppercase tracking-wider text-white/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_STAFF.map(staff => (
                  <tr key={staff.id} className="border-b border-zinc-50 hover:bg-warm-50">
                    <td className="px-5 py-3 text-sm font-semibold text-navy-800">{staff.name}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-500">{staff.email}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-500">{staff.whatsapp}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-xs font-mono uppercase ${getStatusStyle(staff.status)}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-white/50 hover:text-navy-800 bg-transparent border-none cursor-pointer"><Edit size={14} /></button>
                        <button className="p-1 text-white/50 hover:text-red-600 bg-transparent border-none cursor-pointer"><Trash2 size={14} /></button>
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
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-4">Water Meter Readings — July 2026</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_TENANTS.filter(t => t.status === 'active').map(tenant => (
                <div key={tenant.id} className="border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-navy-800">{tenant.name}</p>
                      <p className="text-xs font-mono text-white/50">Unit {tenant.unit} — Meter {tenant.meterNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Current reading"
                      className="flex-1 px-3 py-2 border border-gray-300 text-sm font-mono bg-transparent focus:outline-none focus:border-zinc-600"
                    />
                    <button className="px-4 py-2 bg-navy-800 text-white text-xs font-bold uppercase border-none cursor-pointer hover:bg-navy-700">
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
            <div className="flex items-center justify-between mb-4">
              <div />
              <button className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white text-xs font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-navy-700">
                <Send size={14} /> Generate & Send Invoices
              </button>
            </div>
            <div className="bg-white border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Invoice', 'Tenant', 'Unit', 'Water (L)', 'Water Charge', 'Total', 'Status', 'Paid Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-white/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INVOICES.map(inv => (
                    <tr key={inv.id} className="border-b border-zinc-50 hover:bg-warm-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{inv.id}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-navy-800">{inv.tenant}</td>
                      <td className="px-4 py-3 text-sm font-mono text-navy-800">{inv.unit}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{inv.waterUsage}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">KES {inv.waterCharge.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-navy-800">KES {inv.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase ${getStatusStyle(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{inv.paidDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Payments tab */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-8">
            {[
              { label: 'Collected This Month', value: 'KES 29,500' },
              { label: 'Outstanding', value: 'KES 57,000' },
              { label: 'Collection Rate', value: '34%' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-200 p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2">{s.label}</p>
                <p className="text-2xl font-extrabold text-navy-800">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstanceAdminDashboard;
