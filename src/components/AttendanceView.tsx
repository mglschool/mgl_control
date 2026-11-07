import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { api } from '../lib/api';
import { exportAttendanceToExcel, formatGradeArabic, formatAttendanceStatusArabic } from '../lib/export';
import {
  UserCheck,
  Calendar,
  Filter,
  Download,
  Printer,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  students: Student[];
  attendance: AttendanceRecord[];
  onRefresh: () => void;
  onOpenQrScanner: () => void;
}

export const AttendanceView: React.FC<Props> = ({
  students,
  attendance,
  onRefresh,
  onOpenQrScanner
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'daily_sheet' | 'cumulative_report'>('daily_sheet');

  const [editingRecord, setEditingRecord] = useState<{
    studentId: string;
    studentName: string;
    currentStatus: AttendanceStatus;
    notes: string;
  } | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
    if (classFilter !== 'all' && s.sectionClass !== classFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    }
    return true;
  });

  const availableClasses = Array.from(new Set(students.map((s) => s.sectionClass))).sort();

  // Create attendance lookup for selected date
  const recordsForDate = attendance.filter((a) => a.date === selectedDate);
  const recordMap = new Map<string, AttendanceRecord>(recordsForDate.map((r) => [r.studentId, r]));

  // Calculate cumulative stats for each student
  const studentStats = filteredStudents.map((student) => {
    const studentRecords = attendance.filter((a) => a.studentId === student.id);
    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter((a) => a.status === 'present').length;
    const lateDays = studentRecords.filter((a) => a.status === 'late').length;
    const absentDays = studentRecords.filter((a) => a.status === 'absent').length;
    const excusedDays = studentRecords.filter((a) => a.status === 'excused').length;

    const rate = totalDays > 0 ? (((presentDays + lateDays) / totalDays) * 100).toFixed(1) : '100';
    const absenceRate = totalDays > 0 ? ((absentDays / totalDays) * 100).toFixed(1) : '0';

    return {
      student,
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      excusedDays,
      attendanceRate: rate,
      absenceRate
    };
  });

  const handleUpdateStatus = async (studentId: string, newStatus: AttendanceStatus, notes?: string) => {
    try {
      await api.markAttendance({
        studentId,
        date: selectedDate,
        status: newStatus,
        notes: notes || ''
      });
      setEditingRecord(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في تحديث حالة الحضور');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs no-print">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-red-700" />
            <span>كشوف وسجلات الحضور والغياب (Attendance Control)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · تسجيل فوري بـ QR وتوثيق الغياب والتأخير
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportAttendanceToExcel(recordsForDate, students)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الكشف الرسمي</span>
          </button>

          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>فتح قارئ QR الذكي</span>
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          {/* Segmented control for tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
            <button
              onClick={() => setActiveTab('daily_sheet')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'daily_sheet'
                  ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              كشف الحضور اليومي
            </button>
            <button
              onClick={() => setActiveTab('cumulative_report')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'cumulative_report'
                  ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              التقرير التراكمي ونسب الغياب
            </button>
          </div>

          {/* Date Picker */}
          {activeTab === 'daily_sheet' && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                تاريخ الكشف:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
              />
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full pr-9 pl-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
            >
              <option value="all">جميع الصفوف الثانوية</option>
              <option value="grade1">الصف الأول الثانوي</option>
              <option value="grade2">الصف الثاني الثانوي</option>
              <option value="grade3">الصف الثالث الثانوي</option>
            </select>
          </div>

          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
            >
              <option value="all">جميع الفصول</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  فصل {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Print Header (Only visible on paper print) */}
      <div className="hidden print-only text-center border-b-2 border-stone-800 pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-right text-xs">
            <div>جمهورية مصر العربية</div>
            <div>وزارة التربية والتعليم والتعليم الفني</div>
            <div>مديرية التربية والتعليم بالمنيا</div>
            <div>إدارة ملوي التعليمية</div>
          </div>
          <div>
            <img src="/assets/aistudio/logopng_2bf70979.png" alt="Logo" className="w-16 h-16 object-contain mx-auto" />
            <h1 className="text-sm font-black mt-1">مدرسة ملوي الرسمية للغات</h1>
            <p className="text-[10px] font-bold">كنترول المرحلة الثانوية - كشف الحضور والغياب</p>
          </div>
          <div className="text-left text-xs font-mono">
            <div>التاريخ: {selectedDate}</div>
            <div>الصف: {gradeFilter === 'all' ? 'جميع الصفوف' : formatGradeArabic(gradeFilter)}</div>
            <div>الفصل: {classFilter === 'all' ? 'جميع الفصول' : classFilter}</div>
          </div>
        </div>
      </div>

      {/* Daily Sheet View */}
      {activeTab === 'daily_sheet' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 no-print">
            <span>
              كشف حضور يوم <strong className="text-stone-800 dark:text-stone-200 font-mono">{selectedDate}</strong> (إجمالي الطلاب:{' '}
              <strong className="text-red-700 font-mono">{filteredStudents.length}</strong>)
            </span>
            <span className="text-[11px]">يمكنك تغيير الحالة يدويًا بالنقر على أي زر حالة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">#</th>
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف والفصل</th>
                  <th className="p-3 text-center">حالة الحضور</th>
                  <th className="p-3">وقت الحضور</th>
                  <th className="p-3">وقت الانصراف</th>
                  <th className="p-3">طريقة التسجيل</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, index) => {
                    const record = recordMap.get(st.id);
                    const status = record?.status || 'absent'; // default absent if not marked

                    return (
                      <tr key={st.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="p-3 font-mono text-stone-400">{index + 1}</td>
                        <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">{st.studentId}</td>
                        <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{st.fullName}</td>
                        <td className="p-3 text-stone-600 dark:text-stone-300">
                          {formatGradeArabic(st.grade)} - فصل {st.sectionClass}
                        </td>
                        <td className="p-3 text-center">
                          {/* Status buttons */}
                          <div className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl no-print">
                            <button
                              onClick={() => handleUpdateStatus(st.id, 'present')}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(st.id, 'late')}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                status === 'late'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                              }`}
                            >
                              متأخر
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(st.id, 'absent')}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                status === 'absent'
                                  ? 'bg-red-700 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                              }`}
                            >
                              غائب
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(st.id, 'excused')}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                status === 'excused'
                                  ? 'bg-stone-700 text-white shadow-xs'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                              }`}
                            >
                              معذور
                            </button>
                          </div>
                          {/* Print view plain text */}
                          <div className="hidden print-only font-bold">
                            {formatAttendanceStatusArabic(status)}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                          {record?.checkInTime || '-'}
                        </td>
                        <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                          {record?.checkOutTime || '-'}
                        </td>
                        <td className="p-3 text-[11px] text-stone-500">
                          {record?.method === 'qr' ? 'مسح QR' : record ? 'يدوي' : 'لم يسجل'}
                        </td>
                        <td className="p-3 text-[11px] text-stone-500 max-w-xs truncate">
                          {record?.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      لا يوجد طلاب مطابقين للفصل أو الصف المحدد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cumulative Report View */}
      {activeTab === 'cumulative_report' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 no-print">
            <span>
              إحصائيات ونسب الحضور التراكمية لمدرسة ملوي الرسمية للغات (الفصل الدراسي الحالي)
            </span>
            <span className="text-[11px]">يتم احتساب النسبة المئوية تلقائيًا</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب بالكامل</th>
                  <th className="p-3">الصف والفصل</th>
                  <th className="p-3 font-mono text-center">أيام الحضور</th>
                  <th className="p-3 font-mono text-center">مرات التأخير</th>
                  <th className="p-3 font-mono text-center">أيام الغياب</th>
                  <th className="p-3 font-mono text-center">نسبة الحضور</th>
                  <th className="p-3 font-mono text-center">نسبة الغياب</th>
                  <th className="p-3 text-center">التقييم العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {studentStats.map((st) => (
                  <tr key={st.student.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">{st.student.studentId}</td>
                    <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{st.student.fullName}</td>
                    <td className="p-3 text-stone-600 dark:text-stone-300">
                      {formatGradeArabic(st.student.grade)} ({st.student.sectionClass})
                    </td>
                    <td className="p-3 font-mono text-center text-emerald-700 font-bold">{st.presentDays}</td>
                    <td className="p-3 font-mono text-center text-amber-600 font-bold">{st.lateDays}</td>
                    <td className="p-3 font-mono text-center text-red-700 font-bold">{st.absentDays}</td>
                    <td className="p-3 font-mono text-center font-bold">
                      <span className="text-stone-900 dark:text-stone-100">{st.attendanceRate}%</span>
                    </td>
                    <td className="p-3 font-mono text-center font-bold">
                      <span className={Number(st.absenceRate) > 10 ? 'text-red-700' : 'text-stone-500'}>
                        {st.absenceRate}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          Number(st.attendanceRate) >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : Number(st.attendanceRate) >= 75
                            ? 'bg-stone-100 text-stone-700'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {Number(st.attendanceRate) >= 90 ? 'ممتاز' : Number(st.attendanceRate) >= 75 ? 'منتظم' : 'تنبيه غياب'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Signature block */}
      <div className="hidden print-only mt-12 pt-6 border-t border-stone-400">
        <div className="flex justify-between items-center text-xs font-bold px-8">
          <div className="text-center">
            <div>مسؤول شؤون الطلاب والكنترول</div>
            <div className="mt-12">....................................</div>
          </div>
          <div className="text-center">
            <div>وكيل المرحلة الثانوية</div>
            <div className="mt-12">....................................</div>
          </div>
          <div className="text-center">
            <div>مدير مدرسة ملوي الرسمية للغات</div>
            <div className="mt-12">....................................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
