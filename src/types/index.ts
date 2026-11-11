export type UserRole = 'admin' | 'control_member' | 'teacher' | 'attendance_officer' | 'counselor' | 'custom';

export interface UserPermissions {
  manageStudents: boolean;      // Admin & Control Member (إضافة وتعديل وحذف الطلاب)
  manageTeachers: boolean;      // Admin only (إدارة المعلمين والحسابات)
  manageGrades: boolean;        // Admin, Control Member, and Teacher (لمادته المسندة فقط)
  takeAttendance: boolean;      // Admin, Control Member, Attendance Officer (تسجيل الحضور والغياب)
  viewReports: boolean;         // Admin, Control Member, Teacher
  manageDiscipline: boolean;    // Admin, Control Member
  manageHomework: boolean;      // Admin, Control Member, Teacher
  manageSettings: boolean;      // Admin only (إعدادات الكنترول والنظام)
  reviewRequests: boolean;      // Admin only (قبول أو رفض طلبات حسابات المعلمين)
  assignedGrades?: string[];    // e.g., ['grade1', 'grade2', 'grade3']
  assignedClasses?: string[];   // e.g., ['1/1', '1/2', '2/1']
  assignedSubjects?: string[];  // معرّفات المواد المسندة للمعلم e.g., ['sub-2']
  assignedSubjectName?: string; // اسم المادة المسندة e.g., 'اللغة الإنجليزية'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  mustChangePassword: boolean;
  permissions: UserPermissions;
  assignedSubjectId?: string;
  assignedSubjectName?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  createdAt: string;
  lastLogin?: string;
}

export interface AccountRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleRequested?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  activationToken?: string;
}

export type StudentStatus = 'enrolled' | 'transferred_in' | 'transferred_out' | 'graduated';
export type GradeLevel = 'grade1' | 'grade2' | 'grade3';

export interface Student {
  id: string;
  studentId: string; // e.g. MOLS-1001
  fullName: string;
  nationalId: string;
  unifiedEmail: string;
  phone: string;
  birthDate: string;
  gender: 'male' | 'female';
  grade: GradeLevel;
  sectionClass: string; // e.g. '1/1', '1/2', '2/1'
  parentName: string;
  parentPhone: string;
  address: string;
  photoUrl?: string;
  status: StudentStatus;
  qrCodeData: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  maxScore: number;
  isElective: boolean;
  isHidden: boolean;
  gradeLevels: GradeLevel[];
}

export type ExamType =
  | 'term1_month1'
  | 'term1_month2'
  | 'term1_midyear'
  | 'term2_month1'
  | 'term2_month2'
  | 'term2_final';

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string;
  examType: ExamType;
  score: number;
  maxScore: number;
  percentage: number;
  teacherName: string;
  recordedBy: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  method: 'qr' | 'manual';
  recordedBy: string;
  notes?: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  category: 'participation' | 'interaction' | 'performance' | 'compliance' | 'task_completion' | 'academic' | 'custom';
  titleAr: string;
  scoreOrGrade: string;
  notes?: string;
  teacherName: string;
  date: string;
}

export interface HomeworkSubmission {
  studentId: string;
  status: 'pending' | 'submitted' | 'corrected' | 'late';
  grade?: number;
  teacherFeedback?: string;
  submittedAt?: string;
}

export interface Homework {
  id: string;
  title: string;
  subjectId: string;
  grade: GradeLevel;
  sectionClass: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  attachments?: string[];
  teacherName: string;
  submissions: HomeworkSubmission[];
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  type: 'positive' | 'infraction' | 'warning' | 'certificate' | 'pedagogical_action';
  title: string;
  details: string;
  actionTaken?: string;
  recordedBy: string;
  date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: 'auth' | 'student' | 'attendance' | 'grades' | 'system';
  details: string;
  ip?: string;
}

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  activationToken?: string;
}

export interface SystemSettings {
  schoolNameAr: string;
  schoolNameEn: string;
  controlNameAr: string;
  controlNameEn: string;
  academicYear: string;
  currentTerm: 'term1' | 'term2';
  allowSelfCheckIn: boolean;
  enableCheckoutQR: boolean;
  smtpConfigured: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  resendApiKey?: string;
}
