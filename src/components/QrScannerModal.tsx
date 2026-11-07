import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { api } from '../lib/api';
import { Student, AttendanceRecord } from '../types';
import { formatGradeArabic } from '../lib/export';
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Keyboard,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Clock,
  UserCheck
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onAttendanceUpdated?: () => void;
}

export const QrScannerModal: React.FC<Props> = ({ onClose, onAttendanceUpdated }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isCheckout, setIsCheckout] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [lastScannedStudent, setLastScannedStudent] = useState<{
    student: Student;
    record: AttendanceRecord;
    message: string;
    action: string;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Audio beep generator using Web Audio API
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isSuccess ? 0.2 : 0.4));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.2 : 0.4));
    } catch (e) {
      // AudioContext may be restricted before gesture
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setIsScanning(true);
        requestScan();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      setCameraError('تعذر فتح الكاميرا (يرجى السماح بالوصول للكاميرا أو استخدام الإدخال اليدوي/الباركود).');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleQrDetected = async (codeString: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setScanError(null);

    try {
      const res = await api.scanQrAttendance({
        qrCodeString: codeString,
        isCheckout
      });

      playBeep(true);
      setLastScannedStudent({
        student: res.student,
        record: res.record,
        message: res.message,
        action: res.action
      });
      if (onAttendanceUpdated) onAttendanceUpdated();
    } catch (err: any) {
      playBeep(false);
      setScanError(err.message || 'حدث خطأ أثناء تسجيل الحضور');
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1500); // 1.5s cooldown before next auto scan to prevent fluttering
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data && !isSubmitting) {
          handleQrDetected(code.data);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const requestScan = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleQrDetected(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-red-700 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                قارئ رمز QR الذكي - مدرسة ملوي الرسمية للغات
              </h3>
              <p className="text-[11px] text-stone-500">تسجيل مباشر للحضور والانصراف مع منع التكرار</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switch Check-in vs Check-out */}
            <button
              onClick={() => setIsCheckout(!isCheckout)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                isCheckout
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isCheckout ? 'وضع: تسجيل انصراف' : 'وضع: تسجيل حضور صباحي'}</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Camera Viewport or Fallback */}
          <div className="relative w-full aspect-video md:aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden flex items-center justify-center border border-stone-800">
            {hasCamera ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56 border-2 border-red-500/80 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-red-600 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-red-600 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-red-600 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-red-600 rounded-br" />
                    <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_#ef4444] animate-bounce" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>الكاميرا تعمل - وجّه رمز QR داخل الإطار</span>
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-stone-300">
                <Camera className="w-12 h-12 text-stone-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">{cameraError || 'الكاميرا غير متوفرة'}</p>
                <p className="text-xs text-stone-400 mt-1">يمكنك استخدام قارئ الباركود اليدوي أو كتابة كود الطالب أدناه.</p>
              </div>
            )}
          </div>

          {/* Quick Manual Input / Barcode Scanner Gun */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="أدخل كود الطالب (مثال: MOLS-26-101) أو مسح جهاز الباركود USB..."
                className="w-full pr-9 pl-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-600 dark:text-stone-100"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !manualCode.trim()}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              تسجيل
            </button>
          </form>

          {/* Real-time Result Notification */}
          {lastScannedStudent && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {lastScannedStudent.student.fullName}
                  </span>
                  <span className="font-mono text-xs font-bold bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                    {lastScannedStudent.student.studentId}
                  </span>
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{formatGradeArabic(lastScannedStudent.student.grade)}</span>
                  <span>فصل {lastScannedStudent.student.sectionClass}</span>
                  <span className="flex items-center gap-1 font-mono text-stone-700 dark:text-stone-200">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    {lastScannedStudent.record.checkInTime || lastScannedStudent.record.checkOutTime}
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 mt-1">
                  {lastScannedStudent.message}
                </p>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-xs font-medium text-red-800 dark:text-red-200">{scanError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
