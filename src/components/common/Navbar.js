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
    <nav className="bg-navy-800 px-6 py-0 flex items-center justify-between" style={{ height: 64 }}>
      <Link to="/" className="flex items-center gap-3 no-underline">
        <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-8" style={{ filter: 'brightness(0) invert(1)' }} />
        <span className="text-base font-bold text-white tracking-tight">
          Tenant Billing
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/60 hover:text-white bg-transparent border-none cursor-pointer transition-colors rounded-full"
          title={lang === 'en' ? 'Passer en français' : 'Switch to English'}
        >
          <Globe size={15} />
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white no-underline transition-colors"
            >
              {t('nav_dashboard')}
            </Link>
            <span className="text-sm text-white/40 px-2 hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/60 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white no-underline transition-colors"
            >
              {t('nav_login')}
            </Link>
            <Link
              to="/register"
              className="ml-1 px-6 py-2.5 text-sm font-semibold bg-sunshine-400 text-navy-800 no-underline transition-all hover:bg-sunshine-500 hover:shadow-lg rounded-full"
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
