import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { t, lang, toggleLanguage } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-indigo-100 px-6 py-0 flex items-center justify-between" style={{ height: 56 }}>
      <Link to="/" className="flex items-center gap-2.5 no-underline">
        <img src="/logo.png" alt="Tenant Billing" style={{ height: 28 }} />
        <span className="text-sm font-bold text-[#1e1b4b] tracking-tight">
          Tenant Billing
        </span>
      </Link>

      <div className="flex items-center gap-0">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium text-indigo-400 hover:text-indigo-700 bg-transparent border-none cursor-pointer transition-colors"
          title={lang === 'en' ? 'Passer en français' : 'Switch to English'}
        >
          <Globe size={14} />
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="px-4 py-3 text-xs font-medium text-indigo-500 hover:text-indigo-800 no-underline transition-colors"
            >
              {t('nav_dashboard')}
            </Link>
            <span className="text-xs text-indigo-300 px-2">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium text-indigo-400 hover:text-indigo-700 bg-transparent border-none cursor-pointer transition-colors"
            >
              <LogOut size={14} />
              {t('nav_logout')}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-3 text-xs font-medium text-indigo-500 hover:text-indigo-800 no-underline transition-colors"
            >
              {t('nav_login')}
            </Link>
            <Link
              to="/register"
              className="ml-1 px-5 py-2 text-xs font-semibold bg-[#4f46e5] text-white no-underline transition-colors hover:bg-[#4338ca]"
            >
              {t('nav_register')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
