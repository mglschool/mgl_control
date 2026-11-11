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
  SystemSettings
} from '../types';
import { clientFallback } from './clientFallback';

const TOKEN_KEY = 'mols_auth_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeAuthToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackFn?: () => Promise<T>
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';

    // If server returned non-JSON (e.g. Vercel 500 error or 404 HTML)
    if (!contentType.includes('application/json')) {
      if (fallbackFn) {
        console.warn(`[API] Endpoint ${endpoint} returned non-JSON (${contentType || 'empty'}). Using client fallback.`);
        return await fallbackFn();
      }
      throw new Error('تم استلام رد غير صالح من الخادم.');
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      if (fallbackFn) {
        console.warn(`[API] JSON parse failed on ${endpoint}. Using client fallback.`);
        return await fallbackFn();
      }
      throw new Error('تعذر قراءة بيانات الرد من الخادم.');
    }

    if (!response.ok) {
      if ((response.status === 404 || response.status >= 500) && fallbackFn) {
        console.warn(`[API] Server returned ${response.status}. Using client fallback.`);
        return await fallbackFn();
      }
      throw new Error(data.error || 'حدث خطأ في الاتصال بالسيرفر');
    }

    return data;
  } catch (err: any) {
    if (fallbackFn) {
      console.warn(`[API] Request failed on ${endpoint}, activating client fallback:`, err?.message || err);
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: User; mustChangePassword: boolean }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      },
      () => clientFallback.login(credentials)
    ),

  getMe: () =>
    request<{ user: User }>('/api/auth/me', {}, () => clientFallback.getMe()),

  logout: () =>
    request<{ success: boolean }>(
      '/api/auth/logout',
      { method: 'POST' },
      () => clientFallback.logout()
    ),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>(
      '/api/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.changePassword(data)
    ),

  requestAccount: (data: { fullName: string; email: string; phone?: string; roleRequested?: string; notes?: string }) =>
    request<{ success: boolean; message: string }>(
      '/api/auth/request-account',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.requestAccount(data)
    ),

  forgotPassword: (data: { identifier: string }) =>
    request<{ success: boolean; message: string; devResetLink?: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.forgotPassword(data)
    ),

  // Account Requests (Admin)
  getAccountRequests: () =>
    request<AccountRequest[]>('/api/account-requests', {}, () => clientFallback.getAccountRequests()),

  reviewAccountRequest: (id: string, data: any) =>
    request<{ success: boolean; message: string; temporaryPassword?: string }>(
      '/api/account-requests/' + id + '/review',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.reviewAccountRequest(id, data)
    ),

  // Users (Admin)
  getUsers: () =>
    request<User[]>('/api/users', {}, () => clientFallback.getUsers()),

  updateUser: (id: string, data: any) =>
    request<{ success: boolean; message: string; newGeneratedPass?: string }>(
      '/api/users/' + id,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      },
      () => clientFallback.updateUser(id, data)
    ),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(
      '/api/users/' + id,
      { method: 'DELETE' },
      () => clientFallback.deleteUser(id)
    ),

  // Students
  getStudents: (params?: { grade?: string; sectionClass?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Student[]>(
      `/api/students${q ? '?' + q : ''}`,
      {},
      () => clientFallback.getStudents(params)
    );
  },

  createStudent: (student: Partial<Student>) =>
    request<{ success: boolean; student: Student }>(
      '/api/students',
      {
        method: 'POST',
        body: JSON.stringify(student)
      },
      () => clientFallback.createStudent(student)
    ),

  updateStudent: (id: string, student: Partial<Student>) =>
    request<{ success: boolean; student: Student }>(
      '/api/students/' + id,
      {
        method: 'PUT',
        body: JSON.stringify(student)
      },
      () => clientFallback.updateStudent(id, student)
    ),

  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string }>(
      '/api/students/' + id,
      { method: 'DELETE' },
      () => clientFallback.deleteStudent(id)
    ),

  bulkImportStudents: (studentsList: any[]) =>
    request<{ success: boolean; addedCount: number; duplicatesCount: number; errors: string[] }>(
      '/api/students/bulk-import',
      {
        method: 'POST',
        body: JSON.stringify({ studentsList })
      },
      () => clientFallback.bulkImportStudents(studentsList)
    ),

  // Subjects
  getSubjects: () =>
    request<Subject[]>('/api/subjects', {}, () => clientFallback.getSubjects()),

  createSubject: (sub: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>(
      '/api/subjects',
      {
        method: 'POST',
        body: JSON.stringify(sub)
      },
      () => clientFallback.createSubject(sub)
    ),

  updateSubject: (id: string, sub: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>(
      '/api/subjects/' + id,
      {
        method: 'PUT',
        body: JSON.stringify(sub)
      },
      () => clientFallback.updateSubject(id, sub)
    ),

  // QR Attendance
  scanQrAttendance: (data: { qrCodeString: string; date?: string; isCheckout?: boolean }) =>
    request<{ success: boolean; action: string; student: Student; record: AttendanceRecord; message: string }>(
      '/api/attendance/scan-qr',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.scanQrAttendance(data)
    ),

  getAttendance: (params?: { date?: string; studentId?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<AttendanceRecord[]>(
      `/api/attendance${q ? '?' + q : ''}`,
      {},
      () => clientFallback.getAttendance(params)
    );
  },

  markAttendance: (data: { studentId: string; date: string; status: string; notes?: string }) =>
    request<{ success: boolean; record: AttendanceRecord }>(
      '/api/attendance/mark',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.markAttendance(data)
    ),

  // Grades
  getGrades: (params?: { studentId?: string; subjectId?: string; examType?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<GradeRecord[]>(
      `/api/grades${q ? '?' + q : ''}`,
      {},
      () => clientFallback.getGrades(params)
    );
  },

  saveGradesBatch: (data: { examType: string; subjectId: string; records: any[] }) =>
    request<{ success: boolean; count: number }>(
      '/api/grades/batch',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.saveGradesBatch(data)
    ),

  // Assessments
  getAssessments: () =>
    request<Assessment[]>('/api/assessments', {}, () => clientFallback.getAssessments()),

  createAssessment: (data: Partial<Assessment>) =>
    request<{ success: boolean; assessment: Assessment }>(
      '/api/assessments',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.createAssessment(data)
    ),

  // Homework
  getHomework: () =>
    request<Homework[]>('/api/homework', {}, () => clientFallback.getHomework()),

  createHomework: (data: Partial<Homework>) =>
    request<{ success: boolean; homework: Homework }>(
      '/api/homework',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.createHomework(data)
    ),

  submitHomeworkGrade: (id: string, data: any) =>
    request<{ success: boolean; homework: Homework }>(
      `/api/homework/${id}/submission`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.submitHomeworkGrade(id, data)
    ),

  // Discipline & Behavior
  getDiscipline: () =>
    request<DisciplineRecord[]>('/api/discipline', {}, () => clientFallback.getDiscipline()),

  createDiscipline: (data: Partial<DisciplineRecord>) =>
    request<{ success: boolean; record: DisciplineRecord }>(
      '/api/discipline',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.createDiscipline(data)
    ),

  // Audit Logs & Outbox
  getAuditLogs: () =>
    request<AuditLog[]>('/api/audit-logs', {}, () => clientFallback.getAuditLogs()),

  getOutboxEmails: () =>
    request<OutboxEmail[]>('/api/outbox-emails', {}, () => clientFallback.getOutboxEmails()),

  // Settings
  getSettings: () =>
    request<SystemSettings>('/api/system/settings', {}, () => clientFallback.getSettings()),

  updateSettings: (settings: Partial<SystemSettings>) =>
    request<{ success: boolean; settings: SystemSettings }>(
      '/api/system/settings',
      {
        method: 'POST',
        body: JSON.stringify(settings)
      },
      () => clientFallback.updateSettings(settings)
    ),

  testEmail: (data: { toEmail: string }) =>
    request<{ success: boolean; message: string }>(
      '/api/system/test-email',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      () => clientFallback.testEmail(data.toEmail)
    )
};
