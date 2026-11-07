import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { formatGradeArabic } from '../lib/export';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  student: Student;
  onClose: () => void;
}

export const StudentIdCardModal: React.FC<Props> = ({ student, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(student.qrCodeData || `MOLS:STUDENT:${student.studentId}:${student.nationalId}`, {
      width: 280,
      margin: 1,
      color: {
        dark: '#991b1b', // Brand dark red
        light: '#ffffff'
      }
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [student]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print-backdrop">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-700 dark:text-red-500" />
            <span className="font-bold text-sm text-stone-800 dark:text-stone-200">بطاقة الطالب الإلكترونية (QR ID)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-white rounded-xl border-2 border-red-700/80 shadow-md p-5 text-stone-900 relative overflow-hidden print-card">
            {/* Top red header stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />

            {/* School Header */}
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3 mb-4">
              <img
                src="/assets/aistudio/logopng_2bf70979.png"
                alt="Mallawi Official Language School"
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="text-right flex-1">
                <h3 className="text-xs font-black text-red-800 leading-tight">مدرسة ملوي الرسمية للغات</h3>
                <p className="text-[10px] text-stone-600 font-semibold tracking-tight">Mallawi Official Language School</p>
                <div className="text-[9px] font-bold text-stone-500 mt-0.5">كنترول المرحلة الثانوية - بطاقة حضور الطالب</div>
              </div>
            </div>

            {/* Student Info & QR */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 p-1 bg-stone-50 border border-stone-200 rounded-lg shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Student QR Code" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-stone-100 flex items-center justify-center text-xs text-stone-400">جارٍ التوليد...</div>
                )}
              </div>

              <div className="flex-1 space-y-1.5 text-right">
                <div>
                  <span className="text-[10px] text-stone-500 block">اسم الطالب</span>
                  <div className="font-extrabold text-xs text-stone-900 leading-tight">{student.fullName}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 block">كود الطالب</span>
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      {student.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">الفصل</span>
                    <span className="text-xs font-bold text-stone-800">{student.sectionClass}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 block">الصف الدراسي</span>
                  <span className="text-xs font-semibold text-stone-700">{formatGradeArabic(student.grade)}</span>
                </div>
              </div>
            </div>

            {/* Footer with National ID and Year */}
            <div className="mt-4 pt-2.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500">
              <span className="font-mono">القومي: {student.nationalId ? student.nationalId : 'غير مسجل'}</span>
              <span className="font-bold text-red-800">العام الدراسي 2026 / 2027</span>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-stone-500 dark:text-stone-400 no-print">
            يمكن استخدام رمز QR لمسح الحضور اليومي وتسجيل الانصراف بكاميرا النظام.
          </div>
        </div>
      </div>
    </div>
  );
};
