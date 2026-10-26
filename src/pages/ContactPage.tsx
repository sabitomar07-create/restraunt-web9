import React, { useState } from 'react';
import { Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';

export const ContactPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { settings } = useSettings();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSent(false), 4000);
  };

  const address = language === 'ar' ? settings.addressAr : settings.addressEn;
  const hours = language === 'ar' ? settings.openingHoursAr : settings.openingHoursEn;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          {t('contact')}
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1 max-w-2xl">
          {language === 'ar'
            ? 'نسعد دائماً باستقبال زيارتكم في فرعنا أو تلقي طلباتكم واستفساراتكم على مدار الساعة.'
            : 'Visit our Cairo kitchen or get in touch with our team for deliveries, catering, and inquiries.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              {language === 'ar' ? 'معلومات المطعم' : 'Restaurant Information'}
            </h2>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF8A00]/15 flex items-center justify-center text-[#FF8A00] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">{language === 'ar' ? 'العنوان' : 'Address'}</span>
                  <span className="font-semibold text-white leading-relaxed">{address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D62828]/15 flex items-center justify-center text-[#D62828] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">{language === 'ar' ? 'مواعيد العمل' : 'Opening Hours'}</span>
                  <span className="font-semibold text-white">{hours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">{language === 'ar' ? 'رقم الهاتف' : 'Hotline'}</span>
                  <a href={`tel:${settings.phone}`} className="font-semibold text-white hover:text-[#FF8A00] dir-ltr inline-block">
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">WhatsApp</span>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-400 hover:underline"
                  >
                    {language === 'ar' ? 'مراسلتنا عبر الواتساب' : 'Chat on WhatsApp'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            {language === 'ar' ? 'أرسل لنا رسالة أو اقتراح' : 'Send us a message or feedback'}
          </h2>

          {sent && (
            <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'شكراً لتواصلك! تم استلام رسالتك بنجاح.' : 'Thank you! Your message has been received.'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{t('customerName')} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-3 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-3 text-xs sm:text-sm text-white focus:outline-none dir-ltr text-left"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">{language === 'ar' ? 'الرسالة أو الملاحظة' : 'Message'} *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب رسالتك أو استفسارك هنا...' : 'Write your comments, order feedback, or catering query...'}
                className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#D62828] to-[#b82222] text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-[#D62828]/25"
            >
              <Send className="w-4 h-4" />
              <span>{language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
