import React, { useState } from 'react';
import { Student, AttendanceRecord, GradeRecord, Subject } from '../types';
import {
  exportStudentsToExcel,
  exportAttendanceToExcel,
  exportGradesToExcel,
  formatGradeArabic
} from '../lib/export';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Filter,
  GraduationCap,
  Users,
  Award,
  ShieldAlert
} from 'lucide-react';

interface Props {
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  subjects: Subject[];
}

export const ReportsView: React.FC<Props> = ({
  students,
  attendance,
  grades,
  subjects
}) => {
  const [selectedReport, setSelectedReport] = useState<'attendance' | 'grades' | 'students' | 'behavior'>('attendance');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const filteredStudents = students.filter((s) => {
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
    if (selectedClass !== 'all' && s.sectionClass !== selectedClass) return false;
    return true;
  });

  const availableClasses = Array.from(new Set(students.map((s) => s.sectionClass))).sort();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-700" />
              <span>مركز التقارير والشهادات الرسمية (Official Reports & Exports)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              مدرسة ملوي الرسمية للغات · استخراج ملفات PDF رسمية قابلة للطباعة وشيتات Excel معتمدة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير الحالي (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center gap-4 no-print">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">نوع التقرير:</label>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value as any)}
            className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
          >
            <option value="attendance">كشف الحضور والغياب الرسمي</option>
            <option value="grades">كشف الدرجات والترتيب العام</option>
            <option value="students">سجل قيد طلاب المرحلة الثانوية</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">الصف:</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
          >
            <option value="all">جميع الصفوف</option>
            <option value="grade1">الصف الأول الثانوي</option>
            <option value="grade2">الصف الثاني الثانوي</option>
            <option value="grade3">الصف الثالث الثانوي</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">الفصل:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
          >
            <option value="all">جميع الفصول</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                فصل {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="mr-auto">
          {selectedReport === 'students' && (
            <button
              onClick={() => exportStudentsToExcel(filteredStudents)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل Excel</span>
            </button>
          )}
          {selectedReport === 'attendance' && (
            <button
              onClick={() => exportAttendanceToExcel(attendance, filteredStudents)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل Excel</span>
            </button>
          )}
          {selectedReport === 'grades' && (
            <button
              onClick={() => exportGradesToExcel(grades, filteredStudents, subjects)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-stone-200 shadow-sm text-stone-900 print:border-none print:shadow-none print:p-0">
        {/* Official Header */}
        <div className="flex justify-between items-start border-b-2 border-stone-800 pb-5 mb-6">
          <div className="text-right text-xs space-y-0.5">
            <div className="font-bold text-stone-900">جمهورية مصر العربية</div>
            <div>وزارة التربية والتعليم والتعليم الفني</div>
            <div>مديرية التربية والتعليم بمحافظة المنيا</div>
            <div>إدارة ملوي التعليمية</div>
          </div>

          <div className="text-center">
            <img
              src="/assets/aistudio/logopng_2bf70979.png"
              alt="Official Logo"
              className="w-20 h-20 object-contain mx-auto"
            />
            <h1 className="text-base font-black text-red-900 mt-1">مدرسة ملوي الرسمية للغات</h1>
            <p className="text-xs font-bold text-stone-600 font-mono">
              Mallawi Governmental Language School
            </p>
            <div className="text-xs font-black text-stone-900 mt-1 px-4 py-0.5 rounded-full bg-stone-100 inline-block border border-stone-300">
              Secondary Control -{' '}
              {selectedReport === 'attendance'
                ? 'كشف الحضور والغياب الرسمي'
                : selectedReport === 'grades'
                ? 'كشف الدرجات ونتائج الكنترول'
                : 'كشف قيد الطلاب وسجل الأحوال'}
            </div>
          </div>

          <div className="text-left text-xs space-y-0.5 font-mono">
            <div>العام الدراسي: 2026 / 2027</div>
            <div>تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}</div>
            <div>
              الصف: {selectedGrade === 'all' ? 'جميع الصفوف' : formatGradeArabic(selectedGrade)}
            </div>
            <div>الفصل: {selectedClass === 'all' ? 'جميع الفصول' : selectedClass}</div>
          </div>
        </div>

        {/* Content depending on report */}
        {selectedReport === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-stone-300">
              <thead>
                <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-300">
                  <th className="p-2 border border-stone-300">م</th>
                  <th className="p-2 border border-stone-300">كود الطالب</th>
                  <th className="p-2 border border-stone-300">اسم الطالب</th>
                  <th className="p-2 border border-stone-300">الصف والفصل</th>
                  <th className="p-2 border border-stone-300 text-center">أيام الحضور</th>
                  <th className="p-2 border border-stone-300 text-center">مرات التأخير</th>
                  <th className="p-2 border border-stone-300 text-center">أيام الغياب</th>
                  <th className="p-2 border border-stone-300 text-center">نسبة الحضور</th>
                  <th className="p-2 border border-stone-300 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredStudents.map((st, i) => {
                  const stAttendance = attendance.filter((a) => a.studentId === st.id);
                  const present = stAttendance.filter((a) => a.status === 'present').length;
                  const late = stAttendance.filter((a) => a.status === 'late').length;
                  const absent = stAttendance.filter((a) => a.status === 'absent').length;
                  const total = stAttendance.length;
                  const pct = total > 0 ? (((present + late) / total) * 100).toFixed(0) : '100';

                  return (
                    <tr key={st.id} className="even:bg-stone-50">
                      <td className="p-2 border border-stone-300 font-mono">{i + 1}</td>
                      <td className="p-2 border border-stone-300 font-mono font-bold">{st.studentId}</td>
                      <td className="p-2 border border-stone-300 font-bold">{st.fullName}</td>
                      <td className="p-2 border border-stone-300">
                        {formatGradeArabic(st.grade)} ({st.sectionClass})
                      </td>
                      <td className="p-2 border border-stone-300 font-mono text-center">{present}</td>
                      <td className="p-2 border border-stone-300 font-mono text-center">{late}</td>
                      <td className="p-2 border border-stone-300 font-mono text-center">{absent}</td>
                      <td className="p-2 border border-stone-300 font-mono text-center font-bold">{pct}%</td>
                      <td className="p-2 border border-stone-300 text-center text-[11px] font-bold">
                        {Number(pct) >= 85 ? 'منتظم' : 'تنبيه غياب'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'grades' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-stone-300">
              <thead>
                <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-300">
                  <th className="p-2 border border-stone-300">الترتيب</th>
                  <th className="p-2 border border-stone-300">كود الطالب</th>
                  <th className="p-2 border border-stone-300">اسم الطالب</th>
                  <th className="p-2 border border-stone-300">الفصل</th>
                  <th className="p-2 border border-stone-300 text-center font-mono">المجموع الكلي</th>
                  <th className="p-2 border border-stone-300 text-center font-mono">النسبة المئوية</th>
                  <th className="p-2 border border-stone-300 text-center">التقدير العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredStudents.map((st, i) => {
                  const stGrades = grades.filter((g) => g.studentId === st.id);
                  const total = stGrades.reduce((sum, g) => sum + g.score, 0);
                  const max = stGrades.reduce((sum, g) => sum + g.maxScore, 0);
                  const pct = max > 0 ? ((total / max) * 100).toFixed(1) : '0';

                  return (
                    <tr key={st.id} className="even:bg-stone-50">
                      <td className="p-2 border border-stone-300 font-mono font-bold text-center">{i + 1}</td>
                      <td className="p-2 border border-stone-300 font-mono font-bold">{st.studentId}</td>
                      <td className="p-2 border border-stone-300 font-bold">{st.fullName}</td>
                      <td className="p-2 border border-stone-300">{st.sectionClass}</td>
                      <td className="p-2 border border-stone-300 font-mono text-center font-bold">{total} / {max}</td>
                      <td className="p-2 border border-stone-300 font-mono text-center font-black text-red-900">{pct}%</td>
                      <td className="p-2 border border-stone-300 text-center font-bold text-[11px]">
                        {Number(pct) >= 85
                          ? 'ممتاز'
                          : Number(pct) >= 75
                          ? 'جيد جدًا'
                          : Number(pct) >= 65
                          ? 'جيد'
                          : 'مقبول'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-stone-300">
              <thead>
                <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-300">
                  <th className="p-2 border border-stone-300">م</th>
                  <th className="p-2 border border-stone-300">كود الطالب</th>
                  <th className="p-2 border border-stone-300">اسم الطالب</th>
                  <th className="p-2 border border-stone-300">الرقم القومي</th>
                  <th className="p-2 border border-stone-300">الصف والفصل</th>
                  <th className="p-2 border border-stone-300">ولي الأمر والهاتف</th>
                  <th className="p-2 border border-stone-300">العنوان</th>
                  <th className="p-2 border border-stone-300 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredStudents.map((st, i) => (
                  <tr key={st.id} className="even:bg-stone-50">
                    <td className="p-2 border border-stone-300 font-mono">{i + 1}</td>
                    <td className="p-2 border border-stone-300 font-mono font-bold">{st.studentId}</td>
                    <td className="p-2 border border-stone-300 font-bold">{st.fullName}</td>
                    <td className="p-2 border border-stone-300 font-mono">{st.nationalId || '-'}</td>
                    <td className="p-2 border border-stone-300">
                      {formatGradeArabic(st.grade)} - فصل {st.sectionClass}
                    </td>
                    <td className="p-2 border border-stone-300">
                      <div>{st.parentName || '-'}</div>
                      <div className="font-mono text-[10px] text-stone-500">{st.parentPhone || '-'}</div>
                    </td>
                    <td className="p-2 border border-stone-300">{st.address || '-'}</td>
                    <td className="p-2 border border-stone-300 text-center font-bold text-[11px]">
                      {st.status === 'enrolled' ? 'مستمر' : 'منقول'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signatures Footer */}
        <div className="mt-12 pt-6 border-t border-stone-400 flex justify-between text-xs font-bold px-8">
          <div className="text-center">
            <div>عضو الكنترول المسؤول</div>
            <div className="mt-10">..................................</div>
          </div>
          <div className="text-center">
            <div>رئيس كنترول المرحلة الثانوية</div>
            <div className="mt-10">..................................</div>
          </div>
          <div className="text-center">
            <div>يعتمد / مدير مدرسة ملوي الرسمية للغات</div>
            <div className="mt-10">..................................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
