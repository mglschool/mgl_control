import React, { useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface Props {
  username: string;
  onSuccess: () => void;
}

export const ForcePasswordChangeModal: React.FC<Props> = ({ username, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف وأرقام.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.changePassword({
        currentPassword: currentPassword || undefined,
        newPassword
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900 w-full max-w-md p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-red-700" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:border-red-900">
            <ShieldAlert className="w-8 h-8 text-red-700 dark:text-red-500 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
            تغيير كلمة المرور إلزامي (First-Time Security)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            مرحبًا <strong className="text-red-700 dark:text-red-400 font-mono">{username}</strong>. لحماية كنترول مدرسة ملوي الرسمية للغات، يلزم النظام تعيين كلمة مرور جديدة قوية وخاصة بك قبل المتابعة.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              كلمة المرور الحالية (المؤقتة)
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="e.g. Admin@Mallawi2026!"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              كلمة المرور الجديدة (8 خانات على الأقل) *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              تأكيد كلمة المرور الجديدة *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'إخفاء' : 'إظهار كلمة المرور'}</span>
            </button>
            <span>يتم التشفير باستخدام Bcrypt</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer mt-2"
          >
            {isLoading ? 'جارٍ الحفظ والتشفير...' : 'حفظ كلمة المرور والدخول للكنترول'}
          </button>
        </form>
      </div>
    </div>
  );
};
