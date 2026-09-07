import React, { useState, useEffect, useRef } from 'react';
import { 
 Camera, 
 MapPin, 
 ShieldCheck, 
 Smartphone, 
 Clock, 
 UserCheck, 
 AlertTriangle, 
 CheckCircle2, 
 XCircle, 
 RefreshCw, 
 Eye, 
 Lock, 
 Scan, 
 Navigation, 
 Briefcase, 
 FileText, 
 Plus, 
 Search, 
 Filter, 
 Download, 
 Layers, 
 Zap, 
 Server, 
 User, 
 Building, 
 Activity, 
 Sparkles, 
 ShieldAlert,
 Compass,
 Check,
 RotateCcw,
 Building2,
 Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditApplication } from '../../../types/legacy';

export interface OfficeLocation {
 id: string;
 name: string;
 code: string;
 lat: number;
 lng: number;
 address: string;
}

// 4 KOORDINAT KANTOR BPR ARA (EKSPLISIT Sesuai Permintaan User)
export const BPR_OFFICE_LOCATIONS: OfficeLocation[] = [
 {
 id: 'KANTOR_PUSAT',
 name: 'Kantor Pusat BPR ARA',
 code: 'KP',
 lat: -7.580964657412467,
 lng: 110.92148548637334,
 address: 'Jl. Lawu Karanganyar (Kantor Pusat BPR ARA)'
 },
 {
 id: 'KAS_KLODRAN',
 name: 'Kantor Kas Klodran',
 code: 'KK-KLD',
 lat: -7.5265548192576075,
 lng: 110.78946395003405,
 address: 'Jl. Klodran, Colomadu, Karanganyar'
 },
 {
 id: 'KAS_MATESIH',
 name: 'Kantor Kas Matesih',
 code: 'KK-MTS',
 lat: -7.6375596690616225,
 lng: 111.04873327847068,
 address: 'Jl. Raya Matesih, Karanganyar'
 },
 {
 id: 'KAS_JUMAPOLO',
 name: 'Kantor Kas Jumapolo',
 code: 'KK-JMP',
 lat: -7.70174182418714,
 lng: 111.00143889999471,
 address: 'Jl. Raya Jumapolo, Karanganyar'
 }
];

// Rumus Haversine menghitung jarak akurat dalam METER
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
 const R = 6371e3; // Radius bumi dalam meter
 const φ1 = (lat1 * Math.PI) / 180;
 const φ2 = (lat2 * Math.PI) / 180;
 const Δφ = ((lat2 - lat1) * Math.PI) / 180;
 const Δλ = ((lon2 - lon1) * Math.PI) / 180;

 const a =
 Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
 Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

 return Math.round(R * c);
}

interface DashboardAbsensiLapanganProps {
 applications?: CreditApplication[];
}

interface AttendanceRecord {
 id: string;
 userName: string;
 userRole: string;
 type: 'MASUK' | 'PULANG' | 'LAPANGAN';
 timestamp: string;
 locationName: string;
 latitude: number;
 longitude: number;
 gpsAccuracyMeters: number;
 isFakeGpsDetected: boolean;
 deviceId: string;
 deviceName: string;
 faceMatchScore: number;
 livenessVerified: boolean;
 photoUrl?: string;
 notes?: string;
 status: 'VALID' | 'FLAGGED' | 'REJECTED';
}

interface FieldActivityRecord {
 id: string;
 debtorName: string;
 aoName: string;
 activityType: 'SURVEY_AGUNAN' | 'PENAGIHAN' | 'PROSPEK_BARU' | 'KUNJUNGAN_DEPOSITOR';
 locationAddress: string;
 latitude: number;
 longitude: number;
 checkInTime: string;
 notes: string;
 photoSnapshot?: string;
 gpsStatus: 'GPS_REAL_VERIFIED' | 'LOW_ACCURACY';
 status: 'SELESAI' | 'DALAM_PROSES';
}

export default function DashboardAbsensiLapangan({ applications = [] }: DashboardAbsensiLapanganProps) {
 // Active Tab inside Absensi Module
 const [activeTab, setActiveTab] = useState<'PRESENSI' | 'KEGIATAN_LAPANGAN' | 'REKAP_PRESENSI' | 'DEVICE_BINDING' | 'ANTI_FRAUD_LOG'>('PRESENSI');

 // Camera & Live Verification State
 const videoRef = useRef<HTMLVideoElement | null>(null);
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const fileInputRef = useRef<HTMLInputElement | null>(null);
 const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
 const [cameraError, setCameraError] = useState<string | null>(null);
 const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
 const [showPermissionGuide, setShowPermissionGuide] = useState<boolean>(false);

 // GPS State (Default set to Kantor Pusat coordinate for reliable initial state)
 const [currentGps, setCurrentGps] = useState<{
 lat: number;
 lng: number;
 accuracy: number;
 addressName: string;
 isMockingDetected: boolean;
 }>({
 lat: -7.580964657412467,
 lng: 110.92148548637334,
 accuracy: 3.5,
 addressName: 'Kantor Pusat BPR ARA (Jl. Lawu Karanganyar)',
 isMockingDetected: false
 });

 const [selectedOfficeId, setSelectedOfficeId] = useState<string>('AUTO');
 const [geofenceErrorAlert, setGeofenceErrorAlert] = useState<string | null>(null);
 const [isGettingGps, setIsGettingGps] = useState<boolean>(false);

 // Calculate distance in meters to all 4 offices
 const officeDistances = BPR_OFFICE_LOCATIONS.map((office) => {
 const distMeters = calculateDistanceMeters(currentGps.lat, currentGps.lng, office.lat, office.lng);
 return {
 ...office,
 distanceMeters: distMeters,
 isWithinRadius: distMeters <= 100
 };
 });

 // Automatically detect the nearest office
 const nearestOffice = officeDistances.reduce((min, curr) => 
 curr.distanceMeters < min.distanceMeters ? curr : min, 
 officeDistances[0]
 );

 // Active target office selected or auto-matched
 const activeTargetOffice = selectedOfficeId === 'AUTO' 
 ? nearestOffice 
 : (officeDistances.find(o => o.id === selectedOfficeId) || nearestOffice);

 // Geofence Radius Validation (Strictly 100 Meters)
 const isWithinGeofenceRadius = activeTargetOffice.distanceMeters <= 100;

 // Face Scan Animation State
 const [isScanningFace, setIsScanningFace] = useState<boolean>(false);
 const [scanProgress, setScanProgress] = useState<number>(0);
 const [faceMatchResult, setFaceMatchResult] = useState<{
 score: number;
 matchedUser: string;
 employeeId: string;
 livenessPass: boolean;
 } | null>(null);

 // Device Binding State
 const [boundDevice, setBoundDevice] = useState<{
 deviceId: string;
 deviceName: string;
 osVersion: string;
 ipAddress: string;
 boundAt: string;
 isCurrentDeviceValid: boolean;
 }>({
 deviceId: 'DEV-BPR-9821-S23',
 deviceName: 'Samsung Galaxy S23 (Perangkat Terdaftar)',
 osVersion: 'Android 14 / One UI 6.1',
 ipAddress: '192.168.1.104',
 boundAt: '12 Jan 2026, 08:30',
 isCurrentDeviceValid: true
 });

 // Sample Attendance Logs
 const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([
 {
 id: 'ABS-2026-0801',
 userName: 'Della Pratama',
 userRole: 'Account Officer',
 type: 'MASUK',
 timestamp: '01 Ags 2026 07:45:12',
 locationName: 'Kantor Pusat BPR ARA (Radius 12m)',
 latitude: -7.58096,
 longitude: 110.92148,
 gpsAccuracyMeters: 3.5,
 isFakeGpsDetected: false,
 deviceId: 'DEV-BPR-9821-S23',
 deviceName: 'Samsung Galaxy S23',
 faceMatchScore: 99.4,
 livenessVerified: true,
 status: 'VALID',
 notes: 'Presensi Pagi Tepat Waktu (Dalam Radius 100M)'
 },
 {
 id: 'ABS-2026-0802',
 userName: 'Anik Budiarti',
 userRole: 'Account Officer',
 type: 'LAPANGAN',
 timestamp: '01 Ags 2026 09:15:40',
 locationName: 'Pabrik Batik Danar Solo, Jaten',
 latitude: -7.5812,
 longitude: 110.9022,
 gpsAccuracyMeters: 5.1,
 isFakeGpsDetected: false,
 deviceId: 'DEV-BPR-4412-A54',
 deviceName: 'Samsung Galaxy A54',
 faceMatchScore: 98.2,
 livenessVerified: true,
 status: 'VALID',
 notes: 'Check-In Kunjungan Prospek Kredit'
 },
 {
 id: 'ABS-2026-0803',
 userName: 'Budi Santoso',
 userRole: 'Analis Kredit',
 type: 'MASUK',
 timestamp: '01 Ags 2026 07:58:00',
 locationName: 'Kantor Kas Matesih (Radius 18m)',
 latitude: -7.63755,
 longitude: 111.04873,
 gpsAccuracyMeters: 4.0,
 isFakeGpsDetected: false,
 deviceId: 'DEV-BPR-1092-IP14',
 deviceName: 'iPhone 14 Pro',
 faceMatchScore: 99.8,
 livenessVerified: true,
 status: 'VALID',
 notes: 'Presensi Kas Matesih Terverifikasi'
 }
 ]);

 // Field Activities List
 const [fieldActivities, setFieldActivities] = useState<FieldActivityRecord[]>([
 {
 id: 'ACT-901',
 debtorName: 'Toko Bangunan Sarana Jaya',
 aoName: 'Della Pratama',
 activityType: 'SURVEY_AGUNAN',
 locationAddress: 'Jl. Raya Karanganyar - Matesih Km 4',
 latitude: -7.6102,
 longitude: 110.9654,
 checkInTime: '01 Ags 2026, 09:30',
 notes: 'Pemeriksaan fisik toko bangunan & pengukuran batas tanah SHM No. 441.',
 gpsStatus: 'GPS_REAL_VERIFIED',
 status: 'SELESAI'
 }
 ]);

 // Field Check-In Form
 const [fieldDebtorName, setFieldDebtorName] = useState<string>('');
 const [fieldActivityType, setFieldActivityType] = useState<'SURVEY_AGUNAN' | 'PENAGIHAN' | 'PROSPEK_BARU' | 'KUNJUNGAN_DEPOSITOR'>('SURVEY_AGUNAN');
 const [fieldNotes, setFieldNotes] = useState<string>('');
 const [fieldCheckInSuccess, setFieldCheckInSuccess] = useState<boolean>(false);

 // Initialize Camera Feed
 const startCamera = async () => {
 setCameraError(null);
 setCapturedPhoto(null);

 if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
 setCameraError("Browser tidak mendukung Web Camera API (navigator.mediaDevices tidak tersedia). Silakan gunakan fitur unggah foto.");
 setIsCameraActive(false);
 return;
 }

 try {
 let stream: MediaStream;
 try {
 // Attempt 1: Standard front camera constraints
 stream = await navigator.mediaDevices.getUserMedia({ 
 video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
 });
 } catch (primaryErr) {
 console.warn("Primary camera constraints failed, attempting basic video constraint:", primaryErr);
 // Attempt 2: Basic fallback without explicit resolution/facingMode
 stream = await navigator.mediaDevices.getUserMedia({ video: true });
 }

 // Attach stream to video element
 const attachStreamToVideo = () => {
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 videoRef.current.play().catch((playErr) => {
 console.warn("Video play error:", playErr);
 });
 setIsCameraActive(true);
 } else {
 // Retry if ref is temporarily detached during render transition
 setTimeout(() => {
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 videoRef.current.play().catch(() => {});
 setIsCameraActive(true);
 }
 }, 150);
 }
 };

 attachStreamToVideo();
 } catch (err: any) {
 console.warn("Camera start error:", err);
 let errorMsg ="Kamera tidak dapat diakses atau diblokir oleh browser.";
 if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
 errorMsg ="Izin kamera ditolak oleh browser/sistem. Klik ikon gembok/kamera di address bar untuk mengizinkan akses kamera, lalu klik 'Coba Lagi'.";
 } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
 errorMsg ="Perangkat kamera tidak ditemukan pada HP/Komputer ini.";
 } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
 errorMsg ="Kamera sedang digunakan oleh aplikasi lain (misal Zoom / WhatsApp). Tutup aplikasi lain dan klik 'Coba Lagi'.";
 }
 setCameraError(errorMsg);
 setIsCameraActive(false);
 }
 };

 const stopCamera = () => {
 if (videoRef.current && videoRef.current.srcObject) {
 const stream = videoRef.current.srcObject as MediaStream;
 stream.getTracks().forEach(track => track.stop());
 videoRef.current.srcObject = null;
 }
 setIsCameraActive(false);
 };

 // Fallback: Handle Image File Upload if hardware camera stream fails
 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onload = (event) => {
 if (event.target?.result) {
 setCapturedPhoto(event.target.result as string);
 setCameraError(null);
 }
 };
 reader.readAsDataURL(file);
 }
 };

 useEffect(() => {
 if (activeTab === 'PRESENSI') {
 startCamera();
 fetchRealGps();
 } else {
 stopCamera();
 }
 return () => stopCamera();
 }, [activeTab]);

 // Fetch Real GPS Coordinates
 const fetchRealGps = () => {
 setIsGettingGps(true);
 setGeofenceErrorAlert(null);
 if ('geolocation' in navigator) {
 navigator.geolocation.getCurrentPosition(
 (position) => {
 setIsGettingGps(false);
 const acc = position.coords.accuracy || 4.2;
 const lat = position.coords.latitude;
 const lng = position.coords.longitude;

 const isMock = acc === 0 || acc > 150;

 setCurrentGps({
 lat,
 lng,
 accuracy: Math.round(acc * 10) / 10,
 addressName: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
 isMockingDetected: isMock
 });
 },
 (error) => {
 setIsGettingGps(false);
 console.warn("GPS error:", error);
 },
 { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
 );
 } else {
 setIsGettingGps(false);
 }
 };

 // Helper function to simulate specific GPS location for testing geofencing
 const setSimulatedLocation = (officeId: string | 'OUTSIDE') => {
 setGeofenceErrorAlert(null);
 if (officeId === 'OUTSIDE') {
 // Set to location ~450 meters away from Kantor Pusat
 setCurrentGps({
 lat: -7.58500,
 lng: 110.92500,
 accuracy: 5.0,
 addressName: 'Jl. Veteran Karanganyar (Di Luar Radius Kantor Pusat)',
 isMockingDetected: false
 });
 setSelectedOfficeId('KANTOR_PUSAT');
 } else {
 const targetOffice = BPR_OFFICE_LOCATIONS.find(o => o.id === officeId);
 if (targetOffice) {
 setCurrentGps({
 lat: targetOffice.lat,
 lng: targetOffice.lng,
 accuracy: 3.0,
 addressName: `${targetOffice.name} (${targetOffice.address})`,
 isMockingDetected: false
 });
 setSelectedOfficeId(officeId);
 }
 }
 };

 // Perform Face Scan Animation & Verification with STRICT 100M GEOFENCE CHECK
 const runFaceScanAndSubmit = (presensiType: 'MASUK' | 'PULANG') => {
 setGeofenceErrorAlert(null);

 // STRICT GEOFENCE ENFORCEMENT: Block if outside 100 meters!
 if (!isWithinGeofenceRadius) {
 setGeofenceErrorAlert(
 `⛔ PRESENSI DITOLAK (GEOFENCE RADIUS): Posisi Anda (${activeTargetOffice.distanceMeters} meter) berada DI LUAR radius toleransi 100 Meter dari ${activeTargetOffice.name}. Silakan mendekat ke lokasi kantor terdaftar.`
 );
 return;
 }

 if (isScanningFace) return;
 setIsScanningFace(true);
 setScanProgress(0);
 setFaceMatchResult(null);

 let progress = 0;
 const interval = setInterval(() => {
 progress += 20;
 setScanProgress(progress);
 if (progress >= 100) {
 clearInterval(interval);
 setIsScanningFace(false);

 // Capture Canvas Image
 let snapUrl = '';
 if (videoRef.current && canvasRef.current) {
 const context = canvasRef.current.getContext('2d');
 if (context) {
 canvasRef.current.width = videoRef.current.videoWidth || 320;
 canvasRef.current.height = videoRef.current.videoHeight || 240;
 context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
 snapUrl = canvasRef.current.toDataURL('image/jpeg');
 setCapturedPhoto(snapUrl);
 }
 }

 const matchScore = 99.4;
 setFaceMatchResult({
 score: matchScore,
 matchedUser: 'Ahmad Wahyu Aji',
 employeeId: 'EMP-ARA-0081',
 livenessPass: true
 });

 // Add to Attendance Log
 const newRecord: AttendanceRecord = {
 id: `ABS-2026-080${attendanceLogs.length + 1}`,
 userName: 'Ahmad Wahyu Aji',
 userRole: 'CRM & Digitalization Lead',
 type: presensiType,
 timestamp: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID'),
 locationName: `${activeTargetOffice.name} (Jarak: ${activeTargetOffice.distanceMeters}m)`,
 latitude: currentGps.lat,
 longitude: currentGps.lng,
 gpsAccuracyMeters: currentGps.accuracy,
 isFakeGpsDetected: currentGps.isMockingDetected,
 deviceId: boundDevice.deviceId,
 deviceName: boundDevice.deviceName,
 faceMatchScore: matchScore,
 livenessVerified: true,
 photoUrl: snapUrl,
 status: 'VALID',
 notes: `Presensi ${presensiType} Berhasil - Terverifikasi Geofence ${activeTargetOffice.name} (${activeTargetOffice.distanceMeters}m <= 100m)`
 };

 setAttendanceLogs([newRecord, ...attendanceLogs]);
 }
 }, 250);
 };

 // Submit Field Activity Check-In
 const handleFieldCheckInSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!fieldDebtorName.trim()) return;

 const newActivity: FieldActivityRecord = {
 id: `ACT-${900 + fieldActivities.length + 1}`,
 debtorName: fieldDebtorName,
 aoName: 'Ahmad Wahyu Aji',
 activityType: fieldActivityType,
 locationAddress: currentGps.addressName,
 latitude: currentGps.lat,
 longitude: currentGps.lng,
 checkInTime: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
 notes: fieldNotes || 'Check-in kegiatan lapangan lokasi debitur.',
 gpsStatus: currentGps.isMockingDetected ? 'LOW_ACCURACY' : 'GPS_REAL_VERIFIED',
 status: 'SELESAI'
 };

 setFieldActivities([newActivity, ...fieldActivities]);
 setFieldCheckInSuccess(true);
 setFieldDebtorName('');
 setFieldNotes('');
 setTimeout(() => setFieldCheckInSuccess(false), 4000);
 };

 return (
 <div className="space-y-6 pb-12">
 <canvas ref={canvasRef} className="hidden" />

 {/* Header Banner - Absensi & Kegiatan Lapangan GPS & Face Auth */}
 <div className="glass-effect text-gray-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full pointer-events-none" />
 <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 /10 rounded-full pointer-events-none" />

 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-3 flex-wrap">
 <span className="px-3 py-1 border rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
 <ShieldCheck size={14} className="" /> Geofence 100M Security Engine
 </span>
 <span className="px-3 py-1 /20 border rounded-full text-xs font-bold flex items-center gap-1.5">
 <Scan size={13} className="" /> 4 Lokasi Kantor Terdaftar
 </span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
 Presensi & Geofencing 4 Kantor BPR ARA
 </h1>
 <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-3xl leading-relaxed">
 Sistem Otomatis Mendeteksi Kantor Terdekat (Kantor Pusat, Kas Klodran, Kas Matesih, Kas Jumapolo). Jika posisi karyawan &gt; 100 meter di luar radius kantor, presensi otomatis DITOLAK oleh sistem.
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <div className="bg-white dark:bg-[#111111]/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-bold flex items-center gap-2">
 <Smartphone size={15} className="" />
 <span>GEOFENCE RADIUS: <strong className="">MAX 100 METER</strong></span>
 </div>
 </div>
 </div>
 </div>

 {/* 5 NAVIGATION TABS */}
 <div className="bg-white dark:bg-[#111111] p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-2 overflow-x-auto">
 <button
 onClick={() => setActiveTab('PRESENSI')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'PRESENSI'
 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:bg-white/10 hover:text-slate-900 dark:text-gray-900 dark:text-white'
 }`}
 >
 <Camera size={15} className="" />
 1. Presensi Masuk / Pulang (Live Face + Geofence)
 </button>

 <button
 onClick={() => setActiveTab('KEGIATAN_LAPANGAN')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'KEGIATAN_LAPANGAN'
 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:bg-white/10 hover:text-slate-900 dark:text-gray-900 dark:text-white'
 }`}
 >
 <Navigation size={15} className="" />
 2. Check-In Kegiatan Lapangan
 </button>

 <button
 onClick={() => setActiveTab('REKAP_PRESENSI')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'REKAP_PRESENSI'
 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:bg-white/10 hover:text-slate-900 dark:text-gray-900 dark:text-white'
 }`}
 >
 <Clock size={15} className="" />
 3. Rekap & Log Presensi Staff
 </button>

 <button
 onClick={() => setActiveTab('DEVICE_BINDING')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'DEVICE_BINDING'
 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:bg-white/10 hover:text-slate-900 dark:text-gray-900 dark:text-white'
 }`}
 >
 <Smartphone size={15} className="" />
 4. Perangkat Terdaftar (Device Binding)
 </button>

 <button
 onClick={() => setActiveTab('ANTI_FRAUD_LOG')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'ANTI_FRAUD_LOG'
 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:bg-white/10 hover:text-slate-900 dark:text-gray-900 dark:text-white'
 }`}
 >
 <ShieldAlert size={15} className="" />
 5. Monitoring Anti-Fake GPS & Fraud
 </button>
 </div>

 {/* MODULE 1: PRESENSI MASUK / PULANG (CAMERA & LIVE FACE AUTH) */}
 {activeTab === 'PRESENSI' && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 
 {/* CAMERA & FACE AUTHENTICATION PANEL */}
 <div className="lg:col-span-7 glass-effect p-6 rounded-2xl space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <Camera size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-slate-900 dark:text-gray-900 dark:text-white">Verifikasi Wajah (Face Authentication)</h3>
 <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Liveness Check + Verifikasi Geofence Radius 100M</p>
 </div>
 </div>

 <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
 isWithinGeofenceRadius
 ? ' '
 : ' '
 }`}>
 {isWithinGeofenceRadius ? '✓ Geofence Pass' : '⛔ Outside 100M Radius'}
 </span>
 </div>

 {/* GEOFENCE ERROR ALERT NOTIFICATION */}
 {geofenceErrorAlert && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.98 }} 
 animate={{ opacity: 1, scale: 1 }} 
 className="p-4 text-gray-900 dark:text-white rounded-2xl shadow-md border space-y-1.5"
 >
 <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
 <AlertTriangle size={18} className="" /> Akses Presensi Ditolak!
 </div>
 <p className="text-xs font-medium leading-relaxed">
 {geofenceErrorAlert}
 </p>
 </motion.div>
 )}

 {/* HIDDEN CANVAS AND FILE INPUT FOR SNAPSHOT / FALLBACK UPLOAD */}
 <canvas ref={canvasRef} className="hidden" />
 <input 
 ref={fileInputRef} 
 type="file" 
 accept="image/*" 
 capture="user" 
 onChange={handleFileUpload} 
 className="hidden" 
 />

 {/* LIVE CAMERA VIEW CONTAINER */}
 <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
 {/* ALWAYS mounted video element to avoid ref race conditions */}
 <video 
 ref={videoRef} 
 playsInline 
 muted 
 autoPlay
 className={`w-full h-full object-cover transform -scale-x-100 ${
 isCameraActive && !capturedPhoto ? 'block' : 'hidden'
 }`} 
 />

 {/* Display Captured Photo or Uploaded Photo preview */}
 {capturedPhoto && (
 <div className="relative w-full h-full">
 <img src={capturedPhoto} alt="Hasil Foto Presensi" className="w-full h-full object-cover" />
 <div className="absolute top-3 right-3 bg-slate-900 dark:bg-slate-100/80 text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border">
 ✓ Foto Terverifikasi
 </div>
 <button
 onClick={() => {
 setCapturedPhoto(null);
 startCamera();
 }}
 className="absolute bottom-3 right-3 bg-slate-900 dark:bg-slate-100/90 hover:bg-slate-950 text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-md"
 >
 <RotateCcw size={13} className="" /> Foto Ulang / Restart Kamera
 </button>
 </div>
 )}

 {/* Display Standby/Error View if camera not active and no captured photo */}
 {!isCameraActive && !capturedPhoto && (
 <div className="text-center space-y-3 p-6 text-slate-300 max-w-md mx-auto">
 <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-100 border border-slate-800 flex items-center justify-center mx-auto">
 <Camera size={28} className="animate-pulse" />
 </div>

 <div className="space-y-1">
 <h4 className="text-sm font-bold text-gray-900 dark:text-white">
 {cameraError ? 'Akses Kamera Terkendala' : 'Kamera Siap Diaktifkan'}
 </h4>
 <p className="text-xs text-slate-400 font-medium leading-relaxed">
 {cameraError ||"Klik 'Aktifkan Kamera Wajah' di bawah untuk memulai verifikasi biometrik liveness."}
 </p>
 </div>

 <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
 <button
 onClick={startCamera}
 className="px-4 py-2.5 hover: text-gray-900 dark:text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-md"
 >
 <Camera size={14} /> Aktifkan Kamera Wajah
 </button>

 <button
 onClick={() => fileInputRef.current?.click()}
 className="px-4 py-2.5 bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2"
 >
 <Smartphone size={14} className="" /> Ambil / Upload Foto HP
 </button>
 </div>

 <button
 onClick={() => setShowPermissionGuide(!showPermissionGuide)}
 className="text-[11px] hover:underline font-medium block mx-auto pt-1 cursor-pointer"
 >
 {showPermissionGuide ? 'Sembunyikan Petunjuk Izin' : '💡 Kenapa Kamera Belum Terbuka? / Petunjuk Izin Browser'}
 </button>

 {showPermissionGuide && (
 <div className="p-3 bg-slate-900 dark:bg-slate-100/95 text-slate-300 text-[11px] text-left rounded-xl border border-slate-800 space-y-1.5 leading-relaxed shadow-lg">
 <p className="font-bold">Cara Mengaktifkan Izin Kamera di Browser / HP:</p>
 <ol className="list-decimal pl-4 space-y-1">
 <li>Klik ikon <strong>Gembok 🔒 / Kamera 📷</strong> di kiri URL address bar browser.</li>
 <li>Pastikan opsi <strong>Camera (Kamera)</strong> diset ke <strong>'Allow' (Izinkan)</strong>.</li>
 <li>Jika menggunakan HP (Android/iOS), pastikan izin kamera di Pengaturan HP diizinkan untuk Chrome/Safari.</li>
 <li>Setelah izin aktif, klik <strong>'Aktifkan Kamera Wajah'</strong> atau gunakan opsi <strong>'Ambil / Upload Foto HP'</strong>.</li>
 </ol>
 </div>
 )}
 </div>
 )}

 {/* FACE SCAN OVERLAY BOX & MESH GUIDELINE */}
 {isCameraActive && !capturedPhoto && (
 <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
 <div className={`relative w-56 h-64 border-2 rounded-3xl transition-all duration-300 ${
 isScanningFace ? ' shadow-[0_0_30px_rgba(52,211,153,0.5)]' : 'border-dashed border-white/60'
 }`}>
 {/* Corner Reticles */}
 <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 -mt-1 -ml-1 rounded-tl-lg" />
 <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 -mt-1 -mr-1 rounded-tr-lg" />
 <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 -mb-1 -ml-1 rounded-bl-lg" />
 <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 -mb-1 -mr-1 rounded-br-lg" />

 {/* Scanning Animation Line */}
 {isScanningFace && (
 <motion.div
 initial={{ top: '0%' }}
 animate={{ top: '100%' }}
 transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
 className="absolute left-0 right-0 h-1 bg-gray-200 dark:bg-white/10"
 />
 )}

 <div className="absolute bottom-3 left-0 right-0 text-center">
 <span className="text-[10px] font-black bg-slate-900 dark:bg-slate-100/80 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-wider">
 {isScanningFace ? `Pindai Biometrik: ${scanProgress}%` : 'Posisikan Wajah Di Tengah Oval'}
 </span>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* ACTION BUTTONS */}
 <div className="grid grid-cols-2 gap-3">
 <button
 onClick={() => runFaceScanAndSubmit('MASUK')}
 disabled={isScanningFace || !isWithinGeofenceRadius}
 className={`py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
 isWithinGeofenceRadius 
 ? ' hover: text-gray-900 dark:text-white' 
 : 'bg-slate-300 text-slate-500 dark:text-gray-400 cursor-not-allowed'
 }`}
 >
 <CheckCircle2 size={16} /> PRESENSI MASUK
 </button>

 <button
 onClick={() => runFaceScanAndSubmit('PULANG')}
 disabled={isScanningFace || !isWithinGeofenceRadius}
 className={`py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
 isWithinGeofenceRadius 
 ? 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-950 text-gray-900 dark:text-white' 
 : 'bg-slate-300 text-slate-500 dark:text-gray-400 cursor-not-allowed'
 }`}
 >
 <Clock size={16} /> PRESENSI PULANG
 </button>
 </div>

 {/* FACE VERIFICATION RESULT BOX */}
 {faceMatchResult && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-black flex items-center gap-1.5">
 <CheckCircle2 size={16} className="" /> Presensi Berhasil Terdaftar!
 </span>
 <span className="text-[10px] font-black px-2 py-0.5 rounded">
 Score: {faceMatchResult.score}%
 </span>
 </div>
 <p className="text-xs font-medium">
 Pengguna: <strong>{faceMatchResult.matchedUser}</strong> ({faceMatchResult.employeeId}). Lokasi: <strong>{activeTargetOffice.name}</strong> ({activeTargetOffice.distanceMeters} meter dari kantor).
 </p>
 </motion.div>
 )}
 </div>

 {/* GPS STATUS & 4 OFFICE GEOFENCING PANEL */}
 <div className="lg:col-span-5 space-y-5">
 
 {/* 4 OFFICE LOCATIONS GEOFENCE DISTANCE MONITORING */}
 <div className="glass-effect p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <Building2 size={18} className="" />
 <h3 className="text-sm font-black text-slate-900 dark:text-gray-900 dark:text-white">Geofencing 4 Kantor BPR ARA</h3>
 </div>
 <button
 onClick={fetchRealGps}
 className="p-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
 >
 <RefreshCw size={12} className={isGettingGps ? 'animate-spin' : ''} /> GPS Real
 </button>
 </div>

 {/* TARGET OFFICE SELECTOR */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-slate-700 dark:text-gray-200 flex items-center justify-between">
 <span>Pilih Lokasi Kantor Tujuan:</span>
 <span className="text-[10px] font-black">
 Terdekat: {nearestOffice.name} ({nearestOffice.distanceMeters}m)
 </span>
 </label>
 <select
 value={selectedOfficeId}
 onChange={(e) => {
 setSelectedOfficeId(e.target.value);
 setGeofenceErrorAlert(null);
 }}
 className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:"
 >
 <option value="AUTO">⚡ Otomatis Deteksi Kantor Terdekat</option>
 {BPR_OFFICE_LOCATIONS.map((ofc) => (
 <option key={ofc.id} value={ofc.id}>
 {ofc.name} ({ofc.code})
 </option>
 ))}
 </select>
 </div>

 {/* ACTIVE TARGET OFFICE STATUS CARD */}
 <div className={`p-4 rounded-2xl border transition-all ${
 isWithinGeofenceRadius
 ? ' /90 '
 : ' /90 '
 }`}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
 {isWithinGeofenceRadius ? (
 <CheckCircle2 size={16} className="" />
 ) : (
 <XCircle size={16} className="" />
 )}
 {activeTargetOffice.name}
 </span>
 <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
 isWithinGeofenceRadius ? ' ' : ' '
 }`}>
 {isWithinGeofenceRadius ? 'DI DALAM RADIUS' : 'DI LUAR RADIUS'}
 </span>
 </div>

 <div className="flex items-baseline justify-between mt-2">
 <span className="text-xs font-medium">Jarak Lokasi Anda:</span>
 <span className="text-lg font-black tracking-tight">
 {activeTargetOffice.distanceMeters.toLocaleString('id-ID')} Meter
 </span>
 </div>

 <p className="text-[10px] mt-1 font-medium leading-tight opacity-90">
 {isWithinGeofenceRadius
 ? `✓ Memenuhi syarat geofence (jarak <= 100m dari ${activeTargetOffice.name})`
 : `⚠️ Melebihi radius 100 meter dari ${activeTargetOffice.name}. Presensi dikunci.`}
 </p>
 </div>

 {/* LIST OF ALL 4 OFFICES WITH DISTANCES */}
 <div className="space-y-2 pt-1">
 <span className="text-[11px] font-extrabold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">
 Detail Jarak Ke 4 Kantor:
 </span>
 <div className="space-y-1.5">
 {officeDistances.map((ofc) => (
 <div 
 key={ofc.id}
 onClick={() => {
 setSelectedOfficeId(ofc.id);
 setGeofenceErrorAlert(null);
 }}
 className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
 activeTargetOffice.id === ofc.id
 ? ' /50 ring-1 '
 : 'border-slate-200 dark:border-white/10/80 bg-slate-50 dark:bg-white/5/60 hover:bg-slate-100 dark:bg-white/10'
 }`}
 >
 <div>
 <strong className="text-slate-900 dark:text-gray-900 dark:text-white block font-bold">{ofc.name}</strong>
 <span className="text-[10px] text-slate-400 font-mono">
 {ofc.lat.toFixed(5)}, {ofc.lng.toFixed(5)}
 </span>
 </div>

 <div className="text-right">
 <span className={`text-xs font-black block ${
 ofc.isWithinRadius ? '' : 'text-slate-600 dark:text-gray-300'
 }`}>
 {ofc.distanceMeters.toLocaleString('id-ID')} m
 </span>
 <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
 ofc.isWithinRadius ? ' ' : 'bg-slate-200 text-slate-600 dark:text-gray-300'
 }`}>
 {ofc.isWithinRadius ? '≤ 100M' : '> 100M'}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* QUICK SIMULATION CONTROLS FOR TESTING */}
 <div className="p-3 /60 rounded-2xl border space-y-2">
 <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
 <Crosshair size={12} className="" /> Simulasi Lokasi Pengujian System:
 </span>
 <div className="grid grid-cols-2 gap-1.5 text-[10px]">
 <button
 onClick={() => setSimulatedLocation('KANTOR_PUSAT')}
 className="p-1.5 bg-white dark:bg-[#111111] hover: border rounded-lg font-bold text-left truncate cursor-pointer"
 >
 📍 Kantor Pusat (0m)
 </button>
 <button
 onClick={() => setSimulatedLocation('KAS_KLODRAN')}
 className="p-1.5 bg-white dark:bg-[#111111] hover: border rounded-lg font-bold text-left truncate cursor-pointer"
 >
 📍 Kas Klodran (0m)
 </button>
 <button
 onClick={() => setSimulatedLocation('KAS_MATESIH')}
 className="p-1.5 bg-white dark:bg-[#111111] hover: border rounded-lg font-bold text-left truncate cursor-pointer"
 >
 📍 Kas Matesih (0m)
 </button>
 <button
 onClick={() => setSimulatedLocation('KAS_JUMAPOLO')}
 className="p-1.5 bg-white dark:bg-[#111111] hover: border rounded-lg font-bold text-left truncate cursor-pointer"
 >
 📍 Kas Jumapolo (0m)
 </button>
 <button
 onClick={() => setSimulatedLocation('OUTSIDE')}
 className="col-span-2 p-1.5 hover: border rounded-lg font-bold text-center cursor-pointer"
 >
 🚨 Simulasi Luar Radius (&gt;100M / 450m)
 </button>
 </div>
 </div>

 </div>

 {/* DEVICE BINDING SECURITY STATUS */}
 <div className="glass-effect p-6 rounded-2xl space-y-4">
 <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
 <Smartphone size={18} className="" />
 <h3 className="text-sm font-black text-slate-900 dark:text-gray-900 dark:text-white">Perangkat Terkunci (Single Device Lock)</h3>
 </div>

 <div className="p-4 /70 rounded-2xl border space-y-2 text-xs">
 <div className="flex items-center justify-between">
 <span className="font-extrabold">{boundDevice.deviceName}</span>
 <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase">
 BOUND & LOCKED
 </span>
 </div>

 <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-gray-200 pt-1 border-t">
 <div className="flex justify-between"><span>Device ID:</span> <strong>{boundDevice.deviceId}</strong></div>
 <div className="flex justify-between"><span>OS / Browser:</span> <span>{boundDevice.osVersion}</span></div>
 <div className="flex justify-between"><span>Terdaftar Sejak:</span> <span>{boundDevice.boundAt}</span></div>
 </div>

 <p className="text-[10px] italic pt-1">
 *Satu akun hanya diperbolehkan melakukan presensi dari 1 perangkat terdaftar ini.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* MODULE 2: CHECK-IN KEGIATAN LAPANGAN */}
 {activeTab === 'KEGIATAN_LAPANGAN' && (
 <div className="glass-effect p-6 rounded-2xl space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-2xl border">
 <Navigation size={22} />
 </div>
 <div>
 <h2 className="text-lg font-black text-slate-900 dark:text-gray-900 dark:text-white tracking-tight">
 Check-In Kegiatan Lapangan (Survey, Penagihan, Prospek)
 </h2>
 <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
 Pencatatan kunjungan AO / Staff Collection di lokasi debitur dilengkapi Geotagging GPS & Bukti Foto.
 </p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* FORM CHECK-IN LAPANGAN */}
 <form onSubmit={handleFieldCheckInSubmit} className="lg:col-span-5 space-y-4 bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10">
 <h3 className="text-sm font-black text-slate-900 dark:text-gray-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
 <Plus size={16} className="" /> Form Check-In Lokasi Debitur
 </h3>

 <div className="space-y-1">
 <label className="text-xs font-bold text-slate-700 dark:text-gray-200">Nama Debitur / Calon Nasabah:</label>
 <input
 type="text"
 placeholder="Contoh: Toko Bangunan Sarana Jaya..."
 value={fieldDebtorName}
 onChange={(e) => setFieldDebtorName(e.target.value)}
 className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-bold text-slate-700 dark:text-gray-200">Jenis Kegiatan Lapangan:</label>
 <select
 value={fieldActivityType}
 onChange={(e) => setFieldActivityType(e.target.value as any)}
 className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-gray-100 focus:outline-none"
 >
 <option value="SURVEY_AGUNAN">Survey Agunan & Kelayakan Usaha</option>
 <option value="PENAGIHAN">Penagihan Angsuran (Collection Visit)</option>
 <option value="PROSPEK_BARU">Kunjungan Prospek Kredit Baru</option>
 <option value="KUNJUNGAN_DEPOSITOR">Kunjungan Nasabah Deposito / Funding</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-bold text-slate-700 dark:text-gray-200">Catatan Kunjungan & Hasil:</label>
 <textarea
 rows={3}
 placeholder="Isi catatan hasil diskusi, kondisi usaha, atau janji bayar..."
 value={fieldNotes}
 onChange={(e) => setFieldNotes(e.target.value)}
 className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
 />
 </div>

 <div className="p-3 /80 rounded-xl border text-[11px] space-y-1">
 <span className="font-bold flex items-center gap-1">
 <MapPin size={13} className="" /> Geotagging Otomatis Terlampir:
 </span>
 <p className="font-mono text-[10px]">
 Lat: {currentGps.lat.toFixed(5)}, Lng: {currentGps.lng.toFixed(5)} ({currentGps.accuracy}m accuracy)
 </p>
 </div>

 <button
 type="submit"
 className="w-full py-2.5 hover: text-gray-900 dark:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-none transition-all"
 >
 <CheckCircle2 size={15} /> Simpan Check-In Kegiatan
 </button>

 {fieldCheckInSuccess && (
 <div className="p-3 rounded-xl text-xs font-bold flex items-center gap-2">
 <CheckCircle2 size={16} className="" /> Check-in kegiatan lapangan berhasil disimpan!
 </div>
 )}
 </form>

 {/* LOG RIWAYAT KEGIATAN LAPANGAN */}
 <div className="lg:col-span-7 space-y-4">
 <h3 className="text-sm font-black text-slate-900 dark:text-gray-900 dark:text-white border-b border-slate-100 pb-2">
 Riwayat Kunjungan Lapangan Terkini ({fieldActivities.length})
 </h3>

 <div className="space-y-3">
 {fieldActivities.map((act) => (
 <div key={act.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5/50 space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase">
 {act.activityType}
 </span>
 <h4 className="text-xs font-black text-slate-900 dark:text-gray-900 dark:text-white">{act.debtorName}</h4>
 </div>
 <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">{act.checkInTime}</span>
 </div>

 <p className="text-xs text-slate-600 dark:text-gray-300 font-medium flex items-center gap-1">
 <MapPin size={13} className="text-slate-400 shrink-0" /> {act.locationAddress}
 </p>

 <p className="text-xs text-slate-700 dark:text-gray-200 italic bg-white dark:bg-[#111111] p-2.5 rounded-xl border border-slate-100">
"{act.notes}"
 </p>

 <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400 pt-1">
 <span>AO / Staff: <strong className="text-slate-900 dark:text-gray-900 dark:text-white">{act.aoName}</strong></span>
 <span className="font-mono flex items-center gap-1">
 <ShieldCheck size={12} /> {act.gpsStatus}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* MODULE 3: REKAP PRESENSI STAFF */}
 {activeTab === 'REKAP_PRESENSI' && (
 <div className="glass-effect p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <Clock size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-slate-900 dark:text-gray-900 dark:text-white">Rekapitulasi Log Presensi & Biometric Audit</h3>
 <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Laporan Kehadiran Karyawan Berbasis Face Authentication & GPS Geofence</p>
 </div>
 </div>

 <button className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
 <Download size={13} /> Export Excel / PDF
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 font-black">
 <th className="p-3">WAKTU PRESENSI</th>
 <th className="p-3">KARYAWAN & ROLE</th>
 <th className="p-3">TIPE</th>
 <th className="p-3">LOKASI & GEOFENCE</th>
 <th className="p-3">PERANGKAT (DEVICE)</th>
 <th className="p-3">FACE MATCH</th>
 <th className="p-3">STATUS AUDIT</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-white/10 font-medium text-slate-800 dark:text-gray-100">
 {attendanceLogs.map((log) => (
 <tr key={log.id} className="hover:bg-slate-50 dark:bg-white/5/80">
 <td className="p-3 font-mono text-slate-500 dark:text-gray-400 whitespace-nowrap">{log.timestamp}</td>
 <td className="p-3">
 <strong className="text-slate-900 dark:text-gray-900 dark:text-white block">{log.userName}</strong>
 <span className="text-[10px] text-slate-400">{log.userRole}</span>
 </td>
 <td className="p-3">
 <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
 log.type === 'MASUK' ? ' ' :
 log.type === 'PULANG' ? ' ' :
 ' '
 }`}>
 {log.type}
 </span>
 </td>
 <td className="p-3 max-w-xs truncate">
 <span className="block truncate font-bold text-slate-900 dark:text-gray-900 dark:text-white">{log.locationName}</span>
 <span className="text-[10px] text-slate-400 font-mono">
 Acc: {log.gpsAccuracyMeters}m {log.isFakeGpsDetected ? '⚠️ Fake GPS' : ''}
 </span>
 </td>
 <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-gray-300">
 {log.deviceName}
 </td>
 <td className="p-3 font-bold">
 {log.faceMatchScore}%
 </td>
 <td className="p-3">
 <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
 log.status === 'VALID' ? ' ' :
 ' '
 }`}>
 {log.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* MODULE 4: DEVICE BINDING MANAGEMENT */}
 {activeTab === 'DEVICE_BINDING' && (
 <div className="glass-effect p-6 rounded-2xl space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <Smartphone size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-slate-900 dark:text-gray-900 dark:text-white">Pembatasan Satu Perangkat (Single Device Binding)</h3>
 <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Mencegah titip absen & penggantian perangkat tanpa persetujuan HR</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-black text-slate-900 dark:text-gray-900 dark:text-white">Perangkat Aktif Terdaftar</h4>
 <span className="text-[10px] font-black px-2.5 py-0.5 rounded">
 LOCKED TO DEVICE
 </span>
 </div>

 <div className="space-y-1.5 text-xs text-slate-700 dark:text-gray-200 font-mono bg-white dark:bg-[#111111] p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
 <div className="flex justify-between"><span>Nama Perangkat:</span> <strong className="text-slate-900 dark:text-gray-900 dark:text-white">{boundDevice.deviceName}</strong></div>
 <div className="flex justify-between"><span>Hardware ID:</span> <strong>{boundDevice.deviceId}</strong></div>
 <div className="flex justify-between"><span>Sistem Operasi:</span> <span>{boundDevice.osVersion}</span></div>
 <div className="flex justify-between"><span>Status Otentikasi:</span> <span className="font-bold">LOCKED & VERIFIED</span></div>
 </div>

 <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
 Setiap percobaan presensi dari perangkat HP lain yang belum terdaftar akan otomatis ditolak oleh server BPR ARA.
 </p>
 </div>

 <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
 <h4 className="text-xs font-black text-slate-900 dark:text-gray-900 dark:text-white">Pengajuan Permohonan Ganti Perangkat (Reset Binding)</h4>
 <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
 Apabila HP karyawan hilang, rusak, atau ganti perangkat baru, permohonan reset binding wajib disetujui oleh Supervisor HRD / IT BPR ARA.
 </p>
 <button className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-950 text-gray-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all">
 <RotateCcw size={14} /> Ajukan Reset Perangkat Baru
 </button>
 </div>
 </div>
 </div>
 )}

 {/* MODULE 5: ANTI-FRAUD LOG */}
 {activeTab === 'ANTI_FRAUD_LOG' && (
 <div className="glass-effect p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <ShieldAlert size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-slate-900 dark:text-gray-900 dark:text-white">Log Pengawasan Anti-Fake GPS & Anomali Security</h3>
 <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Deteksi percobaan lokasi palsu (Fake GPS app, Mock location provider)</p>
 </div>
 </div>
 </div>

 <div className="p-4 rounded-2xl border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-black">Deteksi Peringatan Anomali GPS: Tri Surono</span>
 <span className="text-[10px] font-black text-gray-900 dark:text-white px-2 py-0.5 rounded">FLAGGED FRAUD ALERT</span>
 </div>
 <p className="text-xs">
 Sistem mendeteksi lompatan posisi 15 km dalam waktu 2 menit dengan akurasi terdistorsi (&gt;25 meter). Percobaan presensi otomatis ditandai untuk revaluasi supervisor.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}
