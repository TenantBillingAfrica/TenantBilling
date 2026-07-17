import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CreditCard, Droplets, Building2,
  MessageCircle, ClipboardList, ArrowRight, Globe, Check, Sparkles,
  Home, Heart, Shield,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import COUNTRIES from '../../data/countries';

const FEATURES = [
  { icon: FileText, keyTitle: 'feature_billing', keyDesc: 'feature_billing_desc', gradient: 'from-purple-500 to-indigo-600' },
  { icon: CreditCard, keyTitle: 'feature_payments', keyDesc: 'feature_payments_desc', gradient: 'from-amber-400 to-orange-500' },
  { icon: Droplets, keyTitle: 'feature_meters', keyDesc: 'feature_meters_desc', gradient: 'from-cyan-400 to-blue-500' },
  { icon: Building2, keyTitle: 'feature_multi', keyDesc: 'feature_multi_desc', gradient: 'from-emerald-400 to-teal-500' },
  { icon: MessageCircle, keyTitle: 'feature_whatsapp', keyDesc: 'feature_whatsapp_desc', gradient: 'from-green-400 to-emerald-500' },
  { icon: ClipboardList, keyTitle: 'feature_statements', keyDesc: 'feature_statements_desc', gradient: 'from-rose-400 to-pink-500' },
];

const STATS = [
  { value: '12', label: 'African countries', icon: Globe },
  { value: '500+', label: 'Happy landlords', icon: Home },
  { value: '25K+', label: 'Tenants served', icon: Heart },
  { value: '99.9%', label: 'Uptime guarantee', icon: Shield },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-800">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fb7185 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
            <Sparkles size={14} className="text-sunshine-400" />
            <span className="text-sm font-medium text-white/80">
              Property Management Made Joyful
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
            Keep your tenants{' '}
            <span className="text-transparent bg-clip-text" style={{
              backgroundImage: 'linear-gradient(135deg, #fbbf24, #f97316, #fb7185)',
            }}>
              happy
            </span>
            <br />& your billing{' '}
            <span className="text-transparent bg-clip-text" style={{
              backgroundImage: 'linear-gradient(135deg, #34d399, #06b6d4, #818cf8)',
            }}>
              effortless
            </span>
          </h1>

          <p className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            {t('hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-8 py-3.5 bg-sunshine-400 text-navy-800 font-bold text-sm rounded-full hover:bg-sunshine-500 hover:shadow-xl hover:shadow-sunshine-400/20 transition-all border-none cursor-pointer"
            >
              {t('hero_cta')} <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold text-sm rounded-full hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
            >
              {t('hero_login')}
            </button>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 32C240 70 480 80 720 56C960 32 1200 0 1440 16V80H0V32Z" fill="#faf8f5" />
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-16 bg-warm-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-lavender-100 flex items-center justify-center">
                    <Icon size={20} className="text-navy-700" />
                  </div>
                  <p className="text-3xl font-extrabold text-navy-800">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-lavender-100 text-navy-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles size={14} />
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-800 tracking-tight">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text" style={{
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #db2777)',
              }}>manage tenants</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="group p-7 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-purple-100/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-base font-bold text-navy-800 mb-2">
                    {t(feat.keyTitle)}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t(feat.keyDesc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-20 bg-lavender-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-navy-700 rounded-full text-sm font-semibold mb-4 shadow-sm">
            <Globe size={14} />
            {t('countries_title')}
          </span>
          <p className="text-sm text-gray-500 mb-14 max-w-md mx-auto">
            {t('countries_subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="flex flex-col items-center gap-2 px-5 py-4 bg-white rounded-2xl border border-purple-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/40 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                style={{ minWidth: 100 }}
              >
                <span className="text-3xl">{country.flag}</span>
                <span className="text-xs font-semibold text-navy-700 text-center leading-tight">
                  {lang === 'fr' ? country.nameFr : country.nameEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-navy-800 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[5%] w-[350px] h-[350px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">{t('pricing_title')}</h2>
          <p className="text-white/50 mb-10">{t('pricing_subtitle')}</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-navy-900/60 backdrop-blur-sm p-1.5 rounded-full mb-10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all border-none cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-sunshine-400 text-navy-800 shadow-lg'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              {t('pricing_monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all border-none cursor-pointer flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-sunshine-400 text-navy-800 shadow-lg'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              {t('pricing_annual')}
              {billingCycle !== 'annual' && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                  -25%
                </span>
              )}
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 border border-white/10">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-xl text-white/50 font-medium">KES</span>
              <span className="text-7xl font-extrabold text-white">
                {billingCycle === 'monthly' ? t('pricing_monthly_price') : t('pricing_annual_price')}
              </span>
            </div>
            <p className="text-sm text-white/40 mb-10">
              {billingCycle === 'monthly' ? t('pricing_monthly_label') : t('pricing_annual_label')}
            </p>

            <div className="text-left max-w-xs mx-auto mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-5">
                {t('pricing_includes')}
              </p>
              {[
                t('pricing_item_1'), t('pricing_item_2'), t('pricing_item_3'),
                t('pricing_item_4'), t('pricing_item_5'), t('pricing_item_6'),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-emerald-400" />
                  </div>
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/register')}
              className="px-10 py-3.5 bg-sunshine-400 text-navy-800 font-bold text-sm rounded-full hover:bg-sunshine-500 hover:shadow-xl hover:shadow-sunshine-400/20 transition-all border-none cursor-pointer"
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
