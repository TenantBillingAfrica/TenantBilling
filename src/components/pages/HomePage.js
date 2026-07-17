import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CreditCard, Droplets, Building2,
  MessageCircle, ClipboardList, ArrowRight, Globe, Check,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import COUNTRIES from '../../data/countries';

const FEATURES = [
  { icon: FileText, keyTitle: 'feature_billing', keyDesc: 'feature_billing_desc' },
  { icon: CreditCard, keyTitle: 'feature_payments', keyDesc: 'feature_payments_desc' },
  { icon: Droplets, keyTitle: 'feature_meters', keyDesc: 'feature_meters_desc' },
  { icon: Building2, keyTitle: 'feature_multi', keyDesc: 'feature_multi_desc' },
  { icon: MessageCircle, keyTitle: 'feature_whatsapp', keyDesc: 'feature_whatsapp_desc' },
  { icon: ClipboardList, keyTitle: 'feature_statements', keyDesc: 'feature_statements_desc' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1e1b4b 50%, #312e81 100%)' }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="Tenant Billing" style={{ height: 64, filter: 'brightness(0) invert(1) opacity(0.9)' }} />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white tracking-tight mb-5 leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-base sm:text-lg text-indigo-200/80 max-w-xl mx-auto mb-10 leading-relaxed">
            {t('hero_subtitle')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-7 py-3 bg-white text-[#1e1b4b] font-semibold text-sm hover:bg-indigo-50 transition-colors border-none cursor-pointer"
            >
              {t('hero_cta')} <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-7 py-3 border border-indigo-400/30 text-indigo-200 font-semibold text-sm hover:bg-white/5 transition-colors bg-transparent cursor-pointer"
            >
              {t('hero_login')}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-[#fafafe]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 mb-3">Features</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
              Everything you need to manage tenants
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-indigo-100">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="p-8 bg-white hover:bg-indigo-50/50 transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 mb-5">
                    <Icon size={18} className="text-[#4f46e5]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1e1b4b] mb-2">
                    {t(feat.keyTitle)}
                  </h3>
                  <p className="text-sm text-indigo-400 leading-relaxed">
                    {t(feat.keyDesc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe size={14} className="text-indigo-400" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {t('countries_title')}
            </p>
          </div>
          <p className="text-sm text-indigo-400 mb-14 max-w-md mx-auto">
            {t('countries_subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="flex flex-col items-center gap-2 p-4 bg-[#fafafe] border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all w-24 cursor-default"
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="text-[10px] font-semibold text-[#1e1b4b] uppercase tracking-wide text-center leading-tight">
                  {lang === 'fr' ? country.nameFr : country.nameEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1e1b4b 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3">Pricing</p>
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">{t('pricing_title')}</h2>
          <p className="text-indigo-300/70 mb-10">{t('pricing_subtitle')}</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center border border-indigo-500/30 bg-indigo-900/30 p-1 mb-10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 text-xs font-semibold transition-colors border-none cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#1e1b4b]'
                  : 'bg-transparent text-indigo-300 hover:text-white'
              }`}
            >
              {t('pricing_monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 text-xs font-semibold transition-colors border-none cursor-pointer flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#1e1b4b]'
                  : 'bg-transparent text-indigo-300 hover:text-white'
              }`}
            >
              {t('pricing_annual')}
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white">
                {t('pricing_save')}
              </span>
            </button>
          </div>

          <div className="border border-indigo-500/20 bg-indigo-900/20 p-10">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-lg text-indigo-300">KES</span>
              <span className="text-6xl font-extrabold text-white">
                {billingCycle === 'monthly' ? t('pricing_monthly_price') : t('pricing_annual_price')}
              </span>
            </div>
            <p className="text-xs text-indigo-400 mb-10">
              {billingCycle === 'monthly' ? t('pricing_monthly_label') : t('pricing_annual_label')}
            </p>

            <div className="text-left max-w-xs mx-auto mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-4">
                {t('pricing_includes')}
              </p>
              {[
                t('pricing_item_1'), t('pricing_item_2'), t('pricing_item_3'),
                t('pricing_item_4'), t('pricing_item_5'), t('pricing_item_6'),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-indigo-800/50">
                  <Check size={14} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-indigo-200">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/register')}
              className="px-10 py-3 bg-white text-[#1e1b4b] font-semibold text-sm hover:bg-indigo-50 transition-colors border-none cursor-pointer"
            >
              {t('pricing_cta')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
