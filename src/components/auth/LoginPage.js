import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@tenantbilling.com', password: 'admin123', label: 'System Admin' },
  { email: 'landlord@demo.com', password: 'demo123', label: 'Landlord' },
  { email: 'meter@demo.com', password: 'demo123', label: 'Meter Reader' },
];

const LoginPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } else {
      setError(result.error);
    }
  };

  const handleDemoFill = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="/logo.png" alt="Tenant Billing" className="h-10" />
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

        {/* Demo accounts */}
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Demo Accounts
          </p>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                onClick={() => handleDemoFill(acct)}
                className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-lavender-50 bg-transparent rounded-xl border border-gray-100 cursor-pointer transition-colors"
              >
                <span className="font-semibold text-navy-800">{acct.label}</span>
                <span className="text-gray-400 ml-2 text-xs">{acct.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
