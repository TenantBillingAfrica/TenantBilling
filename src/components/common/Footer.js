import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 px-6 py-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          {t('footer_powered')}
        </span>
        <div className="flex items-center gap-6">
          <a href="/terms" className="text-xs font-mono text-zinc-500 uppercase tracking-wider hover:text-zinc-300 no-underline transition-colors">
            {t('footer_terms')}
          </a>
          <a href="/privacy" className="text-xs font-mono text-zinc-500 uppercase tracking-wider hover:text-zinc-300 no-underline transition-colors">
            {t('footer_privacy')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
