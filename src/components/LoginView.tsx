import React, { useState } from 'react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  School,
  ArrowRight
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User, mustChangePassword: boolean) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Request Account Form State
  const [reqFullName, setReqFullName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqRole, setReqRole] = useState('معلم');
  const [reqNotes, setReqNotes] = useState('');
  const [reqSuccessMsg, setReqSuccessMsg] = useState<string | null>(null);
  const [reqErrorMsg, setReqErrorMsg] = useState<string | null>(null);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login({
        username: username.trim(),
        password: password.trim()
      });

      setAuthToken(res.token);
      onLoginSuccess(res.user, res.mustChangePassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول. تحقق من البيانات المدخلة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName.trim() || !reqEmail.trim()) {
      setReqErrorMsg('يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }

    setIsSubmittingReq(true);
    setReqErrorMsg(null);
    setReqSuccessMsg(null);

    try {
      const res = await api.requestAccount({
        fullName: reqFullName.trim(),
        email: reqEmail.trim(),
        phone: reqPhone.trim(),
        roleRequested: reqRole,
        notes: reqNotes.trim()
      });

      setReqSuccessMsg(res.message);
      setReqFullName('');
      setReqEmail('');
      setReqPhone('');
      setReqNotes('');
    } catch (err: any) {
      setReqErrorMsg(err.message || 'حدث خطأ في تقديم الطلب');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;

    setIsForgotLoading(true);
    setForgotMsg(null);

    try {
      const res = await api.forgotPassword({ identifier: forgotIdentifier.trim() });
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg(err.message || 'حدث خطأ في معالجة الطلب');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center p-4 relative selection:bg-red-700 selection:text-white">
      {/* Background soft geometric pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#991b1b_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200/80 dark:border-stone-800 p-8 sm:p-10 relative overflow-hidden">
          {/* Top Brand Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />

          {/* School Official Logo & Titles */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-3.5">
              <img
                src="/assets/aistudio/logopng_2bf70979.png"
                alt="Mallawi Official Language School"
                className="w-28 h-28 object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
              مدرسة ملوي الرسمية للغات
            </h1>
            <p className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-500 uppercase tracking-wider mt-0.5">
              Mallawi Governmental Language School
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Secondary Control - كنترول المرحلة الثانوية</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 text-right">
                اسم المستخدم (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. MB1"
                  required
                  className="w-full pl-3 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-all font-mono"
                />
                <UserIcon className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  كلمة المرور (Password)
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-600 transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-red-700 hover:bg-red-800 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول للنظام (Login)</span>
                </>
              )}
            </button>
          </form>

          {/* New Account Request Action */}
          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800 text-center">
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-red-700" />
              <span>طلب إنشاء حساب جديد للكنترول أو المعلمين</span>
            </button>
          </div>

          {/* Initial Admin Credentials Helper Note */}
          <div className="mt-5 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-400 text-right leading-relaxed">
            <div className="font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-red-600" />
              <span>بيانات مدير النظام الأولية (Admin):</span>
            </div>
            <div className="font-mono text-stone-700 dark:text-stone-300">
              Username: <strong className="text-red-700 dark:text-red-400">MB1</strong> | Password:{' '}
              <strong className="text-stone-800 dark:text-stone-200">SHOsho0125</strong>
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              * حساب مدير الكنترول: أ. شنودة رأفت رمزي.
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-stone-500 dark:text-stone-500">
          جمهورية مصر العربية - وزارة التربية والتعليم - مدرسة ملوي الرسمية للغات
        </div>
      </div>

      {/* Account Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-700" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  طلب إنشاء حساب جديد في النظام
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reqSuccessMsg ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">تم إرسال الطلب بنجاح</h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">{reqSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleAccountRequest} className="space-y-3.5 mt-4 text-right">
                {reqErrorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reqErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الاسم بالكامل رباعي *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqFullName}
                    onChange={(e) => setReqFullName(e.target.value)}
                    placeholder="مثال: أ. أحمد محمد إبراهيم حسن"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    البريد الإلكتروني المعتمد *
                  </label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    placeholder="name@minya.moe.edu.eg أو Gmail"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    رقم الهاتف / الواتساب
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={reqPhone}
                    onChange={(e) => setReqPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الدور المطلوب بالمدرسة
                  </label>
                  <select
                    value={reqRole}
                    onChange={(e) => setReqRole(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  >
                    <option value="معلم لغة عربية">معلم لغة عربية</option>
                    <option value="معلم لغة إنجليزية">معلم لغة إنجليزية</option>
                    <option value="معلم علوم متكاملة / كيمياء / فيزياء">معلم علوم متكاملة / كيمياء / فيزياء</option>
                    <option value="معلم رياضيات">معلم رياضيات</option>
                    <option value="معلم دراسات / تاريخ">معلم دراسات / تاريخ</option>
                    <option value="مسؤول شؤون الطلاب والحضور">مسؤول شؤون الطلاب والحضور</option>
                    <option value="أخصائي اجتماعي / سلوك">أخصائي اجتماعي / سلوك</option>
                    <option value="عضو كنترول المرحلة الثانوية">عضو كنترول المرحلة الثانوية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ملاحظات أو الفصول المسندة (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    placeholder="مثال: تدريس فصول 1/1 و 1/2 للغة الإنجليزية"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReq}
                    className="px-5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {isSubmittingReq ? 'جارٍ الإرسال...' : 'إرسال الطلب للأدمن'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-red-700" />
                استعادة كلمة المرور
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-3.5 text-right">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                أدخل اسم المستخدم أو البريد الإلكتروني المسجل، وسيرسل السيرفر رابط التفعيل الآمن.
              </p>

              <div>
                <input
                  type="text"
                  required
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="اسم المستخدم أو البريد الإلكتروني"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              {forgotMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {forgotMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isForgotLoading ? 'جارٍ الإرسال...' : 'إرسال رابط التعيين'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
