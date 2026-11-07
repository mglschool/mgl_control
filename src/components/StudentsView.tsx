import React, { useState, useRef } from 'react';
import { Student, GradeLevel } from '../types';
import { api } from '../lib/api';
import { exportStudentsToExcel, parseStudentsExcelFile, formatGradeArabic } from '../lib/export';
import { StudentIdCardModal } from './StudentIdCardModal';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Home,
  GraduationCap
} from 'lucide-react';

interface Props {
  students: Student[];
  onRefresh: () => void;
}

export const StudentsView: React.FC<Props> = ({ students, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [unifiedEmail, setUnifiedEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [grade, setGrade] = useState<GradeLevel>('grade1');
  const [sectionClass, setSectionClass] = useState('1/1');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Student['status']>('enrolled');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedImportRows, setParsedImportRows] = useState<any[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [importReport, setImportReport] = useState<{
    addedCount: number;
    duplicatesCount: number;
    errors: string[];
  } | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
    if (classFilter !== 'all' && s.sectionClass !== classFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.nationalId && s.nationalId.includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.parentName && s.parentName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const availableClasses = Array.from(new Set(students.map((s) => s.sectionClass))).sort();

  const resetForm = () => {
    setFullName('');
    setNationalId('');
    setUnifiedEmail('');
    setPhone('');
    setBirthDate('');
    setGender('male');
    setGrade('grade1');
    setSectionClass('1/1');
    setParentName('');
    setParentPhone('');
    setAddress('');
    setStatus('enrolled');
    setEditingStudent(null);
    setErrorMsg(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setNationalId(student.nationalId || '');
    setUnifiedEmail(student.unifiedEmail || '');
    setPhone(student.phone || '');
    setBirthDate(student.birthDate || '');
    setGender(student.gender || 'male');
    setGrade(student.grade);
    setSectionClass(student.sectionClass);
    setParentName(student.parentName || '');
    setParentPhone(student.parentPhone || '');
    setAddress(student.address || '');
    setStatus(student.status);
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال اسم الطالب');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        nationalId: nationalId.trim(),
        unifiedEmail: unifiedEmail.trim(),
        phone: phone.trim(),
        birthDate,
        gender,
        grade,
        sectionClass,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        address: address.trim(),
        status
      };

      if (editingStudent) {
        await api.updateStudent(editingStudent.id, payload);
      } else {
        await api.createStudent(payload);
      }

      setShowAddModal(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في حفظ بيانات الطالب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطالب (${name}) من قاعدة بيانات الكنترول؟`)) return;
    try {
      await api.deleteStudent(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الطالب');
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setImportReport(null);

    try {
      const rows = await parseStudentsExcelFile(file);
      setParsedImportRows(rows);
    } catch (err: any) {
      alert('تعذر قراءة ملف Excel. تأكد من صحة الملف.');
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedImportRows.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await api.bulkImportStudents(parsedImportRows);
      setImportReport({
        addedCount: res.addedCount,
        duplicatesCount: res.duplicatesCount,
        errors: res.errors
      });
      setParsedImportRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل استيراد البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-700" />
            <span>قاعدة بيانات شؤون الطلاب (Students Database)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            مدرسة ملوي الرسمية للغات · المرحلة الثانوية (الصفوف الأول والثاني والثالث الثانوي)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => {
              setParsedImportRows([]);
              setImportReport(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد ملف Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، كود الطالب، أو الرقم القومي..."
            className="w-full pr-9 pl-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
          />
        </div>

        {/* Grade Filter */}
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

        {/* Class Filter */}
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

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
          >
            <option value="all">جميع الحالات الدراسية</option>
            <option value="enrolled">مستمر (مقيد)</option>
            <option value="transferred_in">محول للمدرسة</option>
            <option value="transferred_out">منقول</option>
            <option value="graduated">متخرج</option>
          </select>
        </div>
      </div>

      {/* Students Data Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <span>
            إجمالي النتائج: <strong className="text-stone-800 dark:text-stone-200 font-mono">{filteredStudents.length}</strong> طالب
          </span>
          <span className="text-[11px]">مدرسة ملوي الرسمية للغات</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                <th className="p-3">كود الطالب</th>
                <th className="p-3">اسم الطالب بالكامل</th>
                <th className="p-3">الصف والفصل</th>
                <th className="p-3">الرقم القومي</th>
                <th className="p-3">ولي الأمر والهاتف</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">بطاقة QR</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">
                      {st.studentId}
                    </td>
                    <td className="p-3">
                      <div className="font-extrabold text-stone-900 dark:text-stone-100">{st.fullName}</div>
                      <div className="text-[11px] text-stone-400 font-mono mt-0.5">{st.unifiedEmail || 'لا يوجد بريد موحد'}</div>
                    </td>
                    <td className="p-3 text-stone-700 dark:text-stone-300">
                      <div>{formatGradeArabic(st.grade)}</div>
                      <div className="font-bold text-stone-900 dark:text-stone-200 mt-0.5">فصل {st.sectionClass}</div>
                    </td>
                    <td className="p-3 font-mono text-stone-600 dark:text-stone-400">
                      {st.nationalId || '-'}
                    </td>
                    <td className="p-3 text-stone-700 dark:text-stone-300">
                      <div>{st.parentName || '-'}</div>
                      <div className="font-mono text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{st.parentPhone || st.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {st.status === 'enrolled' ? 'مستمر' : st.status === 'transferred_in' ? 'محول للمدرسة' : st.status === 'transferred_out' ? 'منقول' : 'متخرج'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedStudentForQr(st)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="عرض وطباعة كود QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Card</span>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="تعديل بيانات الطالب"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.fullName)}
                          className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400">
                    لا يوجد طلاب يطابقون شروط البحث الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-700" />
                <span>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد للكنترول'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    اسم الطالب بالكامل رباعي *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمود حسن إبراهيم"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الرقم القومي (14 رقم)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="308XXXXXXXXXXX"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الصف الدراسي *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  >
                    <option value="grade1">الصف الأول الثانوي</option>
                    <option value="grade2">الصف الثاني الثانوي</option>
                    <option value="grade3">الصف الثالث الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الفصل الدراسي *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionClass}
                    onChange={(e) => setSectionClass(e.target.value)}
                    placeholder="مثال: 1/1 أو 2/1 أو 3/1"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    النوع
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    تاريخ الميلاد
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    البريد الموحد
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={unifiedEmail}
                    onChange={(e) => setUnifiedEmail(e.target.value)}
                    placeholder="std@minya.moe.edu.eg"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    رقم هاتف الطالب
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    اسم ولي الأمر
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="اسم ولي الأمر ثلاثي"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    رقم هاتف ولي الأمر (للتواصل العاجل)
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    عنوان السكن (ملوي)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ملوي - الشارع - الحي أو القرية"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الحالة الدراسية
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  >
                    <option value="enrolled">مستمر (مقيد)</option>
                    <option value="transferred_in">محول للمدرسة</option>
                    <option value="transferred_out">منقول لمدرسة أخرى</option>
                    <option value="graduated">متخرج</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : editingStudent ? 'حفظ التعديلات' : 'إضافة الطالب للكنترول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>استيراد بيانات الطلاب من ملف Excel</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-right">
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                يقوم النظام بالتعرف التلقائي على أعمدة ملف Excel (مثل: اسم الطالب، الرقم القومي، الصف، الفصل، هاتف ولي الأمر)، ويكتشف الطلاب المكررين قبل الحفظ.
              </p>

              {/* File Upload Dropzone */}
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 text-center hover:border-red-500 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                <label className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer block">
                  اختر ملف Excel (.xlsx أو .xls) من جهازك
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-stone-400 mt-1 block">يدعم ملفات إحصاء المدرسة وكشوف فصول الوزارة</span>
              </div>

              {isParsingExcel && (
                <div className="text-center py-4 text-xs text-stone-500">
                  جارٍ قراءة الأعمدة والبيانات من ملف Excel...
                </div>
              )}

              {/* Preview Rows */}
              {parsedImportRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                    <span>تم التعرف على {parsedImportRows.length} طالب جاهزين للاستيراد:</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-stone-200 dark:border-stone-800 rounded-xl">
                    <table className="w-full text-right text-[11px]">
                      <thead className="bg-stone-50 dark:bg-stone-800/80 sticky top-0 text-stone-500 font-bold">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">الاسم</th>
                          <th className="p-2">الرقم القومي</th>
                          <th className="p-2">الصف</th>
                          <th className="p-2">الفصل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {parsedImportRows.slice(0, 15).map((r, i) => (
                          <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                            <td className="p-2 font-mono text-stone-400">{r.rowNumber}</td>
                            <td className="p-2 font-bold text-stone-800 dark:text-stone-200">{r.fullName}</td>
                            <td className="p-2 font-mono">{r.nationalId || '-'}</td>
                            <td className="p-2">{formatGradeArabic(r.grade)}</td>
                            <td className="p-2 font-bold">{r.sectionClass}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedImportRows.length > 15 && (
                    <div className="text-center text-[11px] text-stone-500">
                      و {parsedImportRows.length - 15} طالب آخرين سيتم حفظهم في قاعدة البيانات.
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setParsedImportRows([])}
                      className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmImport}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {isSubmitting ? 'جارٍ الاستيراد...' : `تأكيد استيراد (${parsedImportRows.length}) طالب`}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Results Report */}
              {importReport && (
                <div className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تقرير الاستيراد النهائي:</span>
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                    <div>
                      تمت إضافة: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{importReport.addedCount}</strong> طالب بنجاح.
                    </div>
                    {importReport.duplicatesCount > 0 && (
                      <div>
                        تم تخطي: <strong className="text-amber-700 dark:text-amber-400 font-mono">{importReport.duplicatesCount}</strong> طالب مسجل مسبقًا.
                      </div>
                    )}
                    {importReport.errors.length > 0 && (
                      <div className="mt-2 text-[11px] text-red-700 dark:text-red-400 max-h-24 overflow-y-auto">
                        {importReport.errors.map((err, idx) => (
                          <div key={idx}>• {err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student QR Card Modal */}
      {selectedStudentForQr && (
        <StudentIdCardModal
          student={selectedStudentForQr}
          onClose={() => setSelectedStudentForQr(null)}
        />
      )}
    </div>
  );
};
