import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-navy-900 px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-white/40">
          {t('footer_credit')}{' '}
          <a
            href="https://www.chatworks.chat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sunshine-400 hover:text-sunshine-500 no-underline transition-colors font-semibold"
          >
            {t('footer_chatworks')}
          </a>
        </span>
        <div className="flex items-center gap-6">
          <a href="/terms" className="text-sm text-white/40 hover:text-white no-underline transition-colors">
            {t('footer_terms')}
          </a>
          <a href="/privacy" className="text-sm text-white/40 hover:text-white no-underline transition-colors">
            {t('footer_privacy')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
