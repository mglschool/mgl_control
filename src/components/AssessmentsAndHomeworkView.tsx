import React, { useState } from 'react';
import { Student, Subject, Assessment, Homework, GradeLevel } from '../types';
import { api } from '../lib/api';
import { formatGradeArabic } from '../lib/export';
import {
  Sparkles,
  BookMarked,
  Plus,
  CheckCircle2,
  Calendar,
  User,
  Filter,
  Search,
  MessageSquare,
  FileCheck
} from 'lucide-react';

interface Props {
  students: Student[];
  subjects: Subject[];
  assessments: Assessment[];
  homeworks: Homework[];
  onRefresh: () => void;
}

export const AssessmentsAndHomeworkView: React.FC<Props> = ({
  students,
  subjects,
  assessments,
  homeworks,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'assessments' | 'homework'>('assessments');

  // New Assessment Form
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [assStudentId, setAssStudentId] = useState(students[0]?.id || '');
  const [assCategory, setAssCategory] = useState<Assessment['category']>('participation');
  const [assTitle, setAssTitle] = useState('');
  const [assScore, setAssScore] = useState('ممتاز');
  const [assNotes, setAssNotes] = useState('');

  // New Homework Form
  const [showAddHw, setShowAddHw] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwSubjectId, setHwSubjectId] = useState(subjects[0]?.id || '');
  const [hwGrade, setHwGrade] = useState<GradeLevel>('grade1');
  const [hwClass, setHwClass] = useState('1/1');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assTitle.trim() || !assStudentId) return;

    setIsSubmitting(true);
    try {
      await api.createAssessment({
        studentId: assStudentId,
        category: assCategory,
        titleAr: assTitle.trim(),
        scoreOrGrade: assScore,
        notes: assNotes.trim()
      });
      setShowAddAssessment(false);
      setAssTitle('');
      setAssNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createHomework({
        title: hwTitle.trim(),
        subjectId: hwSubjectId,
        grade: hwGrade,
        sectionClass: hwClass,
        description: hwDesc.trim(),
        dueDate: hwDueDate
      });
      setShowAddHw(false);
      setHwTitle('');
      setHwDesc('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الواجب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-700" />
            <span>التقييمات الصفية والواجبات المدرسية</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · قياس تفاعل الطلاب والواجبات والتطبيقات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'assessments' ? (
            <button
              onClick={() => setShowAddAssessment(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تقييم لطالب</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddHw(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة واجب مدرسي</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'assessments'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          سجل تقييم الطلاب
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'homework'
              ? 'bg-white dark:bg-stone-700 text-red-700 dark:text-red-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
          }`}
        >
          الواجبات والتكليفات
        </button>
      </div>

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessments.map((ass) => {
              const student = students.find((s) => s.id === ass.studentId);
              return (
                <div
                  key={ass.id}
                  className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
                        {ass.category === 'participation'
                          ? 'المشاركة الصفية'
                          : ass.category === 'interaction'
                          ? 'التفاعل الصفي'
                          : ass.category === 'academic'
                          ? 'المستوى الأكاديمي'
                          : 'أداء الطالب'}
                      </span>
                      <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                        {ass.titleAr}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-black rounded-lg border border-red-200 dark:border-red-900">
                      {ass.scoreOrGrade}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-xs">
                    <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {student?.fullName || 'طالب مدرسة ملوي'}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">
                      ({student?.studentId} - فصل {student?.sectionClass})
                    </span>
                  </div>

                  {ass.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50/50 p-2 rounded-lg">
                      {ass.notes}
                    </p>
                  )}

                  <div className="text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800 pt-2 flex items-center justify-between">
                    <span>المقيم: {ass.teacherName}</span>
                    <span className="font-mono">{ass.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworks.map((hw) => {
              const subject = subjects.find((s) => s.id === hw.subjectId);
              return (
                <div
                  key={hw.id}
                  className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        {subject?.nameAr} · {formatGradeArabic(hw.grade)} (فصل {hw.sectionClass})
                      </span>
                      <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                        {hw.title}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                      تسليم: {hw.dueDate}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    {hw.description}
                  </p>

                  <div className="text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800 pt-2 flex items-center justify-between">
                    <span>المعلم: {hw.teacherName}</span>
                    <span>تم تسليم: {hw.submissions?.length || 0} طلاب</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Assessment Modal */}
      {showAddAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
              إضافة تقييم جديد لطالب
            </h3>

            <form onSubmit={handleCreateAssessment} className="space-y-3 mt-4 text-right">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">اختر الطالب *</label>
                <select
                  value={assStudentId}
                  onChange={(e) => setAssStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.studentId} - فصل {st.sectionClass})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">عنصر التقييم</label>
                <select
                  value={assCategory}
                  onChange={(e) => setAssCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                >
                  <option value="participation">المشاركة الصفية والتفاعل</option>
                  <option value="interaction">التفاعل مع المعلم</option>
                  <option value="performance">أداء المهام والتطبيقات</option>
                  <option value="compliance">الالتزام بالتعليمات المدرسية</option>
                  <option value="academic">المستوى الأكاديمي العام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">عنوان التقييم أو النشاط *</label>
                <input
                  type="text"
                  required
                  value={assTitle}
                  onChange={(e) => setAssTitle(e.target.value)}
                  placeholder="مثال: إجابة نموذجية في حصة العلوم المتكاملة"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">الدرجة أو التقدير</label>
                <input
                  type="text"
                  value={assScore}
                  onChange={(e) => setAssScore(e.target.value)}
                  placeholder="مثال: ممتاز أو 10/10 أو A+"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">ملاحظات المعلم</label>
                <textarea
                  rows={2}
                  value={assNotes}
                  onChange={(e) => setAssNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssessment(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  حفظ التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      {showAddHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
              إضافة واجب مدرسي جديد
            </h3>

            <form onSubmit={handleCreateHomework} className="space-y-3 mt-4 text-right">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">عنوان الواجب *</label>
                <input
                  type="text"
                  required
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="مثال: حل شيت الوحدة الأولى"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">المادة</label>
                  <select
                    value={hwSubjectId}
                    onChange={(e) => setHwSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">الصف</label>
                  <select
                    value={hwGrade}
                    onChange={(e) => setHwGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  >
                    <option value="grade1">الصف الأول الثانوي</option>
                    <option value="grade2">الصف الثاني الثانوي</option>
                    <option value="grade3">الصف الثالث الثانوي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">الفصل</label>
                  <input
                    type="text"
                    required
                    value={hwClass}
                    onChange={(e) => setHwClass(e.target.value)}
                    placeholder="1/1"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">آخر موعد للتسليم</label>
                  <input
                    type="date"
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">تفاصيل ومحتوى الواجب</label>
                <textarea
                  rows={3}
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  placeholder="الصفحات المطلوبة، أسئلة الواجب والتعليمات..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHw(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  نشر الواجب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
