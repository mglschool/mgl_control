import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getArgValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return null;
}

const portFromArg = getArgValue('--port');
const hostFromArg = getArgValue('--host');

const PORT = Number(process.env.PORT) || (portFromArg ? Number(portFromArg) : null) || 3000;
const HOST = process.env.HOST || hostFromArg || '0.0.0.0';

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure data directory exists
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'mols_data') : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'school_database.json');

// Session store in-memory (token -> user details)
const activeSessions = new Map<string, { userId: string; username: string; role: string; expiresAt: number }>();

// Initial Database Seeding Helper
function getInitialDatabase() {
  const salt = bcrypt.genSaltSync(10);
  const adminHashedPassword = bcrypt.hashSync('SHOsho0125', salt);

  const subjects = [
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

  const students: any[] = [];
  const attendance: any[] = [];
  const grades: any[] = [];
  const assessments: any[] = [];
  const homeworks: any[] = [];
  const discipline: any[] = [];

  const auditLogs = [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      userId: 'usr-admin-1',
      userName: 'أ. شنودة رأفت رمزي (مدير الكنترول)',
      action: 'INITIALIZE_SYSTEM',
      category: 'system',
      details: 'تم تهيئة نظام كنترول مدرسة ملوي الرسمية للغات وقاعدة البيانات بنجاح.'
    }
  ];

  const outboxEmails = [
    {
      id: 'mail-1',
      to: 'mallawigovlanguageschool@gmail.com',
      subject: 'تهيئة نظام كنترول مدرسة ملوي الرسمية للغات - Secondary Control',
      html: '<div dir="rtl" style="font-family: Arial; padding: 20px;"><h2>مدرسة ملوي الرسمية للغات</h2><p>تم إعداد وتفعيل نظام Secondary Control وإطلاق السيرفر وقاعدة البيانات بنجاح.</p><p>حساب الإدارة: <strong>MB1</strong></p></div>',
      text: 'مدرسة ملوي الرسمية للغات - تم إعداد وتفعيل نظام Secondary Control بنجاح. حساب الإدارة: MB1',
      sentAt: new Date().toISOString(),
      status: 'sent'
    }
  ];

  return {
    users: [
      {
        id: 'usr-admin-1',
        username: 'MB1',
        fullName: 'أ. شنودة رأفت رمزي / مدير نظام الكنترول',
        email: 'mallawigovlanguageschool@gmail.com',
        role: 'admin',
        status: 'active',
        passwordHash: adminHashedPassword,
        mustChangePassword: true, // Forces Admin to change password on first login!
        failedLoginAttempts: 0,
        lockedUntil: null,
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
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ],
    accountRequests: [
      {
        id: 'req-1',
        fullName: 'أ. طارق عبد الرحمن علي',
        email: 'tarek.teacher@minya.moe.edu.eg',
        phone: '01023456781',
        roleRequested: 'معلم لغة عربية - المرحلة الثانوية',
        status: 'pending',
        notes: 'معلم أول لغة عربية بمدرسة ملوي الرسمية للغات',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ],
    students,
    subjects,
    grades,
    attendance,
    assessments,
    homeworks,
    discipline,
    auditLogs,
    outboxEmails,
    settings: {
      schoolNameAr: 'مدرسة ملوي الرسمية للغات',
      schoolNameEn: 'Mallawi Governmental Language School',
      controlNameAr: 'كنترول المرحلة الثانوية',
      controlNameEn: 'Secondary Control',
      academicYear: '2026 / 2027',
      currentTerm: 'term1',
      allowSelfCheckIn: false,
      enableCheckoutQR: true,
      smtpConfigured: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'mallawigovlanguageschool@gmail.com',
      smtpPass: 'gfde rfez pvyj ngda'
    }
  };
}

// Read database from file with fallback & atomic write
function loadDb(): any {
  if (!fs.existsSync(DB_FILE)) {
    const initData = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf-8');
    return initData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, re-seeding:', err);
    const initData = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf-8');
    return initData;
  }
}

function saveDb(data: any) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

function addAuditLog(db: any, userId: string, userName: string, action: string, category: 'auth' | 'student' | 'attendance' | 'grades' | 'system', details: string, req?: express.Request) {
  const log = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    category,
    details,
    ip: req?.ip || '127.0.0.1'
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

// Real Email Sending Engine via Nodemailer & Web API
async function sendRealEmail({
  to,
  subject,
  html,
  text,
  settings
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  settings?: any;
}): Promise<{ delivered: boolean; error?: string; provider?: string }> {
  const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(settings?.smtpPort || process.env.SMTP_PORT) || 587;
  const smtpUser = settings?.smtpUser || process.env.SMTP_USER || 'mallawigovlanguageschool@gmail.com';
  const rawPass = settings?.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
  const smtpPass = rawPass.replace(/\s+/g, '');
  const resendApiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;

  console.log(`[Email Service] Attempting delivery to: "${to}" from: "${smtpUser}" (Host: ${smtpHost}:${smtpPort})`);

  // 1. Try Resend HTTP API if key provided
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `مدرسة ملوي الرسمية للغات <onboarding@resend.dev>`,
          to: [to],
          subject,
          html,
          text
        })
      });
      if (res.ok) {
        console.log('[Email Service] Email dispatched successfully via Resend HTTP API.');
        return { delivered: true, provider: 'resend' };
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[Email Service] Resend API error:', errJson);
      }
    } catch (e: any) {
      console.warn('[Email Service] Resend API request failed:', e?.message);
    }
  }

  // 2. Nodemailer SMTP (e.g. Gmail App Password or custom SMTP server)
  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: `"مدرسة ملوي الرسمية للغات - Secondary Control" <${smtpUser}>`,
        to,
        subject,
        html,
        text
      });

      console.log('[Email Service] Email sent successfully via SMTP. MessageId:', info.messageId);
      return { delivered: true, provider: 'smtp' };
    } catch (err: any) {
      console.error('[Email Service] SMTP send error:', err?.message || err);
      return { delivered: false, error: `تعذر الإرسال عبر SMTP: ${err?.message || 'خطأ غير معروف'}` };
    }
  }

  return {
    delivered: false,
    error: 'لم يتم إدخال كود مرور التطبيقات (Gmail App Password) في إعدادات الكنترول بعد.'
  };
}

// Authentication Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'لم يتم تقديم رمز المصادقة. يرجى تسجيل الدخول أولاً.' });
    return;
  }

  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    res.status(401).json({ error: 'انتهت صلاحية جلسة الدخول. يرجى إعادة تسجيل الدخول.' });
    return;
  }

  const db = loadDb();
  const user = db.users.find((u: any) => u.id === session.userId);
  if (!user || user.status === 'suspended') {
    res.status(403).json({ error: 'تم إيقاف هذا الحساب أو لم يعد متاحًا.' });
    return;
  }

  (req as any).user = user;
  (req as any).sessionToken = token;
  next();
}

// ======================== API ROUTES ========================

// 1. Authentication Endpoints

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    return;
  }

  const db = loadDb();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    return;
  }

  // Check account lockout
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    res.status(429).json({ error: `تم قفل الحساب مؤقتًا لكثرة المحاولات الخاطئة. يرجى المحاولة بعد ${minutesLeft} دقيقة.` });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'تم تجميد هذا الحساب من قِبل إدارة المدرسة. تواصل مع الإدارة.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      addAuditLog(db, user.id, user.username, 'ACCOUNT_LOCKED', 'auth', 'تم قفل الحساب مؤقتًا بعد 5 محاولات فاشلة.', req);
    } else {
      addAuditLog(db, user.id, user.username, 'LOGIN_FAILED', 'auth', `محاولة تسجيل دخول فاشلة (${user.failedLoginAttempts}/5)`, req);
    }
    saveDb(db);
    res.status(401).json({ error: `اسم المستخدم أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${Math.max(0, 5 - user.failedLoginAttempts)}` });
    return;
  }

  // Successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLogin = new Date().toISOString();

  // Create session
  const token = `mols_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  activeSessions.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 3600 * 1000 // 24 hours
  });

  addAuditLog(db, user.id, user.username, 'LOGIN_SUCCESS', 'auth', `تسجيل دخول ناجح للمستخدم: ${user.fullName}`, req);
  saveDb(db);

  const { passwordHash, ...safeUserData } = user;
  res.json({
    token,
    user: safeUserData,
    mustChangePassword: !!user.mustChangePassword
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف وتحتوي على أرقام وحروف.' });
    return;
  }

  const user = (req as any).user;
  const db = loadDb();
  const dbUser = db.users.find((u: any) => u.id === user.id);

  if (!dbUser) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  // If current password provided, verify it (optional during forced first-time change if already authenticated)
  if (currentPassword && !bcrypt.compareSync(currentPassword, dbUser.passwordHash)) {
    res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  dbUser.passwordHash = bcrypt.hashSync(newPassword, salt);
  dbUser.mustChangePassword = false;
  addAuditLog(db, dbUser.id, dbUser.username, 'PASSWORD_CHANGED', 'auth', 'تم تغيير كلمة المرور بنجاح.', req);
  saveDb(db);

  res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح.' });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { passwordHash, ...safeUserData } = user;
  res.json({ user: safeUserData });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const token = (req as any).sessionToken;
  if (token) activeSessions.delete(token);
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
});

// POST /api/auth/request-account (Public registration request)
app.post('/api/auth/request-account', (req, res) => {
  const { fullName, email, phone, roleRequested, notes } = req.body;
  if (!fullName || !email) {
    res.status(400).json({ error: 'يرجى إدخال الاسم الكامل والبريد الإلكتروني' });
    return;
  }

  const db = loadDb();
  const existingReq = db.accountRequests.find((r: any) => r.email.toLowerCase() === email.trim().toLowerCase() && r.status === 'pending');
  if (existingReq) {
    res.status(400).json({ error: 'يوجد طلب حساب مسجل مسبقًا قيد المراجعة بهذا البريد الإلكتروني.' });
    return;
  }

  const newRequest = {
    id: `req-${Date.now()}`,
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone || '',
    roleRequested: roleRequested || 'معلم',
    status: 'pending',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.accountRequests.unshift(newRequest);
  addAuditLog(db, 'system', 'طلب حساب جديد', 'ACCOUNT_REQUEST_SUBMITTED', 'auth', `طلب إنشاء حساب من: ${fullName} (${email})`, req);
  saveDb(db);

  res.json({ success: true, message: 'تم إرسال طلب إنشاء الحساب بنجاح، وستتم مراجعته وتفعيله من قِبل مدير النظام.' });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req, res) => {
  const { identifier } = req.body; // username or email
  if (!identifier) {
    res.status(400).json({ error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' });
    return;
  }

  const db = loadDb();
  const user = db.users.find(
    (u: any) => u.username.toLowerCase() === identifier.trim().toLowerCase() || u.email.toLowerCase() === identifier.trim().toLowerCase()
  );

  if (!user) {
    // For security, don't reveal existence
    res.json({ success: true, message: 'إذا كان الحساب مسجلاً لدينا، فقد تم إرسال رابط استعادة كلمة المرور إلى البريد الإلكتروني المسجل.' });
    return;
  }

  const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const resetLink = `${req.protocol}://${req.get('host')}/?resetToken=${resetToken}`;

  const emailEntry = {
    id: `mail-${Date.now()}`,
    to: user.email,
    subject: 'استعادة كلمة المرور - مدرسة ملوي الرسمية للغات',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; background: #fdfdfd; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #c8102e; margin-top: 0;">مدرسة ملوي الرسمية للغات - Secondary Control</h2>
        <p>مرحبًا <strong>${user.fullName}</strong>،</p>
        <p>تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك (اسم المستخدم: <strong>${user.username}</strong>).</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #c8102e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            تعيين كلمة مرور جديدة
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px;">رابط التفعيل الآمن: ${resetLink}</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">إذا لم تقم بطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان.</p>
      </div>
    `,
    text: `مدرسة ملوي الرسمية للغات - طلب إعادة تعيين كلمة المرور لحساب ${user.username}. رابط التفعيل: ${resetLink}`,
    sentAt: new Date().toISOString(),
    status: 'sent',
    activationToken: resetToken
  };

  if (!db.outboxEmails) db.outboxEmails = [];
  db.outboxEmails.unshift(emailEntry);

  addAuditLog(db, user.id, user.username, 'PASSWORD_RESET_REQUESTED', 'auth', `تم إرسال رابط استعادة كلمة المرور إلى ${user.email}`, req);
  saveDb(db);

  res.json({
    success: true,
    message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني المسجل.',
    devResetLink: resetLink
  });
});

// 2. Account Requests & User Management Endpoints (Admin only)

// GET /api/account-requests
app.get('/api/account-requests', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'هذه الصفحة مخصصة لمدير النظام فقط.' });
    return;
  }
  const db = loadDb();
  res.json(db.accountRequests || []);
});

// POST /api/account-requests/:id/review
app.post('/api/account-requests/:id/review', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }

  const { action, username, role, permissions, temporaryPassword } = req.body;
  const requestId = req.params.id;
  const db = loadDb();

  const request = db.accountRequests.find((r: any) => r.id === requestId);
  if (!request) {
    res.status(404).json({ error: 'طلب الحساب غير موجود.' });
    return;
  }

  if (action === 'reject') {
    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = user.username;
    addAuditLog(db, user.id, user.username, 'ACCOUNT_REQUEST_REJECTED', 'auth', `تم رفض طلب الحساب للمستخدم ${request.fullName}`, req);
    saveDb(db);
    res.json({ success: true, message: 'تم رفض طلب الحساب.' });
    return;
  }

  // Approval
  if (!username) {
    res.status(400).json({ error: 'يجب تحديد اسم مستخدم (Username) للمستخدم الجديد.' });
    return;
  }

  const usernameLower = username.trim().toLowerCase();
  if (db.users.some((u: any) => u.username.toLowerCase() === usernameLower)) {
    res.status(400).json({ error: 'اسم المستخدم هذا مستخدم بالفعل. اختر اسم مستخدم آخر.' });
    return;
  }

  const tempPass = temporaryPassword || `Mallawi@${Math.floor(1000 + Math.random() * 9000)}`;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(tempPass, salt);
  const activationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const newUser = {
    id: `usr-${Date.now()}`,
    username: username.trim(),
    fullName: request.fullName,
    email: request.email,
    role: role || 'teacher',
    status: 'active',
    passwordHash,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    permissions: permissions || {
      manageStudents: false,
      manageTeachers: false,
      manageGrades: true,
      takeAttendance: true,
      viewReports: true,
      manageDiscipline: true,
      manageHomework: true,
      manageSettings: false
    },
    createdAt: new Date().toISOString(),
    lastLogin: null
  };

  db.users.push(newUser);
  request.status = 'approved';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = user.username;

  const loginUrl = `${req.protocol}://${req.get('host')}`;

  // Real Email Dispatch to Outbox & Internet
  const emailEntry = {
    id: `mail-${Date.now()}`,
    to: request.email,
    subject: 'تمت الموافقة على حسابك في مدرسة ملوي الرسمية للغات - Secondary Control',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #c8102e; margin-top: 0;">مدرسة ملوي الرسمية للغات</h2>
        <p>أهلاً بك <strong>${request.fullName}</strong>،</p>
        <p>يسعدنا إبلاغك بأنه تمت الموافقة على طلب انضمامك إلى نظام الكنترول المدرسي (Secondary Control) من قِبل إدارة الكنترول.</p>
        <div style="background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong>اسم المستخدم (Username):</strong> <span style="font-family: monospace; font-size: 16px; color: #c8102e; font-weight: bold;">${username.trim()}</span></p>
          <p style="margin: 6px 0;"><strong>كلمة المرور المؤقتة:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold;">${tempPass}</span></p>
          <p style="margin: 6px 0;"><strong>رابط الدخول للنظام:</strong> <a href="${loginUrl}" style="color: #2563eb; font-weight: bold;">${loginUrl}</a></p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">تنبيه أمني: سيطلب منك النظام تغيير كلمة المرور عند أول تسجيل دخول لضمان خصوصية حسابك.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 25px;">مدرسة ملوي الرسمية للغات - كنترول المرحلة الثانوية</p>
      </div>
    `,
    text: `مدرسة ملوي الرسمية للغات - تم تفعيل حسابك. اسم المستخدم: ${username.trim()} وكلمة المرور المؤقتة: ${tempPass} - رابط الدخول: ${loginUrl}`,
    sentAt: new Date().toISOString(),
    status: 'pending' as 'pending' | 'sent' | 'failed',
    activationToken,
    notes: ''
  };

  const sendResult = await sendRealEmail({
    to: request.email,
    subject: emailEntry.subject,
    html: emailEntry.html,
    text: emailEntry.text,
    settings: db.settings
  });

  emailEntry.status = sendResult.delivered ? 'sent' : 'failed';
  if (sendResult.error) {
    emailEntry.notes = sendResult.error;
  }

  if (!db.outboxEmails) db.outboxEmails = [];
  db.outboxEmails.unshift(emailEntry);

  addAuditLog(
    db,
    user.id,
    user.username,
    'USER_CREATED',
    'auth',
    `تمت الموافقة وإنشاء حساب للمستخدم: ${username.trim()} (${request.fullName}) - حالة إرسال البريد: ${sendResult.delivered ? 'تم الإرسال بنجاح' : sendResult.error}`,
    req
  );
  saveDb(db);

  res.json({
    success: true,
    message: sendResult.delivered
      ? `تم تفعيل الحساب وإرسال البريد الإلكتروني تلقائياً إلى (${request.email}) بنجاح.`
      : `تم تفعيل الحساب بنجاح. تنبيه خادم البريد: ${sendResult.error}`,
    emailDelivered: sendResult.delivered,
    emailError: sendResult.error,
    temporaryPassword: tempPass,
    username: username.trim()
  });
});

// GET /api/users
app.get('/api/users', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }
  const db = loadDb();
  const safeUsers = db.users.map(({ passwordHash, ...rest }: any) => rest);
  res.json(safeUsers);
});

// PATCH /api/users/:id
app.patch('/api/users/:id', authenticateToken, (req, res) => {
  const admin = (req as any).user;
  if (admin.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }

  const { status, role, permissions, resetPassword } = req.body;
  const db = loadDb();
  const userToUpdate = db.users.find((u: any) => u.id === req.params.id);

  if (!userToUpdate) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  if (status) userToUpdate.status = status;
  if (role) userToUpdate.role = role;
  if (permissions) userToUpdate.permissions = { ...userToUpdate.permissions, ...permissions };

  let newGeneratedPass: string | null = null;
  if (resetPassword) {
    newGeneratedPass = `Mallawi@${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = bcrypt.genSaltSync(10);
    userToUpdate.passwordHash = bcrypt.hashSync(newGeneratedPass, salt);
    userToUpdate.mustChangePassword = true;
    userToUpdate.failedLoginAttempts = 0;
    userToUpdate.lockedUntil = null;
  }

  addAuditLog(db, admin.id, admin.username, 'USER_UPDATED', 'auth', `تم تعديل بيانات المستخدم: ${userToUpdate.username}`, req);
  saveDb(db);

  res.json({
    success: true,
    message: 'تم تحديث بيانات المستخدم بنجاح.',
    newGeneratedPass
  });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const admin = (req as any).user;
  if (admin.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }

  const db = loadDb();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'المستخدم غير موجود.' });
    return;
  }

  const deletedUsername = db.users[index].username;
  if (deletedUsername === 'MB1') {
    res.status(400).json({ error: 'لا يمكن حذف حساب مدير النظام الأساسي (MB1).' });
    return;
  }

  db.users.splice(index, 1);
  addAuditLog(db, admin.id, admin.username, 'USER_DELETED', 'auth', `تم حذف حساب المستخدم: ${deletedUsername}`, req);
  saveDb(db);

  res.json({ success: true, message: 'تم حذف المستخدم بنجاح.' });
});

// 3. Students Management Endpoints

// GET /api/students
app.get('/api/students', authenticateToken, (req, res) => {
  const db = loadDb();
  let students = db.students || [];

  const { grade, sectionClass, search, status } = req.query;
  if (grade) {
    students = students.filter((s: any) => s.grade === grade);
  }
  if (sectionClass) {
    students = students.filter((s: any) => s.sectionClass === sectionClass);
  }
  if (status) {
    students = students.filter((s: any) => s.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    students = students.filter(
      (s: any) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.nationalId && s.nationalId.includes(q)) ||
        (s.phone && s.phone.includes(q))
    );
  }

  res.json(students);
});

// POST /api/students
app.post('/api/students', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { fullName, nationalId, unifiedEmail, phone, birthDate, gender, grade, sectionClass, parentName, parentPhone, address, status, photoUrl } = req.body;

  if (!fullName || !grade || !sectionClass) {
    res.status(400).json({ error: 'يرجى إدخال اسم الطالب والصف والفصل.' });
    return;
  }

  const db = loadDb();
  const nextNum = (db.students.length + 1).toString().padStart(3, '0');
  const gradeYear = grade === 'grade1' ? '26' : grade === 'grade2' ? '25' : '24';
  const studentId = `MOLS-${gradeYear}-${nextNum}`;
  const qrCodeData = `MOLS:STUDENT:${studentId}:${nationalId || Date.now()}`;

  const newStudent = {
    id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId,
    fullName: fullName.trim(),
    nationalId: (nationalId || '').trim(),
    unifiedEmail: (unifiedEmail || '').trim(),
    phone: (phone || '').trim(),
    birthDate: birthDate || '',
    gender: gender || 'male',
    grade,
    sectionClass,
    parentName: (parentName || '').trim(),
    parentPhone: (parentPhone || '').trim(),
    address: (address || '').trim(),
    photoUrl: photoUrl || '',
    status: status || 'enrolled',
    qrCodeData,
    createdAt: new Date().toISOString()
  };

  db.students.unshift(newStudent);
  addAuditLog(db, user.id, user.username, 'STUDENT_CREATED', 'student', `إضافة طالب جديد: ${fullName} (${studentId})`, req);
  saveDb(db);

  res.json({ success: true, student: newStudent });
});

// PUT /api/students/:id
app.put('/api/students/:id', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const index = db.students.findIndex((s: any) => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'الطالب غير موجود.' });
    return;
  }

  const existing = db.students[index];
  db.students[index] = {
    ...existing,
    ...req.body,
    id: existing.id,
    studentId: existing.studentId, // maintain unique school code
    qrCodeData: existing.qrCodeData
  };

  addAuditLog(db, user.id, user.username, 'STUDENT_UPDATED', 'student', `تعديل بيانات الطالب: ${existing.fullName} (${existing.studentId})`, req);
  saveDb(db);

  res.json({ success: true, student: db.students[index] });
});

// DELETE /api/students/:id
app.delete('/api/students/:id', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const index = db.students.findIndex((s: any) => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'الطالب غير موجود.' });
    return;
  }

  const deleted = db.students[index];
  db.students.splice(index, 1);
  addAuditLog(db, user.id, user.username, 'STUDENT_DELETED', 'student', `حذف الطالب: ${deleted.fullName} (${deleted.studentId})`, req);
  saveDb(db);

  res.json({ success: true, message: 'تم حذف الطالب بنجاح.' });
});

// POST /api/students/bulk-import (Excel batch import with validation & duplicate detection)
app.post('/api/students/bulk-import', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { studentsList } = req.body;

  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    res.status(400).json({ error: 'لم يتم استلام أي بيانات صالحة للاستيراد.' });
    return;
  }

  const db = loadDb();
  const errors: string[] = [];
  let addedCount = 0;
  let duplicatesCount = 0;

  const existingNationalIds = new Set(db.students.map((s: any) => s.nationalId).filter(Boolean));
  const existingNames = new Set(db.students.map((s: any) => s.fullName.trim()));

  for (let i = 0; i < studentsList.length; i++) {
    const item = studentsList[i];
    const rowNum = i + 2;

    if (!item.fullName || !item.fullName.trim()) {
      errors.push(`السطر ${rowNum}: اسم الطالب غير موجود.`);
      continue;
    }

    const trimmedName = item.fullName.trim();
    const natId = (item.nationalId || '').toString().trim();

    // Check duplicates
    if (natId && existingNationalIds.has(natId)) {
      duplicatesCount++;
      errors.push(`السطر ${rowNum}: تم تخطي الطالب ${trimmedName}، الرقم القومي (${natId}) مسجل مسبقًا.`);
      continue;
    }

    if (existingNames.has(trimmedName) && item.grade === db.students.find((s: any) => s.fullName === trimmedName)?.grade) {
      duplicatesCount++;
      errors.push(`السطر ${rowNum}: تم تخطي الطالب ${trimmedName}، مسجل مسبقًا في نفس الصف.`);
      continue;
    }

    const nextIndex = db.students.length + 1;
    const gradeYear = item.grade === 'grade2' ? '25' : item.grade === 'grade3' ? '24' : '26';
    const studentId = `MOLS-${gradeYear}-${nextIndex.toString().padStart(3, '0')}`;
    const qrCodeData = `MOLS:STUDENT:${studentId}:${natId || Date.now()}`;

    const studentRecord = {
      id: `std-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      studentId,
      fullName: trimmedName,
      nationalId: natId,
      unifiedEmail: (item.unifiedEmail || '').toString().trim(),
      phone: (item.phone || '').toString().trim(),
      birthDate: (item.birthDate || '').toString().trim(),
      gender: item.gender === 'أنثى' || item.gender === 'female' ? 'female' : 'male',
      grade: item.grade || 'grade1',
      sectionClass: (item.sectionClass || '1/1').toString().trim(),
      parentName: (item.parentName || '').toString().trim(),
      parentPhone: (item.parentPhone || '').toString().trim(),
      address: (item.address || '').toString().trim(),
      status: 'enrolled',
      qrCodeData,
      createdAt: new Date().toISOString()
    };

    db.students.push(studentRecord);
    existingNames.add(trimmedName);
    if (natId) existingNationalIds.add(natId);
    addedCount++;
  }

  addAuditLog(db, user.id, user.username, 'BULK_IMPORT_STUDENTS', 'student', `استيراد Excel: تمت إضافة ${addedCount} طالب، تخطي ${duplicatesCount} مكرر، عدد الأخطاء: ${errors.length}`, req);
  saveDb(db);

  res.json({
    success: true,
    addedCount,
    duplicatesCount,
    errors
  });
});

// 4. Subjects Management

// GET /api/subjects
app.get('/api/subjects', authenticateToken, (req, res) => {
  const db = loadDb();
  res.json(db.subjects || []);
});

// POST /api/subjects
app.post('/api/subjects', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const { nameAr, nameEn, code, maxScore, gradeLevels, isElective, isHidden } = req.body;

  if (!nameAr || !code) {
    res.status(400).json({ error: 'يرجى إدخال اسم المادة وكود المادة.' });
    return;
  }

  const newSubject = {
    id: `sub-${Date.now()}`,
    code: code.trim(),
    nameAr: nameAr.trim(),
    nameEn: (nameEn || nameAr).trim(),
    maxScore: Number(maxScore) || 100,
    isElective: !!isElective,
    isHidden: !!isHidden,
    gradeLevels: gradeLevels || ['grade1', 'grade2', 'grade3']
  };

  db.subjects.push(newSubject);
  addAuditLog(db, user.id, user.username, 'SUBJECT_CREATED', 'grades', `إضافة مادة جديدة: ${nameAr}`, req);
  saveDb(db);

  res.json({ success: true, subject: newSubject });
});

// PUT /api/subjects/:id
app.put('/api/subjects/:id', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const index = db.subjects.findIndex((s: any) => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'المادة غير موجودة.' });
    return;
  }

  db.subjects[index] = { ...db.subjects[index], ...req.body };
  addAuditLog(db, user.id, user.username, 'SUBJECT_UPDATED', 'grades', `تعديل المادة: ${db.subjects[index].nameAr}`, req);
  saveDb(db);

  res.json({ success: true, subject: db.subjects[index] });
});

// 5. QR Code Attendance & Tracking System

// POST /api/attendance/scan-qr (Real QR code scanner submission)
app.post('/api/attendance/scan-qr', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { qrCodeString, date, sectionClass, isCheckout } = req.body;

  if (!qrCodeString) {
    res.status(400).json({ error: 'لم يتم قراءة رمز QR بشكل صحيح.' });
    return;
  }

  const db = loadDb();
  const targetDate = date || new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('ar-EG', { hour12: false });

  // Locate student by qrCodeData OR studentId OR nationalId
  const student = db.students.find(
    (s: any) =>
      s.qrCodeData === qrCodeString ||
      s.studentId.toLowerCase() === qrCodeString.trim().toLowerCase() ||
      s.nationalId === qrCodeString.trim() ||
      qrCodeString.includes(s.studentId)
  );

  if (!student) {
    res.status(404).json({ error: 'رمز QR غير مسجل في قاعدة بيانات مدرسة ملوي الرسمية للغات.' });
    return;
  }

  // Find attendance record for today
  if (!db.attendance) db.attendance = [];
  let existing = db.attendance.find((a: any) => a.studentId === student.id && a.date === targetDate);

  if (isCheckout) {
    if (!existing) {
      res.status(400).json({ error: `الطالب ${student.fullName} لم يسجل حضور اليوم لتسجيل خروجه.` });
      return;
    }
    existing.checkOutTime = nowTime;
    existing.updatedAt = new Date().toISOString();
    addAuditLog(db, user.id, user.username, 'CHECKOUT_RECORDED', 'attendance', `تسجيل خروج الطالب: ${student.fullName} (${nowTime})`, req);
    saveDb(db);
    res.json({
      success: true,
      action: 'checkout',
      student,
      record: existing,
      message: `تم تسجيل انصراف الطالب: ${student.fullName} بنجاح الساعة ${nowTime}`
    });
    return;
  }

  if (existing && existing.status === 'present') {
    res.status(409).json({
      error: `تم تسجيل حضور الطالب (${student.fullName}) مسبقًا اليوم الساعة ${existing.checkInTime || ''}. يمنع التكرار.`,
      student,
      record: existing
    });
    return;
  }

  // Determine if late (e.g. after 08:00 AM)
  const currentHour = new Date().getHours();
  const currentMin = new Date().getMinutes();
  const isLate = (currentHour === 8 && currentMin > 10) || currentHour > 8;
  const status = isLate ? 'late' : 'present';

  if (existing) {
    existing.status = status;
    existing.checkInTime = nowTime;
    existing.method = 'qr';
    existing.recordedBy = user.username;
    existing.updatedAt = new Date().toISOString();
  } else {
    existing = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      date: targetDate,
      status,
      checkInTime: nowTime,
      method: 'qr',
      recordedBy: user.username,
      updatedAt: new Date().toISOString()
    };
    db.attendance.push(existing);
  }

  addAuditLog(db, user.id, user.username, 'ATTENDANCE_SCAN_QR', 'attendance', `تسجيل حضور بالباركود: ${student.fullName} (${student.studentId}) - الحالة: ${status === 'late' ? 'متأخر' : 'حاضر'}`, req);
  saveDb(db);

  res.json({
    success: true,
    action: 'checkin',
    student,
    record: existing,
    message: `تم تسجيل ${status === 'late' ? 'تأخير' : 'حضور'} الطالب بنجاح: ${student.fullName}`
  });
});

// GET /api/attendance
app.get('/api/attendance', authenticateToken, (req, res) => {
  const db = loadDb();
  let records = db.attendance || [];
  const { date, studentId, startDate, endDate } = req.query;

  if (date) {
    records = records.filter((r: any) => r.date === date);
  } else if (startDate && endDate) {
    records = records.filter((r: any) => r.date >= startDate && r.date <= endDate);
  }

  if (studentId) {
    records = records.filter((r: any) => r.studentId === studentId);
  }

  res.json(records);
});

// POST /api/attendance/mark (Manual Attendance Update)
app.post('/api/attendance/mark', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { studentId, date, status, notes } = req.body;

  if (!studentId || !date || !status) {
    res.status(400).json({ error: 'بيانات الحضور غير مكتملة.' });
    return;
  }

  const db = loadDb();
  if (!db.attendance) db.attendance = [];

  let record = db.attendance.find((a: any) => a.studentId === studentId && a.date === date);
  const nowTime = new Date().toLocaleTimeString('ar-EG', { hour12: false });

  if (record) {
    record.status = status;
    record.notes = notes || record.notes;
    record.recordedBy = user.username;
    record.updatedAt = new Date().toISOString();
  } else {
    record = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId,
      date,
      status,
      checkInTime: status === 'present' ? nowTime : undefined,
      method: 'manual',
      recordedBy: user.username,
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };
    db.attendance.push(record);
  }

  const student = db.students.find((s: any) => s.id === studentId);
  addAuditLog(db, user.id, user.username, 'ATTENDANCE_MANUAL_MARK', 'attendance', `تعديل يدوي لحضور الطالب: ${student?.fullName || studentId} إلى (${status})`, req);
  saveDb(db);

  res.json({ success: true, record });
});

// 6. Grades & Exams System

// GET /api/grades
app.get('/api/grades', authenticateToken, (req, res) => {
  const db = loadDb();
  let grades = db.grades || [];
  const { studentId, subjectId, examType } = req.query;

  if (studentId) grades = grades.filter((g: any) => g.studentId === studentId);
  if (subjectId) grades = grades.filter((g: any) => g.subjectId === subjectId);
  if (examType) grades = grades.filter((g: any) => g.examType === examType);

  res.json(grades);
});

// POST /api/grades/batch
app.post('/api/grades/batch', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { examType, subjectId, records } = req.body;

  if (!examType || !subjectId || !Array.isArray(records)) {
    res.status(400).json({ error: 'بيانات الرصد غير مكتملة.' });
    return;
  }

  const db = loadDb();
  if (!db.grades) db.grades = [];
  const subject = db.subjects.find((s: any) => s.id === subjectId);

  for (const item of records) {
    const score = Number(item.score);
    const maxScore = Number(item.maxScore) || (subject ? subject.maxScore : 100);
    const percentage = Number(((score / maxScore) * 100).toFixed(1));

    const existingIndex = db.grades.findIndex((g: any) => g.studentId === item.studentId && g.subjectId === subjectId && g.examType === examType);

    const gradeEntry = {
      id: existingIndex !== -1 ? db.grades[existingIndex].id : `grd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: item.studentId,
      subjectId,
      examType,
      score,
      maxScore,
      percentage,
      teacherName: item.teacherName || user.fullName,
      recordedBy: user.username,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      db.grades[existingIndex] = gradeEntry;
    } else {
      db.grades.push(gradeEntry);
    }
  }

  addAuditLog(db, user.id, user.username, 'GRADES_RECORDED_BATCH', 'grades', `رصد درجات مادة: ${subject?.nameAr || subjectId} لامتحان (${examType}) لعدد ${records.length} طالب`, req);
  saveDb(db);

  res.json({ success: true, count: records.length });
});

// 7. Assessments, Homework & Discipline

// GET & POST /api/assessments
app.get('/api/assessments', authenticateToken, (req, res) => {
  const db = loadDb();
  res.json(db.assessments || []);
});

app.post('/api/assessments', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const { studentId, category, titleAr, scoreOrGrade, notes, date } = req.body;

  const newAssessment = {
    id: `ass-${Date.now()}`,
    studentId,
    category: category || 'participation',
    titleAr,
    scoreOrGrade,
    notes: notes || '',
    teacherName: user.fullName,
    date: date || new Date().toISOString().split('T')[0]
  };

  if (!db.assessments) db.assessments = [];
  db.assessments.unshift(newAssessment);
  addAuditLog(db, user.id, user.username, 'ASSESSMENT_ADDED', 'system', `إضافة تقييم للطالب: ${titleAr}`, req);
  saveDb(db);

  res.json({ success: true, assessment: newAssessment });
});

// GET & POST /api/homework
app.get('/api/homework', authenticateToken, (req, res) => {
  const db = loadDb();
  res.json(db.homeworks || []);
});

app.post('/api/homework', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const { title, subjectId, grade, sectionClass, description, dueDate, attachments } = req.body;

  const newHw = {
    id: `hw-${Date.now()}`,
    title,
    subjectId,
    grade,
    sectionClass,
    description,
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate,
    attachments: attachments || [],
    teacherName: user.fullName,
    submissions: []
  };

  if (!db.homeworks) db.homeworks = [];
  db.homeworks.unshift(newHw);
  addAuditLog(db, user.id, user.username, 'HOMEWORK_CREATED', 'system', `إضافة واجب جديد: ${title}`, req);
  saveDb(db);

  res.json({ success: true, homework: newHw });
});

// POST /api/homework/:id/submission
app.post('/api/homework/:id/submission', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const hw = (db.homeworks || []).find((h: any) => h.id === req.params.id);
  if (!hw) {
    res.status(404).json({ error: 'الواجب غير موجود.' });
    return;
  }

  const { studentId, status, grade, teacherFeedback } = req.body;
  if (!hw.submissions) hw.submissions = [];
  const existingSubIndex = hw.submissions.findIndex((s: any) => s.studentId === studentId);

  const subData = {
    studentId,
    status: status || 'corrected',
    grade: grade !== undefined ? Number(grade) : undefined,
    teacherFeedback: teacherFeedback || '',
    submittedAt: new Date().toISOString()
  };

  if (existingSubIndex !== -1) {
    hw.submissions[existingSubIndex] = { ...hw.submissions[existingSubIndex], ...subData };
  } else {
    hw.submissions.push(subData);
  }

  saveDb(db);
  res.json({ success: true, homework: hw });
});

// GET & POST /api/discipline
app.get('/api/discipline', authenticateToken, (req, res) => {
  const db = loadDb();
  res.json(db.discipline || []);
});

app.post('/api/discipline', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const { studentId, type, title, details, actionTaken, date } = req.body;

  const newRecord = {
    id: `disc-${Date.now()}`,
    studentId,
    type: type || 'infraction',
    title,
    details,
    actionTaken: actionTaken || '',
    recordedBy: user.fullName || user.username,
    date: date || new Date().toISOString().split('T')[0]
  };

  if (!db.discipline) db.discipline = [];
  db.discipline.unshift(newRecord);
  addAuditLog(db, user.id, user.username, 'DISCIPLINE_RECORD_ADDED', 'system', `تسجيل سلوك/مخالفة: ${title} للطالب`, req);
  saveDb(db);

  res.json({ success: true, record: newRecord });
});

// 8. Audit Logs & Outbox Emails (Admin only)
app.get('/api/audit-logs', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }
  const db = loadDb();
  res.json(db.auditLogs || []);
});

app.get('/api/outbox-emails', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }
  const db = loadDb();
  res.json(db.outboxEmails || []);
});

// 9. System Settings & Backup
app.get('/api/system/settings', authenticateToken, (req, res) => {
  const db = loadDb();
  res.json(db.settings || {});
});

app.post('/api/system/settings', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }
  const db = loadDb();
  db.settings = { ...db.settings, ...req.body };
  addAuditLog(db, user.id, user.username, 'SETTINGS_UPDATED', 'system', 'تعديل إعدادات النظام المدرسية', req);
  saveDb(db);
  res.json({ success: true, settings: db.settings });
});

// POST /api/system/test-email
app.post('/api/system/test-email', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }
  const { toEmail } = req.body;
  const db = loadDb();
  const targetEmail = toEmail || db.settings?.smtpUser || 'mallawigovlanguageschool@gmail.com';

  const sendResult = await sendRealEmail({
    to: targetEmail,
    subject: 'اختبار سيرفر البريد الإلكتروني - مدرسة ملوي الرسمية للغات',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #c8102e; margin-top: 0;">مدرسة ملوي الرسمية للغات - Secondary Control</h2>
        <p>مرحباً <strong>${user.fullName}</strong>،</p>
        <p>هذه رسالة اختبارية لتأكيد عمل سيرفر البريد الإلكتروني بنجاح.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; color: #166534; font-weight: bold; margin: 15px 0;">
          ✓ تم التحقق: سيرفر البريد متصل ويعمل تلقائياً عند قبول طلبات المعلمين وأعضاء الكنترول بدون أي تدخل يدوي منك.
        </div>
        <p style="color: #64748b; font-size: 12px;">تاريخ ووقت الاختبار: ${new Date().toLocaleString('ar-EG')}</p>
      </div>
    `,
    text: 'مدرسة ملوي الرسمية للغات - اختبار سيرفر البريد ناجح.',
    settings: db.settings
  });

  if (sendResult.delivered) {
    res.json({ success: true, message: `تم إرسال بريد الاختبار بنجاح إلى (${targetEmail}).` });
  } else {
    res.status(400).json({ error: sendResult.error || 'فشل إرسال البريد التجريبي.' });
  }
});

app.get('/api/system/backup', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية غير كافية.' });
    return;
  }
  const db = loadDb();
  res.setHeader('Content-Disposition', `attachment; filename="mallawi_control_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

// Vite Middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Mallawi School Control Server] Running on http://${HOST}:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[Mallawi School Control Server] Startup error:', err);
  });
}
