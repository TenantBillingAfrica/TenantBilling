import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import COUNTRIES from '../../data/countries';

const RegisterPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: 'KE',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center bg-white border border-zinc-200 p-10">
          <div className="w-12 h-12 flex items-center justify-center border border-zinc-300 mx-auto mb-4">
            <Building2 size={20} className="text-zinc-600" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-2">Application Received</h2>
          <p className="text-sm text-zinc-500 font-mono mb-6">
            We'll review your application and set up your tenant billing instance. You'll receive an email with login credentials shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors border-none cursor-pointer"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 size={20} className="text-zinc-900" />
            <span className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">
              Tenant Billing
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">{t('reg_title')}</h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">{t('reg_subtitle')}</p>
        </div>

        <div className="bg-white border border-zinc-200 p-8">
          <form onSubmit={handleSubmit}>
            {[
              { key: 'name', label: t('reg_name'), type: 'text', placeholder: 'James Kamau' },
              { key: 'email', label: t('reg_email'), type: 'email', placeholder: 'james@property.com' },
              { key: 'phone', label: t('reg_phone'), type: 'tel', placeholder: '+254 700 000 000' },
              { key: 'company', label: t('reg_company'), type: 'text', placeholder: 'Kamau Properties Ltd' },
            ].map((field) => (
              <div key={field.key} className="mb-4">
                <label className="block text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-zinc-300 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
            ))}

            <div className="mb-6">
              <label className="block text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {t('reg_country')}
              </label>
              <select
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 text-sm font-mono text-zinc-900 bg-transparent focus:outline-none focus:border-zinc-600 transition-colors"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {lang === 'fr' ? c.nameFr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors border-none cursor-pointer"
            >
              {t('reg_submit')} <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
