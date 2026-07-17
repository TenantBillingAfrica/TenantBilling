import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@tenantbilling.com', password: 'admin123', label: 'System Admin' },
  { email: 'landlord@demo.com', password: 'demo123', label: 'Landlord (Instance Admin)' },
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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 size={20} className="text-zinc-900" />
            <span className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">
              Tenant Billing
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">{t('login_title')}</h1>
        </div>

        {/* Login form */}
        <div className="bg-white border border-zinc-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {t('login_email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-zinc-300 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none focus:border-zinc-600 transition-colors disabled:bg-zinc-100"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {t('login_password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 border border-zinc-300 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none focus:border-zinc-600 transition-colors disabled:bg-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-mono mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 border-none cursor-pointer"
            >
              {isSubmitting ? t('loading') : t('login_submit')}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 border border-zinc-200 bg-white p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Demo Accounts
          </p>
          {DEMO_ACCOUNTS.map((acct) => (
            <button
              key={acct.email}
              onClick={() => handleDemoFill(acct)}
              className="w-full text-left px-3 py-2 mb-1 text-xs font-mono text-zinc-600 hover:bg-zinc-50 bg-transparent border border-zinc-100 cursor-pointer transition-colors"
            >
              <span className="font-semibold text-zinc-900">{acct.label}</span>
              <span className="text-zinc-400 ml-2">{acct.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
