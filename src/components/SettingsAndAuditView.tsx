import React, { useState, useEffect } from 'react';
import { AuditLog, OutboxEmail, SystemSettings } from '../types';
import { api, getAuthToken } from '../lib/api';
import {
  Settings,
  Mail,
  ShieldCheck,
  Database,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Server,
  KeyRound,
  Eye,
  EyeOff,
  Send,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface Props {
  onRefresh: () => void;
}

export const SettingsAndAuditView: React.FC<Props> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'outbox' | 'audit_logs'>('settings');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [outboxEmails, setOutboxEmails] = useState<OutboxEmail[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    schoolNameAr: 'مدرسة ملوي الرسمية للغات',
    schoolNameEn: 'Mallawi Governmental Language School',
    controlNameAr: 'كنترول المرحلة الثانوية',
    controlNameEn: 'Secondary Control',
    academicYear: '2026 / 2027',
    currentTerm: 'term1',
    allowSelfCheckIn: false,
    enableCheckoutQR: true,
    smtpConfigured: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'mallawigovlanguageschool@gmail.com'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedMail, setSelectedMail] = useState<OutboxEmail | null>(null);

  // Email Configuration & Test states
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('mallawigovlanguageschool@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      alert('يرجى كتابة البريد الإلكتروني المستلم للتجربة');
      return;
    }
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      // First save current settings so backend has latest credentials
      await api.updateSettings(settings);
      const res = await api.testEmail({ toEmail: testEmailAddress.trim() });
      setTestEmailResult({ success: true, message: res.message || 'تم إرسال بريد الاختبار بنجاح.' });
    } catch (err: any) {
      setTestEmailResult({ success: false, message: err.message || 'فشل إرسال بريد الاختبار.' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logs, emails, st] = await Promise.all([
        api.getAuditLogs(),
        api.getOutboxEmails(),
        api.getSettings()
      ]);
      setAuditLogs(logs);
      setOutboxEmails(emails);
      if (st && st.schoolNameAr) setSettings(st);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/system/backup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mallawi_secondary_control_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('فشل تنزيل النسخة الاحتياطية');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-700" />
            <span>إعدادات النظام والبريد وسجل الرقابة (System & Audit)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · إعدادات الكنترول، صندوق صادر السيرفر، وسجل العمليات الأمني
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          <span>تحميل نسخة احتياطية من قاعدة البيانات (Backup JSON)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          إعدادات الكنترول والمدرسة
        </button>
        <button
          onClick={() => setActiveTab('outbox')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'outbox'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <span>صندوق البريد الصادر (Outbox Logs)</span>
          <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-[10px] flex items-center justify-center font-mono">
            {outboxEmails.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit_logs'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <span>سجل الرقابة والعمليات (Audit Log)</span>
          <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-[10px] flex items-center justify-center font-mono">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: System Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5 text-right">
          {isSaved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ الإعدادات بنجاح في قاعدة البيانات.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">اسم المدرسة بالعربية</label>
              <input
                type="text"
                value={settings.schoolNameAr}
                onChange={(e) => setSettings({ ...settings, schoolNameAr: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">اسم المدرسة بالإنجليزية</label>
              <input
                type="text"
                value={settings.schoolNameEn}
                onChange={(e) => setSettings({ ...settings, schoolNameEn: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">اسم الكنترول بالعربية</label>
              <input
                type="text"
                value={settings.controlNameAr}
                onChange={(e) => setSettings({ ...settings, controlNameAr: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">اسم الكنترول بالإنجليزية</label>
              <input
                type="text"
                value={settings.controlNameEn}
                onChange={(e) => setSettings({ ...settings, controlNameEn: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">العام الدراسي</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">الفصل الدراسي الحالي</label>
              <select
                value={settings.currentTerm}
                onChange={(e) => setSettings({ ...settings, currentTerm: e.target.value as any })}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-900 dark:text-stone-100"
              >
                <option value="term1">الفصل الدراسي الأول (الترم الأول)</option>
                <option value="term2">الفصل الدراسي الثاني (الترم الثاني)</option>
              </select>
            </div>
          </div>

          {/* Firebase Cloud Firestore Online Section */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <h3 className="font-extrabold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>سيرفر وقاعدة بيانات Google Cloud Firestore السحابية (Online Server)</span>
            </h3>
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-stone-700 dark:text-stone-300 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>مشروع Firebase السحابي:</strong>{' '}
                  <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                    gen-lang-client-0981115609
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>سحابة Firestore متصلة وجاهزة للنشر</span>
                </div>
              </div>
              <div>
                <strong>قاعدة بيانات Firestore:</strong>{' '}
                <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                  ai-studio-mallawigovernmen-a94ea44f-7aea-4d12-a018-c264f8be83ca
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                قاعدة البيانات السحابية مهيأة الآن ومحمية بقواعد أمان Firestore Security Rules، وتدعم مزامنة بيانات الكنترول والطلاب بين جميع الأجهزة والهواتف مباشرة عند النشر.
              </p>
            </div>
          </div>

          {/* Email Server Service Config Info */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-extrabold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-700" />
                <span>خدمة إرسال البريد الإلكتروني التلقائية عبر السيرفر (Automatic Email Dispatch)</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                إرسال فوري بدون تدخل يدوي
              </span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-4">
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                يقوم السيرفر تلقائياً بإرسال رسالة بريد إلكتروني ترحيبية فور قبولك لأي طلب تسجيل من المعلمين أو أعضاء الكنترول، وتتضمن اسم المستخدم (Username)، كلمة المرور المؤقتة، ورابط الدخول المباشر.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    البريد الإلكتروني الرسمي للمدرسة (Sender Email) *
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={settings.smtpUser || ''}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    placeholder="mallawigovlanguageschool@gmail.com"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    كلمة مرور التطبيقات من جوجل (Gmail App Password) *
                  </label>
                  <div className="relative">
                    <input
                      type={showSmtpPass ? 'text' : 'password'}
                      dir="ltr"
                      value={settings.smtpPass || ''}
                      onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                      placeholder="الكود المكون من 16 حرف (مثال: abcd efgh ijkl mnop)"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                      title={showSmtpPass ? 'إخفاء' : 'إظهار'}
                    >
                      {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guide box on obtaining Gmail App Password */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>كيفية استخراج كلمة مرور التطبيقات من حساب Google في 30 ثانية:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-stone-700 dark:text-stone-300 pr-1">
                  <li>
                    تأكد من تسجيل الدخول ببريد المدرسة: <code className="font-mono text-red-700 dark:text-red-400">mallawigovlanguageschool@gmail.com</code>.
                  </li>
                  <li>
                    افتح الرابط: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-mono inline-flex items-center gap-0.5">myaccount.google.com/apppasswords <ExternalLink className="w-2.5 h-2.5" /></a> (يتطلب تفعيل التحقق بخطوتين 2-Step Verification).
                  </li>
                  <li>
                    اكتب اسم التطبيق (مثال: <strong>كنترول مدرسة ملوي</strong>) ثم اضغط <strong>إنشاء (Create)</strong>.
                  </li>
                  <li>
                    انسخ الكود الأصفر المكون من 16 حرف والصقه في خانة <strong>كلمة مرور التطبيقات</strong> أعلاه، ثم اضغط <strong>حفظ إعدادات الكنترول</strong>.
                  </li>
                </ol>
              </div>

              {/* Live Test Email Section */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-700">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  تجربة إرسال بريد إلكتروني فوري من السيرفر:
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="email"
                    dir="ltr"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="اكتب البريد الذي تريد استقبال رسالة التجربة عليه"
                    className="flex-1 w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    disabled={isTestingEmail}
                    onClick={handleTestEmail}
                    className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                  >
                    {isTestingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جارٍ إرسال بريد الاختبار...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال بريد تجريبي الآن</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Message */}
                {testEmailResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      testEmailResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {testEmailResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    )}
                    <span>{testEmailResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
            >
              حفظ إعدادات الكنترول
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Outbox Mail Log */}
      {activeTab === 'outbox' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <span>سجل الرسائل الصادرة من السيرفر للمستخدمين (تفعيل الحسابات، كلمات المرور المؤقتة، وروابط الاستعادة)</span>
              <button
                onClick={fetchData}
                className="flex items-center gap-1 text-red-700 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                    <th className="p-3">وقت الإرسال</th>
                    <th className="p-3">المرسل إليه</th>
                    <th className="p-3">عنوان الرسالة</th>
                    <th className="p-3">رمز التفعيل / Token</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">معاينة الرسالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {outboxEmails.map((mail) => (
                    <tr key={mail.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-3 font-mono text-[11px] text-stone-400">
                        {new Date(mail.sentAt).toLocaleString('ar-EG')}
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">{mail.to}</td>
                      <td className="p-3 font-medium text-stone-700 dark:text-stone-300">{mail.subject}</td>
                      <td className="p-3 font-mono text-[11px] text-stone-500">
                        {mail.activationToken || '-'}
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          تم الإرسال
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedMail(mail)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          عرض المحتوى
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            سجل أمني مفصل بجميع عمليات الكنترول وتسجيل الدخول وتعديل الدرجات والحضور
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">الوقت والتاريخ</th>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">نوع العملية</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">التفاصيل</th>
                  <th className="p-3 font-mono">عنوان IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="p-3 font-mono text-[11px] text-stone-400">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-3 font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {log.userName}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-red-700 dark:text-red-400 font-bold">
                      {log.action}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {log.category}
                      </span>
                    </td>
                    <td className="p-3 text-stone-700 dark:text-stone-300 max-w-sm">{log.details}</td>
                    <td className="p-3 font-mono text-[11px] text-stone-400">{log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mail Modal Preview */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-sm text-stone-900">معاينة الرسالة الصادرة</h3>
              <button
                onClick={() => setSelectedMail(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="my-3 text-xs space-y-1 text-right">
              <div><strong>إلى:</strong> <span className="font-mono">{selectedMail.to}</span></div>
              <div><strong>الموضوع:</strong> {selectedMail.subject}</div>
              <div><strong>تاريخ الإرسال:</strong> <span className="font-mono">{new Date(selectedMail.sentAt).toLocaleString('ar-EG')}</span></div>
            </div>
            <div
              className="mt-4 p-4 border border-stone-200 rounded-xl bg-stone-50"
              dangerouslySetInnerHTML={{ __html: selectedMail.html }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
