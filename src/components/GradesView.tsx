import React, { useState } from 'react';
import { Student, Subject, GradeRecord, ExamType, GradeLevel } from '../types';
import { api } from '../lib/api';
import { exportGradesToExcel, formatGradeArabic, formatExamTypeArabic } from '../lib/export';
import {
  Award,
  BookOpen,
  Filter,
  Save,
  Download,
  Printer,
  Search,
  Trophy,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  Eye,
  Sliders,
  ChevronLeft
} from 'lucide-react';

interface Props {
  students: Student[];
  subjects: Subject[];
  grades: GradeRecord[];
  onRefresh: () => void;
}

export const GradesView: React.FC<Props> = ({
  students,
  subjects,
  grades,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'batch_entry' | 'rankings' | 'student_certificate' | 'manage_subjects'>('batch_entry');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('grade1');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sub-1');
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('term1_month1');

  // Batch entry scores in state
  const [inputScores, setInputScores] = useState<Record<string, number | ''>>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Certificate Modal State
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);

  // Subject management state
  const [newSubNameAr, setNewSubNameAr] = useState('');
  const [newSubNameEn, setNewSubNameEn] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubMax, setNewSubMax] = useState('100');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Filter students for the selected grade & class
  const classStudents = students.filter((s) => {
    if (s.grade !== selectedGrade) return false;
    if (selectedClass !== 'all' && s.sectionClass !== selectedClass) return false;
    return true;
  });

  const availableClasses = Array.from(
    new Set(students.filter((s) => s.grade === selectedGrade).map((s) => s.sectionClass))
  ).sort();

  const currentSubject = subjects.find((sub) => sub.id === selectedSubjectId);

  // Populate initial scores when subject/exam/grade changes
  const handleLoadCurrentScores = () => {
    const scores: Record<string, number | ''> = {};
    classStudents.forEach((st) => {
      const g = grades.find(
        (rec) => rec.studentId === st.id && rec.subjectId === selectedSubjectId && rec.examType === selectedExamType
      );
      scores[st.id] = g ? g.score : '';
    });
    setInputScores(scores);
  };

  // Run on mount or selection change
  React.useEffect(() => {
    handleLoadCurrentScores();
  }, [selectedGrade, selectedClass, selectedSubjectId, selectedExamType, grades, students]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = val === '' ? '' : Math.max(0, Math.min(Number(val), currentSubject?.maxScore || 100));
    setInputScores((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveBatch = async () => {
    if (!currentSubject) return;
    setIsSavingBatch(true);
    setSaveSuccessMsg(null);

    const records = Object.entries(inputScores)
      .filter(([_, score]) => score !== '')
      .map(([studentId, score]) => ({
        studentId,
        score: Number(score),
        maxScore: currentSubject.maxScore
      }));

    try {
      await api.saveGradesBatch({
        examType: selectedExamType,
        subjectId: selectedSubjectId,
        records
      });

      setSaveSuccessMsg(`تم حفظ وتحديث درجات ${records.length} طالب بنجاح.`);
      onRefresh();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الدرجات');
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Ranking calculation
  const rankedStudents = students
    .filter((s) => s.grade === selectedGrade && (selectedClass === 'all' || s.sectionClass === selectedClass))
    .map((st) => {
      const studentGrades = grades.filter((g) => g.studentId === st.id);
      const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0);
      const totalMaxScore = studentGrades.reduce((sum, g) => sum + g.maxScore, 0);
      const gpaPercentage = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : '0';

      return {
        student: st,
        totalScore,
        totalMaxScore,
        gpaPercentage: Number(gpaPercentage),
        gradesCount: studentGrades.length
      };
    })
    .sort((a, b) => b.gpaPercentage - a.gpaPercentage);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubNameAr || !newSubCode) return;

    try {
      await api.createSubject({
        nameAr: newSubNameAr.trim(),
        nameEn: newSubNameEn.trim() || newSubNameAr.trim(),
        code: newSubCode.trim().toUpperCase(),
        maxScore: Number(newSubMax) || 100,
        gradeLevels: ['grade1', 'grade2', 'grade3'],
        isElective: false,
        isHidden: false
      });

      setNewSubNameAr('');
      setNewSubNameEn('');
      setNewSubCode('');
      setNewSubMax('100');
      setIsAddingSubject(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في إنشاء المادة');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs no-print">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-red-700" />
            <span>نظام الكنترول ورصد الدرجات (Exams & Grades Control)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · حساب تلقائي للنسب والمجموع الكلي وترتيب أوائل الكنترول
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportGradesToExcel(grades, students, subjects)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير درجات الكنترول Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الشهادة الرسمية</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit no-print">
        <button
          onClick={() => setActiveTab('batch_entry')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'batch_entry'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          شيت رصد الدرجات للمادة
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'rankings'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          أوائل الكنترول والترتيب العام
        </button>
        <button
          onClick={() => setActiveTab('manage_subjects')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'manage_subjects'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          المواد والدرجات النهائية
        </button>
      </div>

      {/* Tab 1: Batch Score Entry */}
      {activeTab === 'batch_entry' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 no-print">
            {/* Grade */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">الصف الدراسي</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-bold focus:outline-hidden focus:ring-2 focus:ring-red-600"
              >
                <option value="grade1">الصف الأول الثانوي</option>
                <option value="grade2">الصف الثاني الثانوي</option>
                <option value="grade3">الصف الثالث الثانوي</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">الفصل</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-bold focus:outline-hidden focus:ring-2 focus:ring-red-600"
              >
                <option value="all">جميع فصول الصف</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    فصل {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">المادة الدراسية</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-bold focus:outline-hidden focus:ring-2 focus:ring-red-600"
              >
                {subjects
                  .filter((sub) => !sub.isHidden)
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameAr} (النهائية: {sub.maxScore})
                    </option>
                  ))}
              </select>
            </div>

            {/* Exam */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">الامتحان / الاختبار</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value as ExamType)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-bold focus:outline-hidden focus:ring-2 focus:ring-red-600"
              >
                <option value="term1_month1">الترم الأول: اختبار الشهر 1</option>
                <option value="term1_month2">الترم الأول: اختبار الشهر 2</option>
                <option value="term1_midyear">الترم الأول: امتحان نصف العام</option>
                <option value="term2_month1">الترم الثاني: اختبار الشهر 1</option>
                <option value="term2_month2">الترم الثاني: اختبار الشهر 2</option>
                <option value="term2_final">الترم الثاني: امتحان آخر العام</option>
              </select>
            </div>
          </div>

          {/* Alert of success */}
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {currentSubject?.nameAr} - {formatExamTypeArabic(selectedExamType)}
                </span>
                <span>(الدرجة العظمى: <strong className="font-mono text-red-700">{currentSubject?.maxScore}</strong>)</span>
              </div>
              <button
                onClick={handleSaveBatch}
                disabled={isSavingBatch}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingBatch ? 'جارٍ الحفظ...' : 'حفظ درجات الكنترول'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                    <th className="p-3">#</th>
                    <th className="p-3">كود الطالب</th>
                    <th className="p-3">اسم الطالب بالكامل</th>
                    <th className="p-3">الفصل</th>
                    <th className="p-3 text-center">الدرجة المكتسبة (من {currentSubject?.maxScore})</th>
                    <th className="p-3 font-mono text-center">النسبة المئوية</th>
                    <th className="p-3 text-center">التقدير</th>
                    <th className="p-3 text-center">شهادة الطالب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {classStudents.length > 0 ? (
                    classStudents.map((st, i) => {
                      const val = inputScores[st.id];
                      const numVal = typeof val === 'number' ? val : 0;
                      const max = currentSubject?.maxScore || 100;
                      const pct = val !== '' && val !== undefined ? ((numVal / max) * 100).toFixed(1) : '-';

                      let rating = '-';
                      if (pct !== '-') {
                        const numPct = Number(pct);
                        if (numPct >= 85) rating = 'ممتاز (A)';
                        else if (numPct >= 75) rating = 'جيد جدًا (B)';
                        else if (numPct >= 65) rating = 'جيد (C)';
                        else if (numPct >= 50) rating = 'مقبول (D)';
                        else rating = 'دون المستوى (F)';
                      }

                      return (
                        <tr key={st.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="p-3 font-mono text-stone-400">{i + 1}</td>
                          <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">{st.studentId}</td>
                          <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{st.fullName}</td>
                          <td className="p-3 text-stone-600 dark:text-stone-300 font-bold">فصل {st.sectionClass}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={currentSubject?.maxScore || 100}
                              step="0.5"
                              value={val !== undefined ? val : ''}
                              onChange={(e) => handleScoreChange(st.id, e.target.value)}
                              placeholder={`0 - ${currentSubject?.maxScore}`}
                              className="w-24 px-2.5 py-1.5 text-center font-mono font-bold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                            />
                          </td>
                          <td className="p-3 font-mono text-center font-bold text-stone-800 dark:text-stone-200">
                            {pct !== '-' ? `${pct}%` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                rating.includes('ممتاز')
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rating.includes('دون')
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {rating}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedStudentForCert(st)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              عرض الشهادة
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400">
                        لا يوجد طلاب في الصف أو الفصل المحدد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rankings & Top Students */}
      {activeTab === 'rankings' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  لوحة الشرف وأوائل الكنترول - مدرسة ملوي الرسمية للغات
                </h3>
                <p className="text-xs text-stone-500">حساب النسبة المئوية = (مجموع درجات الطالب ÷ مجموع الدرجات النهائية) × 100</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
              >
                <option value="grade1">الصف الأول الثانوي</option>
                <option value="grade2">الصف الثاني الثانوي</option>
                <option value="grade3">الصف الثالث الثانوي</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankedStudents.slice(0, 3).map((item, idx) => (
              <div
                key={item.student.id}
                className={`p-5 rounded-2xl border text-center relative overflow-hidden ${
                  idx === 0
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : idx === 1
                    ? 'bg-stone-50 dark:bg-stone-800/40 border-stone-300 dark:border-stone-700'
                    : 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center mx-auto mb-2 text-lg font-black">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>
                <div className="text-xs font-bold text-stone-500">
                  {idx === 0 ? 'المركز الأول' : idx === 1 ? 'المركز الثاني' : 'المركز الثالث'}
                </div>
                <div className="text-sm font-black text-stone-900 dark:text-stone-100 mt-1">
                  {item.student.fullName}
                </div>
                <div className="text-xs text-stone-500 mt-0.5 font-mono">
                  {item.student.studentId} · فصل {item.student.sectionClass}
                </div>
                <div className="mt-3 text-2xl font-black font-mono text-red-700 dark:text-red-400">
                  {item.gpaPercentage}%
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  المجموع: {item.totalScore} من {item.totalMaxScore}
                </div>
              </div>
            ))}
          </div>

          {/* Full rankings table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3 text-center">الترتيب</th>
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الفصل</th>
                  <th className="p-3 font-mono text-center">مجموع الدرجات</th>
                  <th className="p-3 font-mono text-center">الدرجة العظمى</th>
                  <th className="p-3 font-mono text-center">النسبة المئوية النهائية</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {rankedStudents.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="p-3 font-mono font-bold text-center text-stone-700 dark:text-stone-300">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">
                      {item.student.studentId}
                    </td>
                    <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                      {item.student.fullName}
                    </td>
                    <td className="p-3 text-stone-600 dark:text-stone-300 font-bold">
                      فصل {item.student.sectionClass}
                    </td>
                    <td className="p-3 font-mono text-center font-bold text-stone-800 dark:text-stone-200">
                      {item.totalScore}
                    </td>
                    <td className="p-3 font-mono text-center text-stone-500">
                      {item.totalMaxScore}
                    </td>
                    <td className="p-3 font-mono text-center font-extrabold text-red-700 dark:text-red-400">
                      {item.gpaPercentage}%
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedStudentForCert(item.student)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        عرض الشهادة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Subjects Management */}
      {activeTab === 'manage_subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                قائمة المواد الدراسية للمرحلة الثانوية
              </h3>
              <p className="text-xs text-stone-500">
                يمكن لإدارة الكنترول تعديل الدرجة النهائية لكل مادة وإضافة مواد جديدة
              </p>
            </div>
            <button
              onClick={() => setIsAddingSubject(!isAddingSubject)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مادة جديدة</span>
            </button>
          </div>

          {isAddingSubject && (
            <form onSubmit={handleCreateSubject} className="bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">اسم المادة بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={newSubNameAr}
                    onChange={(e) => setNewSubNameAr(e.target.value)}
                    placeholder="مثال: الفلسفة والمنطق"
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">اسم المادة بالإنجليزية</label>
                  <input
                    type="text"
                    value={newSubNameEn}
                    onChange={(e) => setNewSubNameEn(e.target.value)}
                    placeholder="Philosophy & Logic"
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">كود المادة *</label>
                  <input
                    type="text"
                    required
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="PHIL"
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">الدرجة النهائية العظمى</label>
                  <input
                    type="number"
                    value={newSubMax}
                    onChange={(e) => setNewSubMax(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  حفظ المادة
                </button>
              </div>
            </form>
          )}

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">كود المادة</th>
                  <th className="p-3">اسم المادة (عربي)</th>
                  <th className="p-3">اسم المادة (إنجليزي)</th>
                  <th className="p-3 font-mono text-center">الدرجة النهائية</th>
                  <th className="p-3">الصفوف المطبقة عليها</th>
                  <th className="p-3">النوع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">{sub.code}</td>
                    <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{sub.nameAr}</td>
                    <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{sub.nameEn}</td>
                    <td className="p-3 font-mono font-bold text-center text-stone-900 dark:text-stone-100">{sub.maxScore}</td>
                    <td className="p-3 text-stone-500">
                      {sub.gradeLevels.map((gl) => formatGradeArabic(gl)).join(' · ')}
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] font-bold text-stone-600">
                        {sub.isElective ? 'مادة اختيارية' : 'مادة أساسية'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Student Certificate Modal / Print */}
      {selectedStudentForCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 text-stone-900">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 no-print">
              <span className="text-xs font-bold text-stone-500">بيان درجات وشهادة تفوق رسمية</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الشهادة الرسمية</span>
                </button>
                <button
                  onClick={() => setSelectedStudentForCert(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Certificate Document Content */}
            <div className="mt-4 border-4 border-double border-red-900/60 p-6 sm:p-8 rounded-2xl relative bg-radial from-white to-stone-50">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-red-800 pb-4 mb-5">
                <div className="text-right text-xs space-y-0.5">
                  <div className="font-bold text-stone-900">جمهورية مصر العربية</div>
                  <div>وزارة التربية والتعليم والتعليم الفني</div>
                  <div>مديرية التربية والتعليم بالمنيا</div>
                  <div>إدارة ملوي التعليمية</div>
                </div>

                <div className="text-center">
                  <img
                    src="/assets/aistudio/logopng_2bf70979.png"
                    alt="Logo"
                    className="w-20 h-20 object-contain mx-auto"
                  />
                  <h2 className="text-sm font-black text-red-800 mt-1">مدرسة ملوي الرسمية للغات</h2>
                  <div className="text-[11px] font-bold text-stone-600 font-mono">
                    Mallawi Governmental Language School
                  </div>
                  <div className="text-xs font-extrabold text-stone-800 mt-1 bg-stone-100 px-3 py-0.5 rounded-full inline-block border border-stone-200">
                    كنترول المرحلة الثانوية - بيان درجات رسمي
                  </div>
                </div>

                <div className="text-left text-xs space-y-0.5 font-mono">
                  <div>العام الدراسي: 2026 / 2027</div>
                  <div>تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}</div>
                  <div className="text-red-700 font-bold">كود: {selectedStudentForCert.studentId}</div>
                </div>
              </div>

              {/* Student Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-stone-100/80 rounded-xl mb-5 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px]">اسم الطالب:</span>
                  <strong className="text-stone-900">{selectedStudentForCert.fullName}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">الصف الدراسي:</span>
                  <strong className="text-stone-900">{formatGradeArabic(selectedStudentForCert.grade)}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">الفصل:</span>
                  <strong className="text-stone-900">فصل {selectedStudentForCert.sectionClass}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">الرقم القومي:</span>
                  <strong className="font-mono text-stone-900">{selectedStudentForCert.nationalId || '-'}</strong>
                </div>
              </div>

              {/* Grades Table */}
              <table className="w-full text-right text-xs border border-stone-300">
                <thead>
                  <tr className="bg-red-800 text-white font-bold">
                    <th className="p-2 border border-red-900">المادة الدراسية</th>
                    <th className="p-2 border border-red-900 text-center font-mono">الدرجة العظمى</th>
                    <th className="p-2 border border-red-900 text-center font-mono">الدرجة الحاصل عليها</th>
                    <th className="p-2 border border-red-900 text-center font-mono">النسبة المئوية</th>
                    <th className="p-2 border border-red-900 text-center">التقدير العام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {subjects.map((sub) => {
                    const rec = grades.find(
                      (g) => g.studentId === selectedStudentForCert.id && g.subjectId === sub.id
                    );
                    const score = rec ? rec.score : 0;
                    const max = rec ? rec.maxScore : sub.maxScore;
                    const pct = max > 0 ? ((score / max) * 100).toFixed(1) : '0';

                    return (
                      <tr key={sub.id} className="even:bg-stone-50">
                        <td className="p-2 border border-stone-200 font-bold">{sub.nameAr}</td>
                        <td className="p-2 border border-stone-200 font-mono text-center">{max}</td>
                        <td className="p-2 border border-stone-200 font-mono text-center font-bold text-red-800">{rec ? score : '-'}</td>
                        <td className="p-2 border border-stone-200 font-mono text-center font-bold">{rec ? `${pct}%` : '-'}</td>
                        <td className="p-2 border border-stone-200 text-center text-[11px] font-bold">
                          {!rec
                            ? '-'
                            : Number(pct) >= 85
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

              {/* Signatures */}
              <div className="mt-8 pt-6 border-t border-stone-300 flex justify-between text-xs font-bold text-stone-800 px-4">
                <div className="text-center">
                  <div>مسؤول الكنترول والرصد</div>
                  <div className="mt-8">..................................</div>
                </div>
                <div className="text-center">
                  <div>رئيس لجنة النظام والمراقبة</div>
                  <div className="mt-8">..................................</div>
                </div>
                <div className="text-center">
                  <div>يعتمد / مدير المدرسة</div>
                  <div className="mt-8">..................................</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
