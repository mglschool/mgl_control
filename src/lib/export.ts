import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, GradeRecord, Subject } from '../types';

// Helper to translate grade code to Arabic display
export const formatGradeArabic = (grade: string) => {
  switch (grade) {
    case 'grade1':
      return 'الصف الأول الثانوي';
    case 'grade2':
      return 'الصف الثاني الثانوي';
    case 'grade3':
      return 'الصف الثالث الثانوي';
    default:
      return grade;
  }
};

export const formatExamTypeArabic = (examType: string) => {
  switch (examType) {
    case 'term1_month1':
      return 'الترم الأول - اختبار الشهر الأول';
    case 'term1_month2':
      return 'الترم الأول - اختبار الشهر الثاني';
    case 'term1_midyear':
      return 'الترم الأول - امتحان نصف العام';
    case 'term2_month1':
      return 'الترم الثاني - اختبار الشهر الأول';
    case 'term2_month2':
      return 'الترم الثاني - اختبار الشهر الثاني';
    case 'term2_final':
      return 'الترم الثاني - امتحان آخر العام';
    default:
      return examType;
  }
};

export const formatAttendanceStatusArabic = (status: string) => {
  switch (status) {
    case 'present':
      return 'حاضر';
    case 'absent':
      return 'غائب';
    case 'late':
      return 'متأخر';
    case 'excused':
      return 'معذور / إجازة';
    default:
      return status;
  }
};

// 1. Export Students to Excel
export function exportStudentsToExcel(students: Student[], filename = 'قاعدة_بيانات_طلاب_مدرسة_ملوي_الرسمية_للغات.xlsx') {
  const data = students.map((s, idx) => ({
    'م': idx + 1,
    'كود الطالب': s.studentId,
    'اسم الطالب': s.fullName,
    'الرقم القومي': s.nationalId || '-',
    'الصف الدراسي': formatGradeArabic(s.grade),
    'الفصل': s.sectionClass,
    'النوع': s.gender === 'male' ? 'ذكر' : 'أنثى',
    'البريد الموحد': s.unifiedEmail || '-',
    'رقم الهاتف': s.phone || '-',
    'تاريخ الميلاد': s.birthDate || '-',
    'اسم ولي الأمر': s.parentName || '-',
    'هاتف ولي الأمر': s.parentPhone || '-',
    'العنوان': s.address || '-',
    'الحالة': s.status === 'enrolled' ? 'مستمر' : s.status === 'transferred_in' ? 'محول للمدرسة' : s.status === 'transferred_out' ? 'منقول' : 'متخرج'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set RTL direction on worksheet
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
  XLSX.writeFile(workbook, filename);
}

// 2. Parse uploaded Excel file for student bulk import
export async function parseStudentsExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          resolve([]);
          return;
        }

        const headers = (rawJson[0] as any[]).map((h) => (h ? h.toString().trim() : ''));
        const rows = rawJson.slice(1);

        // Find column indices by common Arabic/English names
        const findCol = (keywords: string[]) => {
          return headers.findIndex((h) => keywords.some((k) => h.toLowerCase().includes(k.toLowerCase())));
        };

        const idxName = findCol(['اسم الطالب', 'الاسم', 'name', 'student name']);
        const idxNatId = findCol(['الرقم القومي', 'القومي', 'national id', 'nationalid']);
        const idxGrade = findCol(['الصف', 'grade', 'الصف الدراسي']);
        const idxClass = findCol(['الفصل', 'class', 'section', 'فصل']);
        const idxGender = findCol(['النوع', 'الجنس', 'gender', 'sex']);
        const idxPhone = findCol(['رقم الهاتف', 'الهاتف', 'الموبايل', 'phone', 'mobile']);
        const idxEmail = findCol(['البريد الموحد', 'البريد', 'email']);
        const idxBirth = findCol(['تاريخ الميلاد', 'الميلاد', 'birth', 'dob']);
        const idxParent = findCol(['ولي الأمر', 'اسم ولي الأمر', 'parent']);
        const idxParentPhone = findCol(['هاتف ولي الأمر', 'موبايل ولي الأمر', 'parent phone']);
        const idxAddress = findCol(['العنوان', 'address']);

        const parsedList: any[] = [];

        rows.forEach((row, i) => {
          if (!row || row.length === 0) return;
          const nameVal = idxName !== -1 ? row[idxName] : row[0];
          if (!nameVal || !nameVal.toString().trim()) return;

          let gradeVal = 'grade1';
          if (idxGrade !== -1 && row[idxGrade]) {
            const rawG = row[idxGrade].toString();
            if (rawG.includes('الثاني') || rawG.includes('ثاني') || rawG.includes('2')) gradeVal = 'grade2';
            else if (rawG.includes('الثالث') || rawG.includes('ثالث') || rawG.includes('3')) gradeVal = 'grade3';
            else gradeVal = 'grade1';
          }

          parsedList.push({
            rowNumber: i + 2,
            fullName: nameVal.toString().trim(),
            nationalId: idxNatId !== -1 && row[idxNatId] ? row[idxNatId].toString().trim() : '',
            grade: gradeVal,
            sectionClass: idxClass !== -1 && row[idxClass] ? row[idxClass].toString().trim() : '1/1',
            gender: idxGender !== -1 && row[idxGender] ? (row[idxGender].toString().includes('أنثى') ? 'female' : 'male') : 'male',
            phone: idxPhone !== -1 && row[idxPhone] ? row[idxPhone].toString().trim() : '',
            unifiedEmail: idxEmail !== -1 && row[idxEmail] ? row[idxEmail].toString().trim() : '',
            birthDate: idxBirth !== -1 && row[idxBirth] ? row[idxBirth].toString().trim() : '',
            parentName: idxParent !== -1 && row[idxParent] ? row[idxParent].toString().trim() : '',
            parentPhone: idxParentPhone !== -1 && row[idxParentPhone] ? row[idxParentPhone].toString().trim() : '',
            address: idxAddress !== -1 && row[idxAddress] ? row[idxAddress].toString().trim() : ''
          });
        });

        resolve(parsedList);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// 3. Export Attendance Report to Excel
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  students: Student[],
  filename = 'كشف_حضور_وغياب_مدرسة_ملوي_الرسمية_للغات.xlsx'
) {
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const data = records.map((r, idx) => {
    const s = studentMap.get(r.studentId);
    return {
      'م': idx + 1,
      'التاريخ': r.date,
      'كود الطالب': s?.studentId || '-',
      'اسم الطالب': s?.fullName || 'طالب غير معروف',
      'الصف': s ? formatGradeArabic(s.grade) : '-',
      'الفصل': s?.sectionClass || '-',
      'الحالة': formatAttendanceStatusArabic(r.status),
      'وقت الحضور': r.checkInTime || '-',
      'وقت الانصراف': r.checkOutTime || '-',
      'طريقة التسجيل': r.method === 'qr' ? 'مسح QR' : 'يدوي',
      'المسجل': r.recordedBy || '-',
      'ملاحظات': r.notes || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الحضور والغياب');
  XLSX.writeFile(workbook, filename);
}

// 4. Export Grades to Excel
export function exportGradesToExcel(
  grades: GradeRecord[],
  students: Student[],
  subjects: Subject[],
  filename = 'كشف_درجات_امتحانات_مدرسة_ملوي_الرسمية_للغات.xlsx'
) {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const subjectMap = new Map(subjects.map((sub) => [sub.id, sub]));

  const data = grades.map((g, idx) => {
    const s = studentMap.get(g.studentId);
    const sub = subjectMap.get(g.subjectId);
    return {
      'م': idx + 1,
      'كود الطالب': s?.studentId || '-',
      'اسم الطالب': s?.fullName || '-',
      'الصف': s ? formatGradeArabic(s.grade) : '-',
      'الفصل': s?.sectionClass || '-',
      'المادة': sub?.nameAr || '-',
      'الامتحان': formatExamTypeArabic(g.examType),
      'الدرجة': g.score,
      'الدرجة النهائية': g.maxScore,
      'النسبة المئوية': `${g.percentage}%`,
      'المعلم المسؤول': g.teacherName || '-',
      'رصد بواسطة': g.recordedBy || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الدرجات');
  XLSX.writeFile(workbook, filename);
}
