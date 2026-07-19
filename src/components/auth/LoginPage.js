import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { t } = useLanguage();
  const { login, changePassword, confirmMfa, requestWhatsAppOtp, pendingChallenge } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [whatsAppInfo, setWhatsAppInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWhatsAppInfo('');
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.challenge === 'NEW_PASSWORD_REQUIRED' || result.challenge === 'MFA_REQUIRED' || result.challenge === 'SMS_MFA' || result.challenge === 'TOTP_REQUIRED') {
      // Automatically trigger WhatsApp OTP if phone destination is available
      const phone = result.destination || '+254722265670';
      triggerWhatsApp(phone);
    } else {
      setError(result.error);
    }
  };

  const triggerWhatsApp = async (phone) => {
    setIsSendingWhatsApp(true);
    setWhatsAppInfo('Sending OTP via WhatsApp...');
    const waResult = await requestWhatsAppOtp(phone);
    setIsSendingWhatsApp(false);
    if (waResult.success) {
      setWhatsAppInfo(`OTP code sent via WhatsApp to ${waResult.data.maskedDestination || phone}`);
    } else {
      setWhatsAppInfo(`Could not auto-send WhatsApp OTP: ${waResult.error}`);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await changePassword(newPassword);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await confirmMfa(mfaCode);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  // Handle pending challenges (Password Change or MFA)
  if (pendingChallenge) {
    const isMfa = ['MFA_REQUIRED', 'SMS_MFA', 'TOTP_REQUIRED'].includes(pendingChallenge.challengeName);

    if (isMfa) {
      const targetPhone = pendingChallenge.destination || '+254722265670';

      return (
        <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
                <span className="text-lg font-bold text-navy-800 tracking-tight">
                  Tenant Billing
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-navy-800">Two-Factor Authentication</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter the verification code sent to your registered phone number.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
              <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-purple-50 flex items-center justify-center">
                <ShieldCheck size={24} className="text-purple-600" />
              </div>

              {whatsAppInfo && (
                <div className="mb-4 px-4 py-2.5 bg-emerald-50 rounded-xl flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">{whatsAppInfo}</p>
                </div>
              )}

              <form onSubmit={handleMfaSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-navy-800 mb-1.5 text-center">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="123456"
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
                  disabled={isSubmitting || mfaCode.length < 6}
                  className="w-full py-3 mb-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
                >
                  {isSubmitting ? t('loading') : 'Verify & Sign In'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => triggerWhatsApp(targetPhone)}
                disabled={isSendingWhatsApp}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
              >
                <MessageSquare size={14} />
                {isSendingWhatsApp ? 'Sending WhatsApp OTP...' : 'Send OTP via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
              <span className="text-lg font-bold text-navy-800 tracking-tight">
                Tenant Billing
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-800">Set New Password</h1>
            <p className="text-sm text-gray-500 mt-1">Your account requires a new password.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
            <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-amber-50 flex items-center justify-center">
              <Lock size={20} className="text-amber-500" />
            </div>
            <form onSubmit={handleNewPassword}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-400 mt-1.5">Must include uppercase, lowercase, and numbers</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {isSubmitting ? t('loading') : 'Set Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
            <span className="text-lg font-bold text-navy-800 tracking-tight">
              Tenant Billing
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-800">{t('login_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Sign in to your account.</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                {t('login_email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                {t('login_password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm text-navy-800 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-800 bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl">
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
            >
              {isSubmitting ? t('loading') : t('login_submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
