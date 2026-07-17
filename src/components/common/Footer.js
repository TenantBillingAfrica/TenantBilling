import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0a0a1a] border-t border-[#1a1a3a] px-6 py-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <span className="text-xs text-[#6366f1]/60 tracking-wide">
          {t('footer_credit')}{' '}
          <a
            href="https://www.chatworks.chat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6366f1] hover:text-white no-underline transition-colors font-semibold"
          >
            {t('footer_chatworks')}
          </a>
        </span>
        <div className="flex items-center gap-6">
          <a href="/terms" className="text-xs text-[#6366f1]/60 hover:text-white no-underline transition-colors">
            {t('footer_terms')}
          </a>
          <a href="/privacy" className="text-xs text-[#6366f1]/60 hover:text-white no-underline transition-colors">
            {t('footer_privacy')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
