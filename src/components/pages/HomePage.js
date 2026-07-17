import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CreditCard, Droplets, Building2,
  MessageCircle, ClipboardList, ArrowRight, Globe,
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-6">
            Property Management Platform
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            {t('hero_title')}
          </h1>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-10 font-mono">
            {t('hero_subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-8 py-3 bg-white text-zinc-900 font-bold text-sm uppercase tracking-wider hover:bg-zinc-100 transition-colors"
            >
              {t('hero_cta')} <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3 border border-zinc-600 text-zinc-300 font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 transition-colors"
            >
              {t('hero_login')}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="p-8 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-zinc-300 mb-4">
                    <Icon size={18} className="text-zinc-600" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-2">
                    {t(feat.keyTitle)}
                  </h3>
                  <p className="text-sm text-zinc-500 font-mono leading-relaxed">
                    {t(feat.keyDesc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe size={16} className="text-zinc-400" />
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              {t('countries_title')}
            </p>
          </div>
          <p className="text-sm text-zinc-500 mb-12 max-w-lg mx-auto font-mono">
            {t('countries_subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="flex flex-col items-center gap-2 p-4 border border-zinc-200 bg-zinc-50 hover:bg-white transition-colors w-28"
              >
                <span className="text-3xl">{country.flag}</span>
                <span className="text-xs font-mono text-zinc-600 uppercase tracking-wide text-center">
                  {lang === 'fr' ? country.nameFr : country.nameEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-zinc-900 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">{t('pricing_title')}</h2>
          <p className="text-zinc-400 font-mono mb-12">{t('pricing_subtitle')}</p>

          <div className="border border-zinc-700 bg-zinc-800 p-10">
            <p className="text-5xl font-extrabold mb-2">KES 1,000</p>
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-8">
              {t('pricing_per_tenant')}
            </p>

            <div className="text-left max-w-sm mx-auto mb-10">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4">
                {t('pricing_includes')}
              </p>
              {[
                t('pricing_item_1'), t('pricing_item_2'), t('pricing_item_3'),
                t('pricing_item_4'), t('pricing_item_5'), t('pricing_item_6'),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-700">
                  <div className="w-1.5 h-1.5 bg-white" />
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/register')}
              className="px-10 py-3 bg-white text-zinc-900 font-bold text-sm uppercase tracking-wider hover:bg-zinc-100 transition-colors"
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
