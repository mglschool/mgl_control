import { Student, Subject, GradeRecord, AttendanceRecord, Assessment, Homework, DisciplineRecord, AuditLog, OutboxEmail, User, AccountRequest, SystemSettings } from '../types';

const TOKEN_KEY = 'mols_auth_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeAuthToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ في الاتصال بالسيرفر');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: User; mustChangePassword: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  getMe: () => request<{ user: User }>('/api/auth/me'),
  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  requestAccount: (data: { fullName: string; email: string; phone?: string; roleRequested?: string; notes?: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/request-account', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgotPassword: (data: { identifier: string }) =>
    request<{ success: boolean; message: string; devResetLink?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Account Requests (Admin)
  getAccountRequests: () => request<AccountRequest[]>('/api/account-requests'),
  reviewAccountRequest: (id: string, data: any) =>
    request<{ success: boolean; message: string; temporaryPassword?: string }>('/api/account-requests/' + id + '/review', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Users (Admin)
  getUsers: () => request<User[]>('/api/users'),
  updateUser: (id: string, data: any) =>
    request<{ success: boolean; message: string; newGeneratedPass?: string }>('/api/users/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  deleteUser: (id: string) => request<{ success: boolean; message: string }>('/api/users/' + id, { method: 'DELETE' }),

  // Students
  getStudents: (params?: { grade?: string; sectionClass?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Student[]>(`/api/students${q ? '?' + q : ''}`);
  },
  createStudent: (student: Partial<Student>) =>
    request<{ success: boolean; student: Student }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(student)
    }),
  updateStudent: (id: string, student: Partial<Student>) =>
    request<{ success: boolean; student: Student }>('/api/students/' + id, {
      method: 'PUT',
      body: JSON.stringify(student)
    }),
  deleteStudent: (id: string) => request<{ success: boolean; message: string }>('/api/students/' + id, { method: 'DELETE' }),
  bulkImportStudents: (studentsList: any[]) =>
    request<{ success: boolean; addedCount: number; duplicatesCount: number; errors: string[] }>('/api/students/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ studentsList })
    }),

  // Subjects
  getSubjects: () => request<Subject[]>('/api/subjects'),
  createSubject: (sub: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(sub)
    }),
  updateSubject: (id: string, sub: Partial<Subject>) =>
    request<{ success: boolean; subject: Subject }>('/api/subjects/' + id, {
      method: 'PUT',
      body: JSON.stringify(sub)
    }),

  // QR Attendance
  scanQrAttendance: (data: { qrCodeString: string; date?: string; isCheckout?: boolean }) =>
    request<{ success: boolean; action: string; student: Student; record: AttendanceRecord; message: string }>('/api/attendance/scan-qr', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getAttendance: (params?: { date?: string; studentId?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<AttendanceRecord[]>(`/api/attendance${q ? '?' + q : ''}`);
  },
  markAttendance: (data: { studentId: string; date: string; status: string; notes?: string }) =>
    request<{ success: boolean; record: AttendanceRecord }>('/api/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Grades
  getGrades: (params?: { studentId?: string; subjectId?: string; examType?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<GradeRecord[]>(`/api/grades${q ? '?' + q : ''}`);
  },
  saveGradesBatch: (data: { examType: string; subjectId: string; records: any[] }) =>
    request<{ success: boolean; count: number }>('/api/grades/batch', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Assessments
  getAssessments: () => request<Assessment[]>('/api/assessments'),
  createAssessment: (data: Partial<Assessment>) =>
    request<{ success: boolean; assessment: Assessment }>('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Homework
  getHomework: () => request<Homework[]>('/api/homework'),
  createHomework: (data: Partial<Homework>) =>
    request<{ success: boolean; homework: Homework }>('/api/homework', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  submitHomeworkGrade: (id: string, data: any) =>
    request<{ success: boolean; homework: Homework }>(`/api/homework/${id}/submission`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Discipline & Behavior
  getDiscipline: () => request<DisciplineRecord[]>('/api/discipline'),
  createDiscipline: (data: Partial<DisciplineRecord>) =>
    request<{ success: boolean; record: DisciplineRecord }>('/api/discipline', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Audit Logs & Outbox
  getAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),
  getOutboxEmails: () => request<OutboxEmail[]>('/api/outbox-emails'),

  // Settings
  getSettings: () => request<SystemSettings>('/api/system/settings'),
  updateSettings: (settings: Partial<SystemSettings>) =>
    request<{ success: boolean; settings: SystemSettings }>('/api/system/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
};
