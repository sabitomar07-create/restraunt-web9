import React, { useState } from 'react';
import { Mail, Lock, KeyRound, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ForgotPasswordPageProps {
  navigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ navigate }) => {
  const { language, isRtl } = useLanguage();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (data.resetToken) {
        setToken(data.resetToken);
        setStep('reset');
        setMessage(
          language === 'ar'
            ? 'تم إنشاء رمز استعادة كلمة المرور بنجاح. أدخل كلمة المرور الجديدة أدناه.'
            : 'Password reset token generated. Please enter your new password below.'
        );
      } else {
        setMessage(data.message || 'Check your email for reset instructions.');
      }
    } catch {
      setIsLoading(false);
      setError('Failed to request password reset.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }
      setMessage(
        language === 'ar'
          ? 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.'
          : 'Password has been reset successfully! You can now log in.'
      );
      setTimeout(() => navigate('/auth'), 2000);
    } catch {
      setIsLoading(false);
      setError('Network error while resetting password.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#D62828]/15 border border-[#D62828]/30 flex items-center justify-center text-[#D62828]">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {language === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {language === 'ar'
              ? 'أدخل بريدك الإلكتروني المسجل وسنقوم بإرسال رمز الاستعادة.'
              : 'Enter your registered email address to receive a secure password recovery code.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-[#132B1C] border border-emerald-500/40 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none dir-ltr text-left"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-sm transition-colors shadow-lg shadow-[#D62828]/25"
            >
              {isLoading ? '...' : (language === 'ar' ? 'إرسال رمز الاستعادة' : 'Send Reset Code')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">
                {language === 'ar' ? 'رمز الاستعادة (Token)' : 'Recovery Token'} *
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-[#111111] border border-[#2E2E2E] rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">
                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 rtl:right-3 rtl:left-auto w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-[#FF8A00] rounded-xl py-2.5 px-9 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#D62828] hover:bg-[#b82020] text-white font-extrabold text-sm transition-colors shadow-lg"
            >
              {isLoading ? '...' : (language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Set New Password')}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/auth')}
            className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
