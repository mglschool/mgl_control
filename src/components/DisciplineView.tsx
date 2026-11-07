import React, { useState } from 'react';
import { Student, DisciplineRecord } from '../types';
import { api } from '../lib/api';
import { formatGradeArabic } from '../lib/export';
import {
  ShieldAlert,
  Award,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  User,
  Calendar,
  FileText
} from 'lucide-react';

interface Props {
  students: Student[];
  discipline: DisciplineRecord[];
  onRefresh: () => void;
}

export const DisciplineView: React.FC<Props> = ({
  students,
  discipline,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [type, setType] = useState<DisciplineRecord['type']>('positive');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRecords = discipline.filter((d) => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const st = students.find((s) => s.id === d.studentId);
      return (
        d.title.toLowerCase().includes(q) ||
        d.details.toLowerCase().includes(q) ||
        (st && st.fullName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedStudentId) return;

    setIsSubmitting(true);
    try {
      await api.createDiscipline({
        studentId: selectedStudentId,
        type,
        title: title.trim(),
        details: details.trim(),
        actionTaken: actionTaken.trim()
      });
      setShowAddModal(false);
      setTitle('');
      setDetails('');
      setActionTaken('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ السجل السلوكي');
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
            <ShieldAlert className="w-5 h-5 text-red-700" />
            <span>سجل الالتزام والانضباط المدرسي (Discipline & Behavior)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · توثيق الإنذارات، المخالفات، والإشادات وشهادات التقدير
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل واقعة / شهادة تقدير</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الطالب أو نوع المخالفة/التقدير..."
            className="w-full pr-9 pl-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold"
          >
            <option value="all">جميع الأنواع السلوكية</option>
            <option value="certificate">شهادات تقدير وتفوق</option>
            <option value="positive">ملاحظات إيجابية</option>
            <option value="warning">إنذارات وتنبيهات</option>
            <option value="infraction">مخالفات مدرسية</option>
            <option value="pedagogical_action">إجراءات تربوية</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((item) => {
            const student = students.find((s) => s.id === item.studentId);
            const isPositive = item.type === 'positive' || item.type === 'certificate';

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-stone-900 p-5 rounded-2xl border shadow-xs transition-colors ${
                  isPositive
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-red-200 dark:border-red-900/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold text-stone-500">
                        {item.type === 'certificate'
                          ? 'شهادة تقدير وتفوق'
                          : item.type === 'positive'
                          ? 'إشادة وسلوك إيجابي'
                          : item.type === 'warning'
                          ? 'إنذار رسمي'
                          : 'مخالفة انضباطية'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-mono text-xs text-stone-500">
                    {item.date}
                  </div>
                </div>

                <div className="my-3 space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-xs">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      الطالب: {student?.fullName || '-'}
                    </span>
                    <span className="text-stone-500 font-mono text-[11px]">
                      ({student?.studentId} - فصل {student?.sectionClass})
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {item.details}
                  </p>

                  {item.actionTaken && (
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300">
                      <strong>الإجراء التربوي المتخذ:</strong> {item.actionTaken}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800 pt-2 flex justify-between">
                  <span>تم التوثيق بواسطة: {item.recordedBy}</span>
                  <span>مدرسة ملوي الرسمية للغات</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-10 text-center text-xs text-stone-400 border border-stone-200 dark:border-stone-800">
            لا توجد سجلات انضباطية مطابقة للبحث.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
              تسجيل واقعة سلوكية أو تكريم
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 mt-4 text-right">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">الطالب المعني *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
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
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">نوع السجل</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                >
                  <option value="positive">إشادة وسلوك إيجابي</option>
                  <option value="certificate">شهادة تقدير وتفوق</option>
                  <option value="warning">إنذار وتنبيه</option>
                  <option value="infraction">مخالفة انضباطية</option>
                  <option value="pedagogical_action">إجراء تربوي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">عنوان الواقعة / التكريم *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تفوق دراسي أو عدم الالتزام بالزي المدرسي"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">التفاصيل والوقائع</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="شرح الواقعة وما تم من الطالب..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">الإجراء التربوي المتخذ</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="مثال: استدعاء ولي الأمر أو تكريم في الإذاعة المدرسية"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
