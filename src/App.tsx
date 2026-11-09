import React, { useState, useEffect } from 'react';
import { api, getAuthToken, removeAuthToken } from './lib/api';
import {
  User,
  Student,
  Subject,
  GradeRecord,
  AttendanceRecord,
  Assessment,
  Homework,
  DisciplineRecord
} from './types';
import { LoginView } from './components/LoginView';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { GradesView } from './components/GradesView';
import { AssessmentsAndHomeworkView } from './components/AssessmentsAndHomeworkView';
import { DisciplineView } from './components/DisciplineView';
import { ReportsView } from './components/ReportsView';
import { UsersManagementView } from './components/UsersManagementView';
import { SettingsAndAuditView } from './components/SettingsAndAuditView';
import { QrScannerModal } from './components/QrScannerModal';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  QrCode,
  Award,
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  UserCog,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Cloud
} from 'lucide-react';
import { testConnection } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);

  // Dual-theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('mols_theme') === 'dark';
  });

  // App data caches
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [discipline, setDiscipline] = useState<DisciplineRecord[]>([]);

  // Apply dark theme class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mols_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mols_theme', 'light');
    }
  }, [isDark]);

  // Load current user and app data on mount
  const refreshAllData = async () => {
    try {
      const [st, sub, grd, att, ass, hw, disc] = await Promise.all([
        api.getStudents(),
        api.getSubjects(),
        api.getGrades(),
        api.getAttendance(),
        api.getAssessments(),
        api.getHomework(),
        api.getDiscipline()
      ]);

      setStudents(st);
      setSubjects(sub);
      setGrades(grd);
      setAttendance(att);
      setAssessments(ass);
      setHomeworks(hw);
      setDiscipline(disc);
    } catch (err) {
      console.error('Error fetching school data:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          setMustChangePassword(!!res.user.mustChangePassword);
          await refreshAllData();
        } catch (err) {
          removeAuthToken();
          setCurrentUser(null);
        }
      }
      setIsInitializing(false);
    };

    initAuth();
    testConnection().then((connected) => {
      setIsCloudConnected(connected);
    });
  }, []);

  const handleLoginSuccess = (user: User, forceChange: boolean) => {
    setCurrentUser(user);
    setMustChangePassword(forceChange);
    refreshAllData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    removeAuthToken();
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <img
            src="/assets/aistudio/logopng_2bf70979.png"
            alt="Mallawi Official Language School"
            className="w-20 h-20 object-contain animate-pulse"
          />
        </div>
        <div className="w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-bold text-stone-600 dark:text-stone-400">
          جارٍ تحميل كنترول مدرسة ملوي الرسمية للغات...
        </p>
      </div>
    );
  }

  // If user is not authenticated, ONLY render LoginView
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم العامة', icon: LayoutDashboard },
    { id: 'students', label: 'شؤون الطلاب وقاعدة البيانات', icon: Users },
    { id: 'attendance', label: 'الحضور والغياب', icon: UserCheck },
    { id: 'grades', label: 'الكنترول والدرجات', icon: Award },
    { id: 'assessments', label: 'التقييمات والواجبات', icon: Sparkles },
    { id: 'discipline', label: 'الالتزام والانضباط', icon: ShieldAlert },
    { id: 'reports', label: 'التقارير والشهادات الرسمية', icon: FileSpreadsheet },
    ...(currentUser.role === 'admin'
      ? [
          { id: 'users', label: 'المستخدمون وطلبات الحسابات', icon: UserCog },
          { id: 'settings', label: 'إعدادات الكنترول والرقابة', icon: Settings }
        ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row antialiased">
      {/* Forced Password Change Modal on first login */}
      {mustChangePassword && (
        <ForcePasswordChangeModal
          username={currentUser.username}
          onSuccess={() => {
            setMustChangePassword(false);
            if (currentUser) {
              setCurrentUser({ ...currentUser, mustChangePassword: false });
            }
          }}
        />
      )}

      {/* QR Scanner Modal (Global Trigger) */}
      {isQrScannerOpen && (
        <QrScannerModal
          onClose={() => setIsQrScannerOpen(false)}
          onAttendanceUpdated={refreshAllData}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 right-0 z-40 h-screen w-72 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpenMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } no-print`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar School Branding Header */}
          <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/logopng_2bf70979.png"
                alt="Mallawi Official Language School"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div className="min-w-0 flex-1 text-right">
                <h2 className="text-xs font-black text-stone-900 dark:text-stone-100 leading-tight truncate">
                  مدرسة ملوي الرسمية للغات
                </h2>
                <div className="text-[10px] font-bold text-red-700 dark:text-red-400 truncate uppercase mt-0.5">
                  Mallawi Official Language School
                </div>
                <div className="text-[9px] font-bold text-stone-500 truncate mt-0.5">
                  Secondary Control
                </div>
              </div>

              {/* Close button for mobile drawer */}
              <button
                onClick={() => setIsSidebarOpenMobile(false)}
                className="md:hidden p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick QR Scanner CTA in Sidebar */}
          <div className="px-4 pt-4">
            <button
              onClick={() => {
                setIsQrScannerOpen(true);
                setIsSidebarOpenMobile(false);
              }}
              className="w-full py-2.5 px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>فتح ماسح QR للحضور</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsSidebarOpenMobile(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-extrabold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-red-700 dark:text-red-400' : 'text-stone-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Block & Logout */}
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 text-right">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  @{currentUser.username} · {currentUser.role === 'admin' ? 'مدير الكنترول' : 'معلم'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer shrink-0"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">
                {navItems.find((n) => n.id === activeView)?.label || 'الرئيسية'}
              </span>
              <span className="text-stone-300 dark:text-stone-700">/</span>
              <span className="text-xs font-bold text-red-700 dark:text-red-400">
                مدرسة ملوي الرسمية للغات
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick QR Scanner button in header */}
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>قارئ QR</span>
            </button>

            {/* Cloud Firestore Online Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isCloudConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
              title="سحابة Firebase Firestore (gen-lang-client-0981115609)"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <Cloud className="w-3.5 h-3.5" />
              <span>{isCloudConnected ? 'سحابة Firestore متصلة' : 'سحابة Firestore جاهزة'}</span>
            </div>

            {/* Academic Year indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl font-mono">
              <span>العام: 2026/2027</span>
              <span>·</span>
              <span>ترم 1</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              students={students}
              attendance={attendance}
              grades={grades}
              currentUser={currentUser}
              onNavigate={(v) => setActiveView(v)}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
            />
          )}

          {activeView === 'students' && (
            <StudentsView students={students} onRefresh={refreshAllData} />
          )}

          {activeView === 'attendance' && (
            <AttendanceView
              students={students}
              attendance={attendance}
              onRefresh={refreshAllData}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
            />
          )}

          {activeView === 'grades' && (
            <GradesView
              students={students}
              subjects={subjects}
              grades={grades}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'assessments' && (
            <AssessmentsAndHomeworkView
              students={students}
              subjects={subjects}
              assessments={assessments}
              homeworks={homeworks}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'discipline' && (
            <DisciplineView
              students={students}
              discipline={discipline}
              onRefresh={refreshAllData}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              students={students}
              attendance={attendance}
              grades={grades}
              subjects={subjects}
            />
          )}

          {activeView === 'users' && currentUser.role === 'admin' && (
            <UsersManagementView currentUser={currentUser} />
          )}

          {activeView === 'settings' && currentUser.role === 'admin' && (
            <SettingsAndAuditView onRefresh={refreshAllData} />
          )}
        </main>
      </div>
    </div>
  );
}
