import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, Droplets, FileText, CreditCard,
  UserPlus, Plus, Search, Edit, Trash2, Send, X, Loader, Bell, MessageSquare,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { listBuildings, createBuilding, deleteBuilding } from '../../services/buildings.service';
import { listTenants, createTenant, updateTenant, deleteTenant } from '../../services/tenants.service';
import { listStaff, createStaff, deleteStaff } from '../../services/staff.service';
import { listInvoices, generateInvoices } from '../../services/invoices.service';
import { listPayments, initiatePayment } from '../../services/payments.service';
import { listMeterReadings, createMeterReading } from '../../services/meter-readings.service';
import { sendInvoiceNotifications, sendPaymentReminders, sendMeterReadingReminders } from '../../services/notifications.service';

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

  // Data state
  const [buildings, setBuildings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [staff, setStaff] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [, setMeterReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  // Meter reading inputs
  const [readingInputs, setReadingInputs] = useState({});

  // Expanded tenant row for details
  const [expandedTenant, setExpandedTenant] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, sRes, iRes, pRes, mRes] = await Promise.all([
        listBuildings(),
        listTenants(),
        listStaff(),
        listInvoices(),
        listPayments(),
        listMeterReadings(),
      ]);
      setBuildings(bRes.data);
      setTenants(tRes.data);
      setStaff(sRes.data);
      setInvoices(iRes.data);
      setPayments(pRes.data);
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

  const openModal = (type, data = {}) => {
    setModal(type);
    setModalData(data);
  };

  const closeModal = () => {
    setModal(null);
    setModalData({});
  };

  const handleCreateBuilding = async () => {
    setActionLoading(true);
    try {
      await createBuilding(modalData);
      closeModal();
      const res = await listBuildings();
      setBuildings(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create building');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBuilding = async (id) => {
    if (!window.confirm('Delete this building?')) return;
    try {
      await deleteBuilding(id);
      const res = await listBuildings();
      setBuildings(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete building');
    }
  };

  const handleCreateTenant = async () => {
    setActionLoading(true);
    try {
      await createTenant(modalData);
      closeModal();
      const res = await listTenants();
      setTenants(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create tenant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTenant = async () => {
    setActionLoading(true);
    try {
      const { _id, ...updateData } = modalData;
      await updateTenant(_id, updateData);
      closeModal();
      const res = await listTenants();
      setTenants(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update tenant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Delete this tenant?')) return;
    try {
      await deleteTenant(id);
      const res = await listTenants();
      setTenants(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete tenant');
    }
  };

  const handleVacateTenant = async (id) => {
    if (!window.confirm('Mark this tenant as vacated? They will no longer receive bills or reminders.')) return;
    try {
      await updateTenant(id, { status: 'vacated' });
      const res = await listTenants();
      setTenants(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update tenant status');
    }
  };

  const handleCreateStaff = async () => {
    setActionLoading(true);
    try {
      await createStaff(modalData);
      closeModal();
      const res = await listStaff();
      setStaff(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create staff');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await deleteStaff(id);
      const res = await listStaff();
      setStaff(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete staff');
    }
  };

  const handleGenerateInvoices = async () => {
    const now = new Date();
    setActionLoading(true);
    try {
      await generateInvoices({ month: now.getMonth() + 1, year: now.getFullYear(), waterRate: 50 });
      const res = await listInvoices();
      setInvoices(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate invoices');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMeterReading = async (tenant) => {
    const reading = readingInputs[tenant.id];
    if (!reading) return;
    try {
      await createMeterReading({ tenantId: tenant.id, meterNumber: tenant.meterNumber, reading });
      setReadingInputs(prev => ({ ...prev, [tenant.id]: '' }));
      const res = await listMeterReadings();
      setMeterReadings(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save reading');
    }
  };

  const handleCollectPayment = async (invoice) => {
    const phone = prompt('Enter tenant phone number for mobile money collection:');
    if (!phone) return;
    try {
      await initiatePayment({ invoiceId: invoice.id, phone, amount: invoice.totalAmount, currency: 'KES' });
      alert('Payment collection initiated. The tenant will receive a prompt on their phone.');
      const res = await listPayments();
      setPayments(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to initiate payment');
    }
  };

  const handleSendInvoiceNotifications = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await sendInvoiceNotifications({ period });
      alert(`Invoice notifications: ${res.data.sent} sent, ${res.data.failed} failed`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send invoice notifications');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPaymentReminders = async () => {
    setActionLoading(true);
    try {
      const res = await sendPaymentReminders({ daysOverdue: 7 });
      alert(`Payment reminders: ${res.data.sent} sent to overdue tenants (${res.data.totalOverdue} overdue)`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send payment reminders');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMeterReminders = async () => {
    setActionLoading(true);
    try {
      const res = await sendMeterReadingReminders();
      alert(`Meter reading reminders: ${res.data.sent} staff notified (${res.data.unreadMeters || 0} unread meters)`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send meter reading reminders');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': case 'paid': case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'suspended': case 'overdue': case 'failed': return 'bg-red-50 text-red-700 border border-red-200';
      case 'unpaid': case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'vacated': return 'bg-gray-100 text-gray-500 border border-gray-300';
      default: return 'bg-warm-50 text-gray-500 border border-gray-200';
    }
  };

  // Payment status helper: check if tenant has unpaid invoices
  const getTenantPaymentStatus = (tenantId) => {
    const tenantInvoices = invoices.filter(i => i.tenantId === tenantId);
    if (tenantInvoices.length === 0) return null;
    const hasUnpaid = tenantInvoices.some(i => i.status === 'unpaid');
    return hasUnpaid ? 'overdue' : 'current';
  };

  const filteredTenants = tenants.filter(t =>
    !searchQuery || t.name?.toLowerCase().includes(searchQuery.toLowerCase())
      || t.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      || t.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Payment stats
  const collected = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalBilled = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const outstanding = totalBilled - collected;
  const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;

  // Tenant field definitions for create/edit modals
  const tenantFields = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email' },
    { key: 'phone', label: 'WhatsApp Phone', type: 'tel' },
    { key: 'idNumber', label: 'ID Number', type: 'text' },
    { key: 'kraPin', label: 'KRA PIN', type: 'text' },
    { key: 'postalAddress', label: 'Postal Address', type: 'text' },
    { key: 'buildingId', label: 'Building', type: 'select', options: buildings.map(b => ({ value: b.id, label: b.name })), required: true },
    { key: 'unitNumber', label: 'Unit Number', type: 'text' },
    { key: 'rent', label: 'Monthly Rent (KES)', type: 'number' },
    { key: 'serviceCharge', label: 'Service Charge (KES)', type: 'number' },
    { key: 'meterNumber', label: 'Water Meter Number', type: 'text' },
  ];

  const tenantEditFields = [
    ...tenantFields,
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'vacated', label: 'Vacated' },
      { value: 'suspended', label: 'Suspended' },
    ]},
    { key: 'vacationNotice', label: 'Vacation Notice', type: 'textarea' },
    { key: 'leaseEndDate', label: 'Lease End Date', type: 'date' },
  ];

  // Modal component
  const renderModal = () => {
    if (!modal) return null;

    const fields = {
      createBuilding: [
        { key: 'name', label: 'Building Name', type: 'text', required: true },
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'units', label: 'Number of Units', type: 'number' },
      ],
      createTenant: tenantFields,
      editTenant: tenantEditFields,
      createStaff: [
        { key: 'name', label: 'Full Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'role', label: 'Role', type: 'select', options: [{ value: 'meter_reader', label: 'Meter Reader' }] },
      ],
    };

    const handlers = {
      createBuilding: handleCreateBuilding,
      createTenant: handleCreateTenant,
      editTenant: handleEditTenant,
      createStaff: handleCreateStaff,
    };

    const titles = {
      createBuilding: 'New Building',
      createTenant: 'New Tenant',
      editTenant: 'Edit Tenant',
      createStaff: 'New Staff Member',
    };

    const modalFields = fields[modal];
    const onSubmit = handlers[modal];
    if (!modalFields || !onSubmit) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h3 className="text-lg font-bold text-navy-800">
              {titles[modal] || modal}
            </h3>
            <button onClick={closeModal} className="p-2 text-gray-400 hover:text-navy-800 bg-transparent border-none cursor-pointer rounded-lg">
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 pr-1">
            {modalFields.map(f => (
              <div key={f.key} className="mb-4">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={modalData[f.key] || ''}
                    onChange={(e) => setModalData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={modalData[f.key] || ''}
                    onChange={(e) => setModalData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
                  />
                ) : (
                  <input
                    type={f.type}
                    required={f.required}
                    value={modalData[f.key] || ''}
                    onChange={(e) => setModalData(prev => ({
                      ...prev,
                      [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6 flex-shrink-0">
            <button onClick={closeModal} className="flex-1 py-3 text-sm font-semibold text-gray-500 bg-gray-100 rounded-full border-none cursor-pointer hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={onSubmit} disabled={actionLoading} className="flex-1 py-3 text-sm font-bold text-navy-800 bg-sunshine-400 rounded-full border-none cursor-pointer hover:bg-sunshine-500 disabled:opacity-50 transition-all">
              {actionLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getCreateAction = () => {
    switch (activeTab) {
      case 'buildings': return () => openModal('createBuilding');
      case 'tenants': return () => openModal('createTenant');
      case 'staff': return () => openModal('createStaff');
      default: return null;
    }
  };

  const createAction = getCreateAction();

  return (
    <div className="flex h-full">
      {renderModal()}

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
                  isActive ? `bg-gradient-to-br ${tab.gradient}` : 'bg-white/10'
                }`}>
                  <Icon size={15} className="text-white" />
                </div>
                {t(tab.label)}
              </button>
            );
          })}
        </nav>
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
            {createAction && (
              <button onClick={createAction} className="flex items-center gap-2 px-6 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all">
                <Plus size={16} /> {t('create')}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size={32} className="text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Buildings tab */}
            {activeTab === 'buildings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {buildings.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-sm text-gray-400">No buildings yet. Click Create to add one.</div>
                ) : buildings.map(bld => (
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
                        <button onClick={() => handleDeleteBuilding(bld.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-5">{bld.address || 'No address set'}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-lavender-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-extrabold text-navy-800">{bld.units || 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Units</p>
                      </div>
                      <div className="bg-lavender-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-extrabold text-navy-800">
                          {tenants.filter(t => t.buildingId === bld.id).length}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Tenants</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tenants tab */}
            {activeTab === 'tenants' && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
                {filteredTenants.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-gray-400">No tenants yet. Click Create to add one.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Name', 'Unit', 'Rent', 'Service', 'Meter', 'Payments', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(tenant => {
                        const payStatus = getTenantPaymentStatus(tenant.id);
                        const isExpanded = expandedTenant === tenant.id;
                        return (
                          <React.Fragment key={tenant.id}>
                            <tr className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors cursor-pointer" onClick={() => setExpandedTenant(isExpanded ? null : tenant.id)}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                  <div>
                                    <p className="text-sm font-semibold text-navy-800">{tenant.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{tenant.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-navy-800">{tenant.unitNumber}</td>
                              <td className="px-4 py-4 text-sm text-navy-800 font-medium">KES {(tenant.rent || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">KES {(tenant.serviceCharge || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 text-xs text-gray-400">{tenant.meterNumber}</td>
                              <td className="px-4 py-4">
                                {payStatus === 'current' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle size={12} /> Current
                                  </span>
                                )}
                                {payStatus === 'overdue' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                                    <AlertCircle size={12} /> Overdue
                                  </span>
                                )}
                                {!payStatus && (
                                  <span className="text-xs text-gray-300">--</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(tenant.status)}`}>
                                  {tenant.status}
                                </span>
                              </td>
                              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1">
                                  {tenant.status === 'active' && (
                                    <button onClick={() => handleVacateTenant(tenant.id)} className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full cursor-pointer hover:bg-amber-100 transition-colors" title="Mark as Vacated">Vacate</button>
                                  )}
                                  <button onClick={() => openModal('editTenant', {
                                    _id: tenant.id,
                                    name: tenant.name,
                                    email: tenant.email,
                                    phone: tenant.phone,
                                    idNumber: tenant.idNumber || '',
                                    kraPin: tenant.kraPin || '',
                                    postalAddress: tenant.postalAddress || '',
                                    buildingId: tenant.buildingId,
                                    unitNumber: tenant.unitNumber,
                                    rent: tenant.rent,
                                    serviceCharge: tenant.serviceCharge,
                                    meterNumber: tenant.meterNumber,
                                    status: tenant.status,
                                    vacationNotice: tenant.vacationNotice || '',
                                    leaseEndDate: tenant.leaseEndDate || '',
                                  })} className="p-1.5 text-gray-400 hover:text-navy-800 hover:bg-lavender-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Edit size={15} /></button>
                                  <button onClick={() => handleDeleteTenant(tenant.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Trash2 size={15} /></button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-lavender-50/70">
                                <td colSpan={8} className="px-6 py-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Phone</p>
                                      <p className="text-navy-800">{tenant.phone || '--'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">ID Number</p>
                                      <p className="text-navy-800">{tenant.idNumber || '--'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">KRA PIN</p>
                                      <p className="text-navy-800">{tenant.kraPin || '--'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Postal Address</p>
                                      <p className="text-navy-800">{tenant.postalAddress || '--'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Building</p>
                                      <p className="text-navy-800">{buildings.find(b => b.id === tenant.buildingId)?.name || '--'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Lease End Date</p>
                                      <p className="text-navy-800">{tenant.leaseEndDate || '--'}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Vacation Notice</p>
                                      <p className="text-navy-800">{tenant.vacationNotice || '--'}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Staff tab */}
            {activeTab === 'staff' && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
                {staff.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-gray-400">No staff yet. Click Create to add meter readers.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(s => (
                        <tr key={s.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                                {s.name.charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-navy-800">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">{s.email}</td>
                          <td className="px-5 py-4 text-sm text-gray-500">{s.phone}</td>
                          <td className="px-5 py-4 text-sm text-gray-500 capitalize">{s.role?.replace('_', ' ')}</td>
                          <td className="px-5 py-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(s.status)}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDeleteStaff(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer rounded-lg transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Meters tab */}
            {activeTab === 'meters' && (
              <div className="bg-white rounded-2xl shadow-sm shadow-purple-100/20 border border-purple-100/30 p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                      <Droplets size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-navy-800">Water Meter Readings</h3>
                      <p className="text-xs text-gray-400">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMeterReminders}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-white text-sm font-bold rounded-full border-none cursor-pointer hover:bg-cyan-600 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <MessageSquare size={16} /> Remind Staff to Read Meters
                  </button>
                </div>
                {tenants.filter(t => t.status === 'active' && t.meterNumber).length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-400">No tenants with water meters found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tenants.filter(t => t.status === 'active' && t.meterNumber).map(tenant => (
                      <div key={tenant.id} className="bg-lavender-50 rounded-2xl p-5 border border-purple-100/40 hover:shadow-md hover:shadow-purple-100/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold text-navy-800">{tenant.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Unit {tenant.unitNumber} &middot; Meter {tenant.meterNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            placeholder="Current reading"
                            value={readingInputs[tenant.id] || ''}
                            onChange={(e) => setReadingInputs(prev => ({ ...prev, [tenant.id]: e.target.value }))}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200/60 text-sm bg-white text-navy-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                          />
                          <button
                            onClick={() => handleSaveMeterReading(tenant)}
                            className="px-5 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all"
                          >
                            {t('save')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Billing tab */}
            {activeTab === 'billing' && (
              <>
                <div className="flex items-center justify-end mb-6 gap-3 flex-wrap">
                  <button
                    onClick={handleGenerateInvoices}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full border-none cursor-pointer hover:bg-sunshine-500 hover:shadow-lg hover:shadow-sunshine-400/20 transition-all disabled:opacity-50"
                  >
                    <FileText size={16} /> {actionLoading ? 'Generating...' : 'Generate Invoices'}
                  </button>
                  <button
                    onClick={handleSendInvoiceNotifications}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-full border-none cursor-pointer hover:bg-emerald-600 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Send size={16} /> Send Bills via WhatsApp
                  </button>
                  <button
                    onClick={handleSendPaymentReminders}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-full border-none cursor-pointer hover:bg-amber-600 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Bell size={16} /> Send Payment Reminders
                  </button>
                </div>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
                  {invoices.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-gray-400">No invoices yet. Generate invoices above.</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Tenant', 'Unit', 'Period', 'Rent', 'Service', 'Water', 'Total', 'Status', 'Actions'].map(h => (
                            <th key={h} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => {
                          const tenant = tenants.find(t => t.id === inv.tenantId);
                          return (
                            <tr key={inv.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                              <td className="px-4 py-4 text-sm font-semibold text-navy-800">{inv.tenantName}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{tenant?.unitNumber || '--'}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{inv.period}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">KES {(inv.rent || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">KES {(inv.serviceCharge || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{inv.waterUsage || 0}u / KES {(inv.waterCharge || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-navy-800">KES {(inv.totalAmount || 0).toLocaleString()}</td>
                              <td className="px-4 py-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(inv.status)}`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                {inv.status === 'unpaid' && (
                                  <button
                                    onClick={() => handleCollectPayment(inv)}
                                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full cursor-pointer hover:bg-emerald-100 transition-colors"
                                  >
                                    Collect
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* Payments tab */}
            {activeTab === 'payments' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: 'Collected', value: `KES ${collected.toLocaleString()}`, gradient: 'from-emerald-400 to-teal-500', icon: CreditCard },
                    { label: 'Outstanding', value: `KES ${outstanding.toLocaleString()}`, gradient: 'from-amber-400 to-orange-500', icon: FileText },
                    { label: 'Collection Rate', value: `${collectionRate}%`, gradient: 'from-purple-500 to-indigo-600', icon: Building2 },
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

                {/* Payment history */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <p className="text-sm font-bold text-navy-800">Payment History</p>
                  </div>
                  {payments.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-gray-400">No payments recorded yet.</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Date', 'Tenant', 'Unit', 'Phone', 'Amount', 'Method', 'Receipt #', 'Status'].map(h => (
                            <th key={h} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => {
                          const invoice = invoices.find(i => i.id === p.invoiceId);
                          const tenant = invoice ? tenants.find(t => t.id === invoice.tenantId) : null;
                          return (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-lavender-50/50 transition-colors">
                              <td className="px-4 py-4 text-sm text-gray-500">{p.completedAt?.slice(0, 10) || p.createdAt?.slice(0, 10)}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-navy-800">{tenant?.name || invoice?.tenantName || '--'}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{tenant?.unitNumber || '--'}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{p.phone}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-navy-800">KES {(p.amount || 0).toLocaleString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{p.currency === 'KES' ? 'M-Pesa' : p.currency || 'Mobile'}</td>
                              <td className="px-4 py-4 text-xs text-gray-400 font-mono">{p.transactionId?.slice(0, 8) || '--'}</td>
                              <td className="px-4 py-4">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(p.status)}`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstanceAdminDashboard;
