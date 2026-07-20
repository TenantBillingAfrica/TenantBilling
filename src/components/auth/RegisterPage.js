import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, PartyPopper, AlertCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { createApplication } from '../../services/applications.service';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../../services/whatsapp.service';
import COUNTRIES from '../../data/countries';

const RegisterPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'submitted'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: 'KE',
  });

  const [otpCode, setOtpCode] = useState('');
  const [whatsAppSession, setWhatsAppSession] = useState(null);
  const [whatsAppInfo, setWhatsAppInfo] = useState('');

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleStartVerification = async (e) => {
    e.preventDefault();
    setError('');
    setWhatsAppInfo('');
    setIsSendingOtp(true);

    try {
      const waResult = await sendWhatsAppOtp(form.phone, form.email);
      setWhatsAppSession(waResult);
      const maskedPhone = waResult.maskedDestination || form.phone || '***';
      setWhatsAppInfo(`Verification code sent via WhatsApp (${maskedPhone}) and Email (${form.email})`);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your phone number and email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsSendingOtp(true);
    try {
      const waResult = await sendWhatsAppOtp(form.phone, form.email);
      setWhatsAppSession(waResult);
      const maskedPhone = waResult.maskedDestination || form.phone || '***';
      setWhatsAppInfo(`New code sent via WhatsApp (${maskedPhone}) and Email (${form.email})`);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    if (!whatsAppSession) {
      setError('Session expired. Please request a new verification code.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      // 1. Verify OTP via WhatsApp/Email service
      await verifyWhatsAppOtp({
        token: whatsAppSession.token,
        emailToken: whatsAppSession.emailToken || null,
        code: otpCode,
        phone: form.phone,
      });

      // 2. Submit application with verification flags
      await createApplication({
        ...form,
        phoneVerified: true,
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
      });

      setStep('submitted');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl p-10 shadow-xl shadow-purple-100/30">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <PartyPopper size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-navy-800 mb-2">Application Received!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your identity has been verified via WhatsApp and Email. We'll review your application and set up your tenant billing instance. You'll receive your login credentials shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 transition-all border-none cursor-pointer"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
              <span className="text-lg font-bold text-navy-800 tracking-tight">
                Tenant Billing
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-800">Verify Property Application</h1>
            <p className="text-sm text-gray-500 mt-1">
              Confirm your contact details to complete registration.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
            <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShieldCheck size={24} className="text-purple-600" />
            </div>

            {whatsAppInfo && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800 font-bold">{whatsAppInfo}</p>
                </div>
                <div className="text-[11px] text-emerald-700 space-y-1 pt-1.5 border-t border-emerald-200/50">
                  <p><b>WhatsApp:</b> Check Message Requests / Unknown Senders</p>
                  <p><b>Email:</b> Check Spam / Junk folder ({form.email})</p>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyAndSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-3 rounded-xl border border-gray-200 text-navy-800 placeholder:text-gray-300 placeholder:tracking-normal bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 6}
                className="w-full py-3 mb-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {isSubmitting ? t('loading') : 'Verify & Submit Application'}
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSendingOtp}
                className="w-full py-2 px-4 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
              >
                <MessageSquare size={14} />
                {isSendingOtp ? 'Sending...' : 'Resend Code via WhatsApp & Email'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2 text-xs text-gray-500 font-semibold hover:text-navy-800 flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
            <span className="text-lg font-bold text-navy-800 tracking-tight">
              Tenant Billing
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-800">{t('reg_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('reg_subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
          <form onSubmit={handleStartVerification}>
            {[
              { key: 'name', label: t('reg_name'), type: 'text', placeholder: 'James Kamau' },
              { key: 'email', label: t('reg_email'), type: 'email', placeholder: 'james@property.com' },
              { key: 'phone', label: t('reg_phone'), type: 'tel', placeholder: '+254 700 000 000' },
              { key: 'company', label: t('reg_company'), type: 'text', placeholder: 'Kamau Properties Ltd' },
            ].map((field) => (
              <div key={field.key} className="mb-4">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  disabled={isSendingOtp}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
              </div>
            ))}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                {t('reg_country')}
              </label>
              <select
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
                disabled={isSendingOtp}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {lang === 'fr' ? c.nameFr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
            >
              {isSendingOtp ? 'Sending OTP...' : 'Continue to Verification'} {!isSendingOtp && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
