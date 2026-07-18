import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { t } = useLanguage();
  const { login, changePassword, pendingChallenge } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.challenge === 'NEW_PASSWORD_REQUIRED') {
      // Show new password form
    } else {
      setError(result.error);
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

  // Force password change screen
  if (pendingChallenge) {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Tenant Billing" className="h-10" />
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
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Tenant Billing" className="h-10" />
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
