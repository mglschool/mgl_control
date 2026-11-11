import React, { useState, useEffect } from 'react';
import { User, AccountRequest, UserRole } from '../types';
import { api } from '../lib/api';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Clock
} from 'lucide-react';

interface Props {
  currentUser: User;
}

export const UsersManagementView: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState<AccountRequest | null>(null);
  const [assignedUsername, setAssignedUsername] = useState('');
  const [assignedRole, setAssignedRole] = useState<UserRole>('teacher');
  const [tempPass, setTempPass] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    temporaryPassword?: string;
    username?: string;
    recipientEmail?: string;
    emailDelivered?: boolean;
    message?: string;
  } | null>(null);

  const fetchUsersAndRequests = async () => {
    setIsLoading(true);
    try {
      const [uData, rData] = await Promise.all([api.getUsers(), api.getAccountRequests()]);
      setUsers(uData);
      setRequests(rData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRequests();
  }, []);

  const handleOpenReview = (req: AccountRequest) => {
    setSelectedReq(req);
    // suggest username from email or name
    const suggested = req.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `user${Math.floor(100 + Math.random() * 900)}`;
    setAssignedUsername(suggested);
    setAssignedRole('teacher');
    setTempPass(`Mallawi@${Math.floor(1000 + Math.random() * 9000)}`);
    setApprovalResult(null);
  };

  const handleApprove = async () => {
    if (!selectedReq || !assignedUsername.trim()) return;
    setIsReviewing(true);

    try {
      const res = await api.reviewAccountRequest(selectedReq.id, {
        action: 'approve',
        username: assignedUsername.trim(),
        role: assignedRole,
        temporaryPassword: tempPass,
        permissions: {
          manageStudents: assignedRole === 'admin',
          manageTeachers: assignedRole === 'admin',
          manageGrades: true,
          takeAttendance: true,
          viewReports: true,
          manageDiscipline: true,
          manageHomework: true,
          manageSettings: assignedRole === 'admin'
        }
      });

      setApprovalResult({
        username: assignedUsername.trim(),
        temporaryPassword: res.temporaryPassword || tempPass,
        recipientEmail: selectedReq.email,
        emailDelivered: (res as any).emailDelivered !== false,
        message: res.message
      });
      fetchUsersAndRequests();
    } catch (err: any) {
      alert(err.message || 'فشل قبول الطلب');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async (reqId: string) => {
    if (!window.confirm('هل أنت متأكد من رفض طلب الحساب هذا؟')) return;
    try {
      await api.reviewAccountRequest(reqId, { action: 'reject' });
      fetchUsersAndRequests();
    } catch (err: any) {
      alert(err.message || 'فشل الرفض');
    }
  };

  const handleToggleSuspend = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = newStatus === 'suspended' ? `تجميد حساب (${user.username})؟` : `تنشيط حساب (${user.username})؟`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUser(user.id, { status: newStatus });
      fetchUsersAndRequests();
    } catch (err: any) {
      alert(err.message || 'فشل تعديل حالة الحساب');
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(`إعادة تعيين كلمة المرور للمستخدم (${user.username})؟ سيتم إنشاء كلمة مرور مؤقتة.`)) return;

    try {
      const res = await api.updateUser(user.id, { resetPassword: true });
      alert(`تمت إعادة التعيين بنجاح. كلمة المرور الجديدة المؤقتة هي: ${res.newGeneratedPass}`);
      fetchUsersAndRequests();
    } catch (err: any) {
      alert(err.message || 'فشل إعادة التعيين');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`حذف حساب المستخدم (${user.username}) نهائيًا من الكنترول؟`)) return;

    try {
      await api.deleteUser(user.id);
      fetchUsersAndRequests();
    } catch (err: any) {
      alert(err.message || 'فشل حذف المستخدم');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-700" />
            <span>إدارة المستخدمين والصلاحيات (Users & Roles)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · مراجعة طلبات الانضمام، إرسال بيانات التفعيل، والتحكم بالصلاحيات
          </p>
        </div>

        {/* Pending counter badge */}
        <div className="flex items-center gap-2">
          {pendingRequests.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 text-xs font-bold rounded-xl animate-pulse">
              يوجد {pendingRequests.length} طلبات حساب بانتظار موافقة الأدمن
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          <span>طلبات الانضمام والحسابات الجديدة</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-700 text-white text-[10px] flex items-center justify-center font-mono">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          المستخدمون النشطون بالكنترول ({users.length})
        </button>
      </div>

      {/* Tab 1: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            طلبات التسجيل الواردة من المعلمين وأعضاء الكنترول عبر صفحة طلب الحساب
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">الاسم بالكامل</th>
                  <th className="p-3">البريد الإلكتروني</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">الدور المطلوب</th>
                  <th className="p-3">تاريخ الطلب</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{req.fullName}</td>
                      <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{req.email}</td>
                      <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{req.phone || '-'}</td>
                      <td className="p-3 text-stone-700 dark:text-stone-300 font-medium">{req.roleRequested || 'معلم'}</td>
                      <td className="p-3 font-mono text-stone-400 text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status === 'approved' ? 'تمت الموافقة والتفعيل' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {req.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenReview(req)}
                              className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              مراجعة وتفعيل الحساب
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px]">تمت المعالجة</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      لا توجد طلبات حسابات جديدة حاليًا.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users List */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">اسم المستخدم (Username)</th>
                  <th className="p-3">الاسم بالكامل</th>
                  <th className="p-3">البريد الإلكتروني</th>
                  <th className="p-3">الدور الوظيفي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">آخر تسجيل دخول</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {users.map((u) => {
                  const isPrimaryAdmin = u.username === 'MB1';

                  return (
                    <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <span>{u.username}</span>
                        {isPrimaryAdmin && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[9px] rounded font-bold">
                            المدير الأساسي
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{u.fullName}</td>
                      <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{u.email}</td>
                      <td className="p-3 font-semibold text-stone-700 dark:text-stone-300">
                        {u.role === 'admin'
                          ? 'مدير نظام (Admin)'
                          : u.role === 'teacher'
                          ? 'معلم'
                          : u.role === 'attendance_officer'
                          ? 'مسؤول حضور وغياب'
                          : 'أخصائي'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {u.status === 'active' ? 'نشط' : 'مجمد'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-stone-400">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ar-EG') : 'لم يسجل دخول بعد'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          {!isPrimaryAdmin && (
                            <>
                              <button
                                onClick={() => handleToggleSuspend(u)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                                title={u.status === 'active' ? 'تجميد الحساب' : 'تنشيط الحساب'}
                              >
                                {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                                title="إعادة تعيين كلمة المرور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 cursor-pointer"
                                title="حذف الحساب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>موافقة وتفعيل حساب: {selectedReq.fullName}</span>
            </h3>

            {approvalResult ? (
              <div className="my-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>تم تفعيل الحساب وتوليد بيانات الدخول بنجاح.</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-100 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                  <div className="space-y-0.5 text-right">
                    <div className="font-bold">
                      أرسل السيرفر بريد التفعيل التلقائي إلى:
                    </div>
                    <div className="font-mono text-emerald-800 dark:text-emerald-300 font-bold" dir="ltr">
                      {approvalResult.recipientEmail}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      تم الإرسال بدون أي تدخل يدوي متضمناً اسم المستخدم وكلمة المرور المؤقتة ورابط الدخول.
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 text-xs font-mono space-y-1">
                  <div>Username: <strong className="text-red-700 dark:text-red-400">{approvalResult.username}</strong></div>
                  <div>كلمة المرور المؤقتة: <strong>{approvalResult.temporaryPassword}</strong></div>
                </div>
                <p className="text-[11px] text-stone-500">
                  سيُجبر المستخدم على تعيين كلمة مرور شخصية جديدة عند أول تسجيل دخول.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedReq(null);
                      setApprovalResult(null);
                    }}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    تم
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mt-4 text-right">
                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs text-stone-600 dark:text-stone-300 space-y-1">
                  <div><strong>البريد:</strong> {selectedReq.email}</div>
                  <div><strong>الهاتف:</strong> {selectedReq.phone || 'غير مسجل'}</div>
                  {selectedReq.notes && <div><strong>ملاحظات المتقدم:</strong> {selectedReq.notes}</div>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    تعيين اسم المستخدم (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={assignedUsername}
                    onChange={(e) => setAssignedUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الدور الوظيفي والصلاحيات *
                  </label>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  >
                    <option value="teacher">معلم (رصد درجات، واجبات، تقييمات، وسلوك)</option>
                    <option value="attendance_officer">مسؤول حضور وغياب (قارئ QR وكشوف)</option>
                    <option value="counselor">أخصائي اجتماعي (سلوك وانضباط ومتابعة)</option>
                    <option value="admin">مدير نظام كامل (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    كلمة المرور المؤقتة (Temporary Password)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={tempPass}
                    onChange={(e) => setTempPass(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    يتم إرسالها مشفرة في بريد التفعيل، ويتم إجبار المستخدم على تغييرها فور الدخول.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={handleApprove}
                    className="px-5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isReviewing ? 'جارٍ التفعيل والإرسال...' : 'تأكيد تفعيل الحساب وإرسال البريد'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
