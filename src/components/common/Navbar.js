import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Globe } from 'lucide-react';
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
    <nav className="bg-white border-b border-zinc-200 px-6 py-0 flex items-center justify-between" style={{ height: 48 }}>
      <Link to="/" className="flex items-center gap-2 text-zinc-900 no-underline">
        <Building2 size={16} />
        <span className="text-xs font-extrabold uppercase tracking-widest">Tenant Billing</span>
      </Link>

      <div className="flex items-center gap-0">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-4 py-3 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-900 bg-transparent border-none cursor-pointer transition-colors"
          title={lang === 'en' ? 'Passer en français' : 'Switch to English'}
        >
          <Globe size={12} />
          {lang === 'en' ? 'FR' : 'EN'}
        </button>

        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-900 no-underline transition-colors"
            >
              {t('nav_dashboard')}
            </Link>
            <span className="text-xs font-mono text-zinc-400 px-2">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-900 bg-transparent border-none cursor-pointer transition-colors"
            >
              <LogOut size={12} />
              {t('nav_logout')}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-900 no-underline transition-colors"
            >
              {t('nav_login')}
            </Link>
            <Link
              to="/register"
              className="px-4 py-3 text-xs font-mono uppercase tracking-wider bg-zinc-900 text-white no-underline transition-colors hover:bg-zinc-800"
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
