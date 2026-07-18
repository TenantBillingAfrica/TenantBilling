import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PartyPopper, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { createApplication } from '../../services/applications.service';
import COUNTRIES from '../../data/countries';

const RegisterPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: 'KE',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await createApplication(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl p-10 shadow-xl shadow-purple-100/30">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <PartyPopper size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-navy-800 mb-2">Application Received!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            We'll review your application and set up your tenant billing instance. You'll receive an email with login credentials shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 transition-all border-none cursor-pointer"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="Tenant Billing" className="h-10" />
            <span className="text-lg font-bold text-navy-800 tracking-tight">
              Tenant Billing
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-800">{t('reg_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('reg_subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/30">
          <form onSubmit={handleSubmit}>
            {[
              { key: 'name', label: t('reg_name'), type: 'text', placeholder: 'James Kamau' },
              { key: 'email', label: t('reg_email'), type: 'email', placeholder: 'james@property.com' },
              { key: 'phone', label: t('reg_phone'), type: 'tel', placeholder: '+254 700 000 000' },
              { key: 'company', label: t('reg_company'), type: 'text', placeholder: 'Kamau Properties Ltd' },
            ].map((field) => (
              <div key={field.key} className="mb-4">
                <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  disabled={isSubmitting}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 placeholder:text-gray-400 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
                />
              </div>
            ))}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                {t('reg_country')}
              </label>
              <select
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-navy-800 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-100"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {lang === 'fr' ? c.nameFr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sunshine-400 text-navy-800 text-sm font-bold rounded-full hover:bg-sunshine-500 hover:shadow-lg transition-all disabled:opacity-50 border-none cursor-pointer"
            >
              {isSubmitting ? t('loading') : t('reg_submit')} {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
