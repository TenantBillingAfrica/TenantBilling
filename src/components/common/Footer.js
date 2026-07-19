import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 px-6 py-12" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 no-underline mb-3">
              <img
                src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png"
                alt="TenantBilling"
                className="h-7"
                style={{ filter: 'brightness(0) invert(1)' }}
                loading="lazy"
                width="28"
                height="28"
              />
              <span className="text-sm font-bold text-white">TenantBilling</span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed">
              Tenant management software for African property managers and landlords. Automate billing, collect rent via mobile money, and keep tenants happy.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Product</h3>
            <nav aria-label="Product links">
              <ul className="list-none p-0 m-0 space-y-2">
                <li><Link to="/#features" className="text-sm text-white/40 hover:text-white no-underline transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="text-sm text-white/40 hover:text-white no-underline transition-colors">Pricing</Link></li>
                <li><Link to="/tenant-portal" className="text-sm text-white/40 hover:text-white no-underline transition-colors">Tenant Portal</Link></li>
                <li><Link to="/register" className="text-sm text-white/40 hover:text-white no-underline transition-colors">Get Started</Link></li>
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Legal</h3>
            <nav aria-label="Legal links">
              <ul className="list-none p-0 m-0 space-y-2">
                <li><Link to="/privacy" className="text-sm text-white/40 hover:text-white no-underline transition-colors">{t('footer_privacy')}</Link></li>
                <li><Link to="/terms" className="text-sm text-white/40 hover:text-white no-underline transition-colors">{t('footer_terms')}</Link></li>
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Contact</h3>
            <address className="not-italic space-y-2">
              <p className="text-sm text-white/40">
                <a href="mailto:support@tenantbilling.africa" className="text-white/40 hover:text-white no-underline transition-colors">
                  support@tenantbilling.africa
                </a>
              </p>
              <p className="text-sm text-white/40">
                <a href="https://wa.me/254700000000" className="text-white/40 hover:text-white no-underline transition-colors" target="_blank" rel="noopener noreferrer">
                  WhatsApp Support
                </a>
              </p>
              <p className="text-sm text-white/40">Nairobi, Kenya</p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {currentYear} TenantBilling. All rights reserved. A product by{' '}
            <a
              href="https://www.chatworks.chat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sunshine-400 hover:text-sunshine-500 no-underline transition-colors font-semibold"
            >
              ChatWorks
            </a>
          </p>
          <p className="text-xs text-white/20">
            Serving landlords in Kenya, Nigeria, South Africa, Uganda, Tanzania, Ghana, Rwanda &amp; more
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
