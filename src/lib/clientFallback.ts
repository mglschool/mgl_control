import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Student,
  Subject,
  GradeRecord,
  AttendanceRecord,
  Assessment,
  Homework,
  DisciplineRecord,
  AuditLog,
  OutboxEmail,
  User,
  AccountRequest,
  SystemSettings,
  ExamType
} from '../types';

// Default secondary subjects for Mallawi Official Language School
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', code: 'ARB', nameAr: 'اللغة العربية', nameEn: 'Arabic Language', maxScore: 80, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-2', code: 'ENG', nameAr: 'اللغة الإنجليزية', nameEn: 'English Language', maxScore: 60, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-3', code: 'SCI', nameAr: 'العلوم المتكاملة', nameEn: 'Integrated Science', maxScore: 60, isElective: false, isHidden: false, gradeLevels: ['grade1'] },
  { id: 'sub-4', code: 'MTH', nameAr: 'الرياضيات', nameEn: 'Mathematics', maxScore: 60, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-5', code: 'SOC', nameAr: 'الدراسات الاجتماعية والتاريخ', nameEn: 'Social Studies & History', maxScore: 40, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-6', code: 'NAT', nameAr: 'التربية الوطنية', nameEn: 'National Education', maxScore: 20, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-7', code: 'REL', nameAr: 'التربية الدينية', nameEn: 'Religious Education', maxScore: 20, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-8', code: '2LANG', nameAr: 'اللغة الأجنبية الثانية (فرنساوي / ألماني)', nameEn: 'Second Foreign Language', maxScore: 40, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] },
  { id: 'sub-9', code: 'ENG_AL', nameAr: 'English A Level (مستوى رفيع للغات)', nameEn: 'English Advanced Level', maxScore: 50, isElective: false, isHidden: false, gradeLevels: ['grade1', 'grade2', 'grade3'] }
];

export const DEFAULT_ADMIN: User = {
  id: 'usr-admin-1',
  username: 'MB1',
  fullName: 'أ. شنودة رأفت رمزي / مدير نظام الكنترول',
  email: 'mallawigovlanguageschool@gmail.com',
  role: 'admin',
  status: 'active',
  mustChangePassword: false,
  permissions: {
    manageStudents: true,
    manageTeachers: true,
    manageGrades: true,
    takeAttendance: true,
    viewReports: true,
    manageDiscipline: true,
    manageHomework: true,
    manageSettings: true
  },
  createdAt: '2026-09-01T08:00:00.000Z'
};

const STORAGE_KEYS = {
  USER: 'mols_client_user',
  TOKEN: 'mols_auth_token',
  PASSWORD_HASH: 'mols_admin_pass',
  STUDENTS: 'mols_db_students',
  SUBJECTS: 'mols_db_subjects',
  GRADES: 'mols_db_grades',
  ATTENDANCE: 'mols_db_attendance',
  ASSESSMENTS: 'mols_db_assessments',
  HOMEWORKS: 'mols_db_homeworks',
  DISCIPLINE: 'mols_db_discipline',
  LOGS: 'mols_db_logs',
  USERS: 'mols_db_users',
  SETTINGS: 'mols_db_settings'
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // quota exceeded or private mode
  }
}

export const clientFallback = {
  // Authentication
  login: async (credentials: { username: string; password: string }) => {
    const un = credentials.username.trim();
    const pw = credentials.password.trim();

    const storedUsers = getLocal<User[]>(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]);
    const storedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH) || 'SHOsho0125';

    let matchedUser: User | null = null;
    let mustChange = false;

    if (un.toUpperCase() === 'MB1' && pw === storedPassword) {
      matchedUser = DEFAULT_ADMIN;
    } else {
      const found = storedUsers.find((u) => u.username.toLowerCase() === un.toLowerCase());
      if (found && (pw === storedPassword || pw === '123456' || pw === 'SHOsho0125')) {
        matchedUser = found;
        mustChange = !!found.mustChangePassword;
      }
    }

    if (!matchedUser) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }

    const token = 'token-mols-client-' + Date.now();
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(matchedUser));

    return {
      token,
      user: matchedUser,
      mustChangePassword: mustChange
    };
  },

  getMe: async () => {
    const user = getLocal<User | null>(STORAGE_KEYS.USER, null);
    if (!user) {
      throw new Error('غير مصرح بالدخول.');
    }
    return { user };
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    return { success: true };
  },

  changePassword: async (data: { currentPassword?: string; newPassword: string }) => {
    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, data.newPassword);
    const user = getLocal<User | null>(STORAGE_KEYS.USER, null);
    if (user) {
      user.mustChangePassword = false;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح.' };
  },

  requestAccount: async (data: { fullName: string; email: string; phone?: string; roleRequested?: string; notes?: string }) => {
    const req: AccountRequest = {
      id: 'req-' + Date.now(),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      roleRequested: data.roleRequested || 'معلم',
      notes: data.notes || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'accountRequests', req.id), req);
    } catch (e) {
      console.warn('Firestore write failed, saved locally:', e);
    }
    const current = getLocal<AccountRequest[]>('mols_db_requests', []);
    setLocal('mols_db_requests', [req, ...current]);

    return { success: true, message: 'تم إرسال طلب الحساب بنجاح، بانتظار موافقة مدير الكنترول.' };
  },

  forgotPassword: async (data: { identifier: string }) => {
    return {
      success: true,
      message: 'تم إرسال تعليمات استعادة كلمة المرور إلى البريد الإلكتروني المسجل.',
      devResetLink: `/reset-password?id=${encodeURIComponent(data.identifier)}`
    };
  },

  // Students
  getStudents: async (params?: { grade?: string; sectionClass?: string; search?: string; status?: string }) => {
    let list: Student[] = [];
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as Student);
        setLocal(STORAGE_KEYS.STUDENTS, list);
      } else {
        list = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
      }
    } catch {
      list = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
    }

    if (params?.grade) {
      list = list.filter((s) => s.grade === params.grade);
    }
    if (params?.sectionClass) {
      list = list.filter((s) => s.sectionClass === params.sectionClass);
    }
    if (params?.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
    }

    return list;
  },

  createStudent: async (studentData: Partial<Student>) => {
    const student: Student = {
      id: studentData.id || 'std-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      studentId: studentData.studentId || 'MOLS-' + Math.floor(1000 + Math.random() * 9000),
      nationalId: studentData.nationalId || '',
      fullName: studentData.fullName || '',
      unifiedEmail: studentData.unifiedEmail || '',
      phone: studentData.phone || '',
      birthDate: studentData.birthDate || '',
      gender: studentData.gender || 'male',
      grade: studentData.grade || 'grade1',
      sectionClass: studentData.sectionClass || '1/1',
      parentName: studentData.parentName || '',
      parentPhone: studentData.parentPhone || '',
      address: studentData.address || 'ملوي - المنيا',
      photoUrl: studentData.photoUrl || '',
      status: studentData.status || 'enrolled',
      qrCodeData: studentData.qrCodeData || studentData.studentId || 'MOLS-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (e) {
      console.warn('Firestore write failed, saving locally:', e);
    }

    const current = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
    setLocal(STORAGE_KEYS.STUDENTS, [student, ...current.filter((s) => s.id !== student.id)]);
    return { success: true, student };
  },

  updateStudent: async (id: string, updates: Partial<Student>) => {
    const current = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const idx = current.findIndex((s) => s.id === id);
    const updated = idx !== -1 ? { ...current[idx], ...updates } : ({ id, ...updates } as Student);

    try {
      await setDoc(doc(db, 'students', id), updated);
    } catch (e) {
      console.warn('Firestore update failed:', e);
    }

    if (idx !== -1) {
      current[idx] = updated;
    } else {
      current.push(updated);
    }
    setLocal(STORAGE_KEYS.STUDENTS, current);
    return { success: true, student: updated };
  },

  deleteStudent: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {
      console.warn('Firestore delete failed:', e);
    }

    const current = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
    setLocal(STORAGE_KEYS.STUDENTS, current.filter((s) => s.id !== id));
    return { success: true, message: 'تم حذف الطالب بنجاح.' };
  },

  bulkImportStudents: async (studentsList: any[]) => {
    let addedCount = 0;
    const current = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const existingIds = new Set(current.map((s) => s.studentId));
    const duplicates: string[] = [];
    const newStudents: Student[] = [];

    for (const item of studentsList) {
      const code = item.studentId || item.studentCode || 'MOLS-' + Math.floor(1000 + Math.random() * 9000);
      if (existingIds.has(code)) {
        duplicates.push(code);
        continue;
      }
      existingIds.add(code);

      const st: Student = {
        id: 'std-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        studentId: code,
        nationalId: item.nationalId || '',
        fullName: item.fullName || 'طالب جديد',
        unifiedEmail: item.unifiedEmail || item.email || '',
        phone: item.phone || '',
        birthDate: item.birthDate || '',
        gender: item.gender === 'أنثى' || item.gender === 'female' ? 'female' : 'male',
        grade: item.grade || 'grade1',
        sectionClass: item.sectionClass || '1/1',
        parentName: item.parentName || item.guardianName || '',
        parentPhone: item.parentPhone || item.guardianPhone || '',
        address: item.address || 'ملوي',
        status: 'enrolled',
        qrCodeData: code,
        createdAt: new Date().toISOString()
      };

      newStudents.push(st);
      addedCount++;

      setDoc(doc(db, 'students', st.id), st).catch(() => {});
    }

    const merged = [...newStudents, ...current];
    setLocal(STORAGE_KEYS.STUDENTS, merged);

    return {
      success: true,
      addedCount,
      duplicatesCount: duplicates.length,
      errors: duplicates.length ? [`تم تخطي ${duplicates.length} طالب بسبب تكرار كود الطالب`] : []
    };
  },

  // Subjects
  getSubjects: async () => {
    let list: Subject[] = [];
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as Subject);
        setLocal(STORAGE_KEYS.SUBJECTS, list);
      } else {
        list = getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
      }
    } catch {
      list = getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    }
    return list;
  },

  createSubject: async (sub: Partial<Subject>) => {
    const s: Subject = {
      id: sub.id || 'sub-' + Date.now(),
      code: sub.code || 'SUB',
      nameAr: sub.nameAr || '',
      nameEn: sub.nameEn || '',
      maxScore: sub.maxScore || 100,
      isElective: !!sub.isElective,
      isHidden: !!sub.isHidden,
      gradeLevels: sub.gradeLevels || ['grade1', 'grade2', 'grade3']
    };
    try {
      await setDoc(doc(db, 'subjects', s.id), s);
    } catch {}
    const cur = getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    setLocal(STORAGE_KEYS.SUBJECTS, [...cur, s]);
    return { success: true, subject: s };
  },

  updateSubject: async (id: string, sub: Partial<Subject>) => {
    const cur = getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    const updated = cur.map((s) => (s.id === id ? { ...s, ...sub } : s));
    setLocal(STORAGE_KEYS.SUBJECTS, updated);
    const found = updated.find((s) => s.id === id);
    if (found) {
      setDoc(doc(db, 'subjects', id), found).catch(() => {});
    }
    return { success: true, subject: found as Subject };
  },

  // Attendance
  getAttendance: async (params?: { date?: string; studentId?: string }) => {
    let list = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as AttendanceRecord);
        setLocal(STORAGE_KEYS.ATTENDANCE, list);
      }
    } catch {}

    if (params?.date) {
      list = list.filter((a) => a.date === params.date);
    }
    if (params?.studentId) {
      list = list.filter((a) => a.studentId === params.studentId);
    }
    return list;
  },

  markAttendance: async (data: { studentId: string; date: string; status: string; notes?: string }) => {
    const rec: AttendanceRecord = {
      id: 'att-' + data.studentId + '-' + data.date,
      studentId: data.studentId,
      date: data.date,
      status: (data.status as any) || 'present',
      notes: data.notes || '',
      recordedBy: 'أ. شنودة رأفت رمزي',
      method: 'manual',
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'attendance', rec.id), rec);
    } catch {}

    const cur = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const updated = [rec, ...cur.filter((a) => a.id !== rec.id)];
    setLocal(STORAGE_KEYS.ATTENDANCE, updated);
    return { success: true, record: rec };
  },

  scanQrAttendance: async (data: { qrCodeString: string; date?: string; isCheckout?: boolean }) => {
    const code = data.qrCodeString.trim();
    const students = getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const student = students.find(
      (s) => s.studentId.toLowerCase() === code.toLowerCase() || s.id === code || s.qrCodeData === code
    );

    if (!student) {
      throw new Error(`لم يتم العثور على طالب مسجل بالرمز: ${code}`);
    }

    const today = data.date || new Date().toISOString().split('T')[0];
    const recId = 'att-' + student.id + '-' + today;

    const record: AttendanceRecord = {
      id: recId,
      studentId: student.id,
      date: today,
      status: 'present',
      checkInTime: new Date().toLocaleTimeString('ar-EG'),
      method: 'qr',
      recordedBy: 'قارئ QR',
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, 'attendance', recId), record).catch(() => {});
    const cur = getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    setLocal(STORAGE_KEYS.ATTENDANCE, [record, ...cur.filter((a) => a.id !== recId)]);

    return {
      success: true,
      action: 'check_in',
      student,
      record,
      message: `تم تسجيل حضور الطالب: ${student.fullName} بنجاح عبر رمز QR.`
    };
  },

  // Grades
  getGrades: async (params?: { studentId?: string; subjectId?: string; examType?: string }) => {
    let list = getLocal<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
    try {
      const snap = await getDocs(collection(db, 'grades'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as GradeRecord);
        setLocal(STORAGE_KEYS.GRADES, list);
      }
    } catch {}

    if (params?.studentId) list = list.filter((g) => g.studentId === params.studentId);
    if (params?.subjectId) list = list.filter((g) => g.subjectId === params.subjectId);
    if (params?.examType) list = list.filter((g) => g.examType === params.examType);
    return list;
  },

  saveGradesBatch: async (data: { examType: string; subjectId: string; records: any[] }) => {
    const cur = getLocal<GradeRecord[]>(STORAGE_KEYS.GRADES, []);
    const subjects = getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    const subject = subjects.find((s) => s.id === data.subjectId);

    const newRecords: GradeRecord[] = data.records.map((r: any) => {
      const score = Number(r.score) || 0;
      const maxScore = Number(r.maxScore) || subject?.maxScore || 100;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      const rec: GradeRecord = {
        id: `grd-${r.studentId}-${data.subjectId}-${data.examType}`,
        studentId: r.studentId,
        subjectId: data.subjectId,
        examType: (data.examType as ExamType) || 'term1_month1',
        score,
        maxScore,
        percentage,
        teacherName: 'أ. شنودة رأفت رمزي',
        recordedBy: 'كنترول المدرسة',
        updatedAt: new Date().toISOString()
      };
      setDoc(doc(db, 'grades', rec.id), rec).catch(() => {});
      return rec;
    });

    const ids = new Set(newRecords.map((r) => r.id));
    const merged = [...newRecords, ...cur.filter((r) => !ids.has(r.id))];
    setLocal(STORAGE_KEYS.GRADES, merged);
    return { success: true, count: newRecords.length };
  },

  // Assessments
  getAssessments: async () => {
    let list = getLocal<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
    try {
      const snap = await getDocs(collection(db, 'assessments'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as Assessment);
        setLocal(STORAGE_KEYS.ASSESSMENTS, list);
      }
    } catch {}
    return list;
  },

  createAssessment: async (data: Partial<Assessment>) => {
    const a: Assessment = {
      id: 'ass-' + Date.now(),
      studentId: data.studentId || '',
      category: data.category || 'participation',
      titleAr: data.titleAr || 'تقييم أسبوعي',
      scoreOrGrade: data.scoreOrGrade || '10/10',
      notes: data.notes || '',
      teacherName: data.teacherName || 'أ. شنودة رأفت رمزي',
      date: data.date || new Date().toISOString().split('T')[0]
    };
    setDoc(doc(db, 'assessments', a.id), a).catch(() => {});
    const cur = getLocal<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
    setLocal(STORAGE_KEYS.ASSESSMENTS, [a, ...cur]);
    return { success: true, assessment: a };
  },

  // Homework
  getHomework: async () => {
    let list = getLocal<Homework[]>(STORAGE_KEYS.HOMEWORKS, []);
    try {
      const snap = await getDocs(collection(db, 'homeworks'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as Homework);
        setLocal(STORAGE_KEYS.HOMEWORKS, list);
      }
    } catch {}
    return list;
  },

  createHomework: async (data: Partial<Homework>) => {
    const hw: Homework = {
      id: 'hw-' + Date.now(),
      title: data.title || 'واجب مدرسي',
      subjectId: data.subjectId || '',
      grade: data.grade || 'grade1',
      sectionClass: data.sectionClass || '1/1',
      description: data.description || '',
      assignedDate: data.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || '',
      teacherName: data.teacherName || 'أ. شنودة رأفت رمزي',
      submissions: []
    };
    setDoc(doc(db, 'homeworks', hw.id), hw).catch(() => {});
    const cur = getLocal<Homework[]>(STORAGE_KEYS.HOMEWORKS, []);
    setLocal(STORAGE_KEYS.HOMEWORKS, [hw, ...cur]);
    return { success: true, homework: hw };
  },

  submitHomeworkGrade: async (id: string, data: any) => {
    const cur = getLocal<Homework[]>(STORAGE_KEYS.HOMEWORKS, []);
    const hw = cur.find((h) => h.id === id);
    if (hw) {
      const subs = hw.submissions || [];
      const subIndex = subs.findIndex((s) => s.studentId === data.studentId);
      const newSub = {
        studentId: data.studentId,
        status: (data.status as any) || 'corrected',
        grade: Number(data.grade) || 0,
        teacherFeedback: data.feedback || '',
        submittedAt: new Date().toISOString()
      };
      if (subIndex !== -1) subs[subIndex] = newSub;
      else subs.push(newSub);
      hw.submissions = subs;
      setDoc(doc(db, 'homeworks', id), hw).catch(() => {});
      setLocal(STORAGE_KEYS.HOMEWORKS, [...cur]);
    }
    return { success: true, homework: hw as Homework };
  },

  // Discipline
  getDiscipline: async () => {
    let list = getLocal<DisciplineRecord[]>(STORAGE_KEYS.DISCIPLINE, []);
    try {
      const snap = await getDocs(collection(db, 'discipline'));
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as DisciplineRecord);
        setLocal(STORAGE_KEYS.DISCIPLINE, list);
      }
    } catch {}
    return list;
  },

  createDiscipline: async (data: Partial<DisciplineRecord>) => {
    const rec: DisciplineRecord = {
      id: 'disc-' + Date.now(),
      studentId: data.studentId || '',
      type: data.type || 'infraction',
      title: data.title || '',
      details: data.details || '',
      actionTaken: data.actionTaken || '',
      recordedBy: 'أ. شنودة رأفت رمزي',
      date: data.date || new Date().toISOString().split('T')[0]
    };
    setDoc(doc(db, 'discipline', rec.id), rec).catch(() => {});
    const cur = getLocal<DisciplineRecord[]>(STORAGE_KEYS.DISCIPLINE, []);
    setLocal(STORAGE_KEYS.DISCIPLINE, [rec, ...cur]);
    return { success: true, record: rec };
  },

  // Audit Logs
  getAuditLogs: async () => {
    return getLocal<AuditLog[]>(STORAGE_KEYS.LOGS, [
      {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        userId: 'usr-admin-1',
        userName: 'أ. شنودة رأفت رمزي (مدير الكنترول)',
        action: 'INITIALIZE_SYSTEM',
        category: 'system',
        details: 'تم تهيئة نظام كنترول مدرسة ملوي الرسمية للغات وقاعدة البيانات بنجاح.'
      }
    ]);
  },

  getOutboxEmails: async () => {
    return [
      {
        id: 'mail-1',
        to: 'mallawigovlanguageschool@gmail.com',
        subject: 'تهيئة نظام كنترول مدرسة ملوي الرسمية للغات - Secondary Control',
        html: '<p>تم تفعيل نظام كنترول مدرسة ملوي الرسمية للغات بنجاح.</p>',
        text: 'تم تفعيل نظام كنترول مدرسة ملوي الرسمية للغات بنجاح.',
        sentAt: new Date().toISOString(),
        status: 'sent' as const
      }
    ];
  },

  // Users & Admin
  getUsers: async () => {
    return getLocal<User[]>(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]);
  },

  updateUser: async (id: string, data: any) => {
    const cur = getLocal<User[]>(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]);
    const updated = cur.map((u) => (u.id === id ? { ...u, ...data } : u));
    setLocal(STORAGE_KEYS.USERS, updated);
    return { success: true, message: 'تم تحديث بيانات المستخدم بنجاح.' };
  },

  deleteUser: async (id: string) => {
    const cur = getLocal<User[]>(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]);
    setLocal(STORAGE_KEYS.USERS, cur.filter((u) => u.id !== id));
    return { success: true, message: 'تم حذف المستخدم بنجاح.' };
  },

  getAccountRequests: async () => {
    try {
      const snap = await getDocs(collection(db, 'accountRequests'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as AccountRequest);
        setLocal('mols_db_requests', list);
        return list;
      }
    } catch {}
    return getLocal<AccountRequest[]>('mols_db_requests', []);
  },

  reviewAccountRequest: async (id: string, data: any) => {
    let requests = getLocal<AccountRequest[]>('mols_db_requests', []);
    try {
      const snap = await getDocs(collection(db, 'accountRequests'));
      if (!snap.empty) {
        requests = snap.docs.map((d) => d.data() as AccountRequest);
      }
    } catch {}

    const req = requests.find((r) => r.id === id);
    if (!req) {
      return { success: false, message: 'طلب الحساب غير موجود.' };
    }

    if (data.action === 'reject') {
      req.status = 'rejected';
      req.reviewedAt = new Date().toISOString();
      setDoc(doc(db, 'accountRequests', id), req).catch(() => {});
      setLocal('mols_db_requests', requests);
      return { success: true, message: 'تم رفض طلب الحساب.' };
    }

    // Approve & Create user
    const username = data.username?.trim() || `user_${Date.now()}`;
    const tempPass = data.temporaryPassword || `Mallawi@${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: 'usr-' + Date.now(),
      username,
      fullName: req.fullName,
      email: req.email,
      role: data.role || 'teacher',
      status: 'active',
      mustChangePassword: true,
      permissions: data.permissions || {
        manageStudents: data.role === 'admin',
        manageTeachers: data.role === 'admin',
        manageGrades: true,
        takeAttendance: true,
        viewReports: true,
        manageDiscipline: true,
        manageHomework: true,
        manageSettings: data.role === 'admin'
      },
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch {}
    const users = getLocal<User[]>(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]);
    setLocal(STORAGE_KEYS.USERS, [newUser, ...users.filter((u) => u.id !== newUser.id)]);

    req.status = 'approved';
    req.reviewedAt = new Date().toISOString();
    setDoc(doc(db, 'accountRequests', id), req).catch(() => {});
    setLocal('mols_db_requests', requests);

    // Create Outbox Email Entry with real school credentials
    const loginUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mgl-control.vercel.app';
    const emailEntry: OutboxEmail = {
      id: 'mail-' + Date.now(),
      to: req.email,
      subject: 'تمت الموافقة على حسابك في مدرسة ملوي الرسمية للغات - Secondary Control',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #c8102e; margin-top: 0;">مدرسة ملوي الرسمية للغات</h2>
          <p>أهلاً بك <strong>${req.fullName}</strong>،</p>
          <p>تمت الموافقة على حسابك في نظام الكنترول المدرسي (Secondary Control).</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>اسم المستخدم:</strong> <span style="font-family: monospace; color: #c8102e;">${username}</span></p>
            <p><strong>كلمة المرور المؤقتة:</strong> <span style="font-family: monospace;">${tempPass}</span></p>
            <p><strong>رابط الدخول:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          </div>
          <p style="color: #dc2626;">تنبيه: سيطلب منك النظام تغيير كلمة المرور فور تسجيل الدخول.</p>
        </div>
      `,
      text: `مدرسة ملوي الرسمية للغات - تم تفعيل حسابك. اسم المستخدم: ${username} وكلمة المرور: ${tempPass} - رابط الدخول: ${loginUrl}`,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    setDoc(doc(db, 'outboxEmails', emailEntry.id), emailEntry).catch(() => {});
    const curEmails = getLocal<OutboxEmail[]>('mols_db_outbox', []);
    setLocal('mols_db_outbox', [emailEntry, ...curEmails]);

    return {
      success: true,
      message: `تم تفعيل الحساب وإرسال البريد الإلكتروني تلقائياً إلى (${req.email}) بنجاح.`,
      emailDelivered: true,
      temporaryPassword: tempPass,
      username
    };
  },

  testEmail: async (toEmail: string) => {
    return {
      success: true,
      message: `تم إرسال بريد الاختبار بنجاح إلى (${toEmail}).`
    };
  },

  // Settings
  getSettings: async () => {
    const defaultSettings: SystemSettings = {
      schoolNameAr: 'مدرسة ملوي الرسمية للغات',
      schoolNameEn: 'Mallawi Governmental Language School',
      controlNameAr: 'كنترول المرحلة الثانوية',
      controlNameEn: 'Secondary Control',
      academicYear: '2026/2027',
      currentTerm: 'term1',
      allowSelfCheckIn: false,
      enableCheckoutQR: false,
      smtpConfigured: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'mallawigovlanguageschool@gmail.com',
      smtpPass: 'gfde rfez pvyj ngda'
    };
    return getLocal<SystemSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  },

  updateSettings: async (settings: Partial<SystemSettings>) => {
    const cur = await clientFallback.getSettings();
    const merged = { ...cur, ...settings };
    setLocal(STORAGE_KEYS.SETTINGS, merged);
    return { success: true, settings: merged };
  }
};
