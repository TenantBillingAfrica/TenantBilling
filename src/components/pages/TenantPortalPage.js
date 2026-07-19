import React, { useState } from 'react';
import { FileText, Phone, ShieldCheck, ArrowLeft } from 'lucide-react';
import { requestTenantOtp, verifyTenantOtp, getTenantStatement } from '../../services/tenant-portal.service';

const TenantPortalPage = () => {
  const [step, setStep] = useState('phone'); // phone | otp | statement
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await requestTenantOtp(phone);
      setOtpToken(res.data.token);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyTenantOtp({ token: otpToken, code: otpCode, phone });
      setSessionToken(res.data.sessionToken);
      setStep('statement');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStatement = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await getTenantStatement({ sessionToken, startDate: startDate || undefined, endDate: endDate || undefined });
      setStatement(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch statement.');
    } finally {
      setLoading(false);
    }
  };

  const resetPortal = () => {
    setStep('phone');
    setPhone('');
    setOtpCode('');
    setOtpToken('');
    setSessionToken('');
    setStatement(null);
    setError('');
  };

  // Phone entry step
  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
              <span className="text-lg font-bold text-navy-800 tracking-tight">Tenant Billing</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-800">Tenant Statement Portal</h1>
            <p className="text-sm text-gray-500 mt-1">View your billing statements and payment history</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
            <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-purple-50 flex items-center justify-center">
              <Phone size={24} className="text-purple-600" />
            </div>
            <form onSubmit={handleRequestOtp}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-400 mt-1.5">Enter the phone number registered with your tenancy</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // OTP verification step
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
              <span className="text-lg font-bold text-navy-800 tracking-tight">Tenant Billing</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-800">Verify Your Identity</h1>
            <p className="text-sm text-gray-500 mt-1">Enter the code sent to your WhatsApp</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
            <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck size={24} className="text-emerald-600" />
            </div>
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5 text-center">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  disabled={loading}
                  className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-3 rounded-xl border border-gray-200 text-navy-800 placeholder:text-gray-300 placeholder:tracking-normal bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            <button
              onClick={() => { setStep('phone'); setError(''); }}
              className="w-full mt-3 py-2.5 text-sm text-gray-500 bg-transparent border-none cursor-pointer hover:text-navy-800"
            >
              <ArrowLeft size={14} className="inline mr-1" /> Back to phone entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Statement view step
  return (
    <div className="min-h-screen bg-lavender-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-8" />
            <h1 className="text-xl font-extrabold text-navy-800">My Statement</h1>
          </div>
          <button onClick={resetPortal} className="text-sm text-gray-500 hover:text-navy-800 bg-transparent border-none cursor-pointer">
            Sign Out
          </button>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-100/30 mb-6">
          <form onSubmit={handleGetStatement} className="flex flex-wrap items-end gap-4">
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
              <FileText size={16} className="inline mr-1.5" />
              {loading ? 'Loading...' : 'Get Statement'}
            </button>
          </form>

          {error && (
            <div className="mt-4 px-4 py-2.5 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Statement results */}
        {statement && (
          <>
            {/* Tenant info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/20 border border-purple-100/30 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Tenant</p>
                  <p className="text-sm font-bold text-navy-800 mt-1">{statement.tenant.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Unit</p>
                  <p className="text-sm font-bold text-navy-800 mt-1">{statement.tenant.unitNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Move-in Date</p>
                  <p className="text-sm font-bold text-navy-800 mt-1">{statement.tenant.moveInDate?.slice(0, 10) || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Status</p>
                  <p className={`text-sm font-bold mt-1 ${statement.tenant.vacatedAt ? 'text-red-600' : 'text-emerald-600'}`}>
                    {statement.tenant.vacatedAt ? 'Vacated' : 'Active'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30">
                <p className="text-xs text-gray-400 uppercase font-semibold">Total Billed</p>
                <p className="text-2xl font-extrabold text-navy-800 mt-2">KES {(statement.summary.totalBilled || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30">
                <p className="text-xs text-gray-400 uppercase font-semibold">Total Paid</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-2">KES {(statement.summary.totalPaid || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100/30">
                <p className="text-xs text-gray-400 uppercase font-semibold">Balance</p>
                <p className={`text-2xl font-extrabold mt-2 ${statement.summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  KES {(statement.summary.balance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Invoice table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-purple-100/20 border border-purple-100/30">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-navy-800">Invoice History ({statement.summary.invoiceCount} invoices)</p>
              </div>
              {statement.statement.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">No invoices found for this period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Period', 'Rent', 'Service', 'Water', 'Total', 'Status', 'Paid Date'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {statement.statement.map((inv, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-lavender-50/50">
                          <td className="px-5 py-3 text-sm font-semibold text-navy-800">{inv.period}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">KES {(inv.rent || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">KES {(inv.serviceCharge || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{inv.waterUsage}L (KES {(inv.waterCharge || 0).toLocaleString()})</td>
                          <td className="px-5 py-3 text-sm font-bold text-navy-800">KES {(inv.totalAmount || 0).toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-500">{inv.paidAt?.slice(0, 10) || '-'}</td>
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

export default TenantPortalPage;
