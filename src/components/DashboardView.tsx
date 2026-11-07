import React from 'react';
import { Student, AttendanceRecord, GradeRecord, User } from '../types';
import { formatGradeArabic } from '../lib/export';
import {
  Users,
  GraduationCap,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertTriangle,
  QrCode,
  FileSpreadsheet,
  Award,
  ChevronLeft,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface Props {
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  currentUser: User;
  onNavigate: (view: string) => void;
  onOpenQrScanner: () => void;
}

export const DashboardView: React.FC<Props> = ({
  students,
  attendance,
  grades,
  currentUser,
  onNavigate,
  onOpenQrScanner
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);

  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;
  const totalStudents = students.length;

  const attendedTotal = presentCount + lateCount;
  const attendanceRate = totalStudents > 0 ? ((attendedTotal / totalStudents) * 100).toFixed(1) : '0';

  const grade1Count = students.filter((s) => s.grade === 'grade1').length;
  const grade2Count = students.filter((s) => s.grade === 'grade2').length;
  const grade3Count = students.filter((s) => s.grade === 'grade3').length;

  // Identify students with frequent absence or warnings
  const absenceMap = new Map<string, number>();
  attendance.forEach((a) => {
    if (a.status === 'absent' || a.status === 'late') {
      absenceMap.set(a.studentId, (absenceMap.get(a.studentId) || 0) + 1);
    }
  });

  const studentsWithAlerts = students
    .filter((s) => (absenceMap.get(s.id) || 0) >= 1)
    .sort((a, b) => (absenceMap.get(b.id) || 0) - (absenceMap.get(a.id) || 0))
    .slice(0, 5);

  // Recent attendance activity
  const recentAttendance = [...todayAttendance]
    .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-red-800 via-red-700 to-red-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-red-200 text-xs font-semibold">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span>·</span>
              <span>العام الدراسي 2026 / 2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              أهلاً بك، {currentUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              كنترول مدرسة ملوي الرسمية للغات (Secondary Control). جميع عمليات الحضور بالباركود، رصد الدرجات، وتقارير الطلاب مفعلة ومحدثة لحظيًا.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenQrScanner}
              className="px-4 py-2.5 bg-white text-red-800 hover:bg-red-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-red-700" />
              <span>فتح قارئ QR للحضور</span>
            </button>
            <button
              onClick={() => onNavigate('grades')}
              className="px-4 py-2.5 bg-red-900/60 hover:bg-red-900 border border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>رصد درجات الامتحانات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
            <span>إجمالي طلاب المرحلة</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-stone-900 dark:text-stone-100">
              {totalStudents}
            </span>
            <span className="text-xs text-stone-500 font-medium">طالب مسجل</span>
          </div>
          <div className="mt-3 text-[11px] text-stone-500 border-t border-stone-100 dark:border-stone-800/80 pt-2 flex items-center justify-between">
            <span>1ث: {grade1Count}</span>
            <span>2ث: {grade2Count}</span>
            <span>3ث: {grade3Count}</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
            <span>حضور اليوم (QR + يدوي)</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {presentCount}
            </span>
            <span className="text-xs text-stone-500 font-medium">حاضر الآن</span>
          </div>
          <div className="mt-3 text-[11px] text-stone-500 border-t border-stone-100 dark:border-stone-800/80 pt-2 flex items-center justify-between">
            <span className="text-amber-600 font-medium">تأخير: {lateCount}</span>
            <span className="text-stone-400 font-mono text-[10px]">اليوم {todayStr}</span>
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-red-700 dark:text-red-400 text-xs font-bold mb-2">
            <span>غياب اليوم</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-red-700 dark:text-red-500">
              {absentCount}
            </span>
            <span className="text-xs text-stone-500 font-medium">غائب</span>
          </div>
          <div className="mt-3 text-[11px] text-stone-500 border-t border-stone-100 dark:border-stone-800/80 pt-2 flex items-center justify-between">
            <span>قيد المتابعة</span>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-red-700 dark:text-red-400 font-semibold hover:underline cursor-pointer"
            >
              عرض الكشف
            </button>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
            <span>نسبة الحضور اليومية</span>
            <TrendingUp className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-stone-900 dark:text-stone-100">
              {attendanceRate}%
            </span>
            <span className="text-xs text-stone-500 font-medium">المعدل العام</span>
          </div>
          <div className="mt-3 w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-700 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Number(attendanceRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Grid: Charts & Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance & Grades Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                توزيع الطلاب والمستويات حسب الصفوف الدراسية
              </h3>
              <p className="text-xs text-stone-500">مدرسة ملوي الرسمية للغات - المرحلة الثانوية</p>
            </div>
            <span className="text-xs font-mono text-stone-400">{todayStr}</span>
          </div>

          {/* Clean Visual SVG Bars */}
          <div className="space-y-4 pt-2">
            {/* Grade 1 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                <span>الصف الأول الثانوي (Grade 10)</span>
                <span className="font-mono tabular-nums">{grade1Count} طالب</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-700 h-full rounded-r-full"
                  style={{ width: `${totalStudents ? (grade1Count / totalStudents) * 100 : 0}%` }}
                />
              </div>
              <div className="text-[10px] text-stone-500 mt-1 flex justify-between">
                <span>الفصول المتاحة: 1/1، 1/2، 1/3</span>
                <span>{totalStudents ? ((grade1Count / totalStudents) * 100).toFixed(0) : 0}% من إجمالي المدرسة</span>
              </div>
            </div>

            {/* Grade 2 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                <span>الصف الثاني الثانوي (Grade 11)</span>
                <span className="font-mono tabular-nums">{grade2Count} طالب</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-stone-800 dark:bg-stone-600 h-full rounded-r-full"
                  style={{ width: `${totalStudents ? (grade2Count / totalStudents) * 100 : 0}%` }}
                />
              </div>
              <div className="text-[10px] text-stone-500 mt-1 flex justify-between">
                <span>الفصول المتاحة: 2/1، 2/2</span>
                <span>{totalStudents ? ((grade2Count / totalStudents) * 100).toFixed(0) : 0}% من إجمالي المدرسة</span>
              </div>
            </div>

            {/* Grade 3 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                <span>الصف الثالث الثانوي (Grade 12 - الشهادة الثانوية العامة)</span>
                <span className="font-mono tabular-nums">{grade3Count} طالب</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-900 h-full rounded-r-full"
                  style={{ width: `${totalStudents ? (grade3Count / totalStudents) * 100 : 0}%` }}
                />
              </div>
              <div className="text-[10px] text-stone-500 mt-1 flex justify-between">
                <span>الفصول المتاحة: 3/1، 3/2</span>
                <span>{totalStudents ? ((grade3Count / totalStudents) * 100).toFixed(0) : 0}% من إجمالي المدرسة</span>
              </div>
            </div>
          </div>

          {/* Quick shortcuts strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => onNavigate('students')}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 text-right transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-red-700 mb-1" />
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">إدارة الطلاب</div>
              <div className="text-[10px] text-stone-500">إضافة أو استيراد Excel</div>
            </button>

            <button
              onClick={() => onNavigate('attendance')}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 text-right transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">كشوف الحضور</div>
              <div className="text-[10px] text-stone-500">تقارير يومية وشهرية</div>
            </button>

            <button
              onClick={() => onNavigate('grades')}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 text-right transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-600 mb-1" />
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">الكنترول والدرجات</div>
              <div className="text-[10px] text-stone-500">امتحانات وترتيب الأوائل</div>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 text-right transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-stone-700 dark:text-stone-300 mb-1" />
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">التقارير والشهادات</div>
              <div className="text-[10px] text-stone-500">تصدير PDF & Excel</div>
            </button>
          </div>
        </div>

        {/* Absence Alerts & Warnings */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  تنبيهات الغياب والتأخير
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-stone-400">متابعة فورية</span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800/80 mt-2">
              {studentsWithAlerts.length > 0 ? (
                studentsWithAlerts.map((st) => {
                  const count = absenceMap.get(st.id) || 0;
                  return (
                    <div key={st.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {st.fullName}
                        </div>
                        <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                          <span>{formatGradeArabic(st.grade)}</span>
                          <span>فصل {st.sectionClass}</span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-mono">
                          {count} أيام غياب
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-stone-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  لا توجد تنبيهات غياب حرجة مسجلة اليوم.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => onNavigate('discipline')}
              className="w-full py-2 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>فتح سجل الالتزام والمخالفات السلوكية</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent QR Attendance Stream */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-red-700" />
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              أحدث عمليات مسح الحضور اليومية برمز QR
            </h3>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>عرض كل السجلات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 text-[11px] font-bold">
                <th className="pb-2.5">كود الطالب</th>
                <th className="pb-2.5">اسم الطالب</th>
                <th className="pb-2.5">الصف والفصل</th>
                <th className="pb-2.5">وقت الحضور</th>
                <th className="pb-2.5">الحالة</th>
                <th className="pb-2.5">طريقة التسجيل</th>
                <th className="pb-2.5">المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((rec) => {
                  const student = students.find((s) => s.id === rec.studentId);
                  return (
                    <tr key={rec.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-red-700 dark:text-red-400">
                        {student?.studentId || '-'}
                      </td>
                      <td className="py-2.5 font-bold text-stone-900 dark:text-stone-100">
                        {student?.fullName || 'طالب غير مسجل'}
                      </td>
                      <td className="py-2.5 text-stone-600 dark:text-stone-400">
                        {student ? `${formatGradeArabic(student.grade)} (${student.sectionClass})` : '-'}
                      </td>
                      <td className="py-2.5 font-mono text-stone-700 dark:text-stone-300">
                        {rec.checkInTime || '-'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            rec.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              : rec.status === 'late'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900'
                          }`}
                        >
                          {rec.status === 'present' ? 'حاضر' : rec.status === 'late' ? 'متأخر' : 'غائب'}
                        </span>
                      </td>
                      <td className="py-2.5 text-stone-500">
                        {rec.method === 'qr' ? 'مسح QR كاميرا' : 'إدخال يدوي'}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-stone-500">
                        {rec.recordedBy}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-stone-400">
                    لم يتم تسجيل عمليات حضور برمز QR اليوم حتى الآن. اضغط على زر فتح قارئ QR لبدء المسح.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
