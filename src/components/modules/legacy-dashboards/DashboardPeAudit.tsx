import React, { useState } from 'react';
import { 
 FileSearch, 
 History, 
 CheckSquare, 
 FileText, 
 Eye, 
 Search, 
 Filter, 
 ShieldCheck, 
 AlertTriangle, 
 UserCheck, 
 Clock, 
 ArrowRight, 
 Database, 
 Lock, 
 FileCode, 
 Layers, 
 Sparkles, 
 Download, 
 Key, 
 Diff, 
 CheckCircle2, 
 XCircle, 
 Calendar, 
 Activity, 
 Server, 
 User, 
 Building, 
 ChevronRight,
 RefreshCw,
 Zap,
 Tag,
 Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditApplication } from '../../../types/legacy';

interface DashboardPeAuditProps {
 applications?: CreditApplication[];
}

interface AuditLogItem {
 id: string;
 timestamp: string;
 user: string;
 role: string;
 ipAddress: string;
 action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'OVERRIDE';
 entity: string;
 entityId: string;
 description: string;
 riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
 beforeValue?: Record<string, any>;
 afterValue?: Record<string, any>;
}

interface AuditEvidenceItem {
 id: string;
 applicationId: string;
 debtorName: string;
 documentType: string;
 fileName: string;
 fileSize: string;
 hashSHA256: string;
 uploadedBy: string;
 uploadedAt: string;
 verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
 notes: string;
}

interface ApprovalAuditTrailItem {
 id: string;
 applicationId: string;
 debtorName: string;
 nominal: number;
 stage: string;
 approverName: string;
 approverRole: string;
 decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL_APPROVE';
 decisionTime: string;
 notes: string;
 ipAddress: string;
}

export default function DashboardPeAudit({ applications = [] }: DashboardPeAuditProps) {
 // Main Active Tab within PE Audit
 const [activeTab, setActiveTab] = useState<'MONITORING_PERUBAHAN' | 'AUDIT_TRAIL' | 'LOG_AKTIVITAS' | 'EVIDENCE' | 'APPROVAL' | 'DOKUMEN'>('MONITORING_PERUBAHAN');
 
 // Selected Log for Change Diff Modal
 const [selectedDiffLog, setSelectedDiffLog] = useState<AuditLogItem | null>(null);
 const [searchQuery, setSearchQuery] = useState<string>('');
 const [riskFilter, setRiskFilter] = useState<string>('ALL');

 // Sample Audit Logs with explicit Before vs After data for Monitoring Perubahan
 const auditLogs: AuditLogItem[] = [];

 // Audit Evidence Items (Bukti Agunan & Digital Document Verification)
 const auditEvidenceList: AuditEvidenceItem[] = [];

 // Approval Audit Trail History
 const approvalAuditTrail: ApprovalAuditTrailItem[] = [];

 // Filtered Logs
 const filteredLogs = auditLogs.filter(log => {
 const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
 log.entityId.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesRisk = riskFilter === 'ALL' || log.riskLevel === riskFilter;
 return matchesSearch && matchesRisk;
 });

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 return (
 <div className="space-y-6 pb-12">
 {/* Header Banner - PE Audit Intern */}
 <div className="bg-surface shadow-md text-foreground rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full pointer-events-none" />
 <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 /10 rounded-full pointer-events-none" />

 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-3 flex-wrap">
 <span className="px-3 py-1 border rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
 <FileSearch size={14} className="text-primary" /> Executive Audit Intern Portal
 </span>
 <span className="px-3 py-1 bg-primary-light border border-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1.5">
 <UserCheck size={13} className="text-primary" /> PE Audit: Agus Santoso
 </span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
 Dashboard Audit Trail & Integrity System
 </h1>
 <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-3xl leading-relaxed">
 Sistem Pengawasan Jejak Audit Terpadu BPR ARA. Setiap perubahan data, dokumen agunan, log aktivitas, dan persetujuan komite tercatat secara mutlak, transparan, dan tidak dapat diubah (Immutable Audit Trail).
 </p>
 </div>

 <div className="flex items-center gap-2 flex-wrap shrink-0">
 <div className="bg-surface/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-primary-light/20 text-xs font-bold flex items-center gap-2">
 <Lock size={15} className="text-primary" />
 <span>Audit Log Security: <strong>SHA-256 Encrypted</strong></span>
 </div>
 </div>
 </div>
 </div>

 {/* 6 SUMMARY KPI RIBBON */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 {/* 1. Evidence */}
 <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-1">
 <span className="text-[10px] font-black text-muted uppercase tracking-wider block">1. Digital Evidence</span>
 <h4 className="text-lg font-black text-foreground dark:text-foreground">0 Berkas</h4>
 <p className="text-[10px] font-extrabold">0% Hash Verified</p>
 </div>

 {/* 2. Log Aktivitas */}
 <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-1">
 <span className="text-[10px] font-black text-muted uppercase tracking-wider block">2. Log Aktivitas</span>
 <h4 className="text-lg font-black text-foreground dark:text-foreground">0 Event</h4>
 <p className="text-[10px] font-extrabold">24 Jam Terakhir</p>
 </div>

 {/* 3. Approval */}
 <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-1">
 <span className="text-[10px] font-black text-muted uppercase tracking-wider block">3. Approval Komite</span>
 <h4 className="text-lg font-black text-foreground dark:text-foreground">0 Decisions</h4>
 <p className="text-[10px] font-extrabold">0% Sign-Off Valid</p>
 </div>

 {/* 4. Audit Trail */}
 <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-1">
 <span className="text-[10px] font-black text-muted uppercase tracking-wider block">4. Audit Trail</span>
 <h4 className="text-lg font-black text-foreground dark:text-foreground">Immutable</h4>
 <p className="text-[10px] font-extrabold text-muted">No Record Deleted</p>
 </div>

 {/* 5. Dokumen */}
 <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-1">
 <span className="text-[10px] font-black text-muted uppercase tracking-wider block">5. Dokumen SOP</span>
 <h4 className="text-lg font-black text-foreground dark:text-foreground">0% Valid</h4>
 <p className="text-[10px] font-extrabold">Lengkap & Legal</p>
 </div>

 {/* 6. Perubahan High Risk */}
 <div className="p-3.5 rounded-2xl border shadow-xs space-y-1">
 <span className="text-[10px] font-black uppercase tracking-wider block">6. Perubahan Critical</span>
 <h4 className="text-lg font-black">0 Alert</h4>
 <p className="text-[10px] font-extrabold">Revaluasi & Rate Override</p>
 </div>
 </div>

 {/* NAVIGATION TABS FOR PE AUDIT MODULES */}
 <div className="bg-surface p-2 rounded-2xl border border-border shadow-xs flex items-center gap-2 overflow-x-auto">
 <button
 onClick={() => setActiveTab('MONITORING_PERUBAHAN')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'MONITORING_PERUBAHAN'
 ? 'bg-primary text-white text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-muted hover:bg-surface-muted hover:text-foreground dark:text-foreground'
 }`}
 >
 <Diff size={15} className="text-primary" />
 Monitoring Perubahan Data (Before vs After)
 </button>

 <button
 onClick={() => setActiveTab('AUDIT_TRAIL')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'AUDIT_TRAIL'
 ? 'bg-primary text-white text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-muted hover:bg-surface-muted hover:text-foreground dark:text-foreground'
 }`}
 >
 <History size={15} className="text-primary" />
 Audit Trail Lengkap
 </button>

 <button
 onClick={() => setActiveTab('LOG_AKTIVITAS')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'LOG_AKTIVITAS'
 ? 'bg-primary text-white text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-muted hover:bg-surface-muted hover:text-foreground dark:text-foreground'
 }`}
 >
 <Activity size={15} className="text-primary" />
 Log Aktivitas User
 </button>

 <button
 onClick={() => setActiveTab('EVIDENCE')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'EVIDENCE'
 ? 'bg-primary text-white text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-muted hover:bg-surface-muted hover:text-foreground dark:text-foreground'
 }`}
 >
 <FileSearch size={15} className="text-primary" />
 Bukti Audit (Evidence Digital)
 </button>

 <button
 onClick={() => setActiveTab('APPROVAL')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'APPROVAL'
 ? 'bg-primary text-white text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-muted hover:bg-surface-muted hover:text-foreground dark:text-foreground'
 }`}
 >
 <CheckSquare size={15} className="text-primary" />
 Approval & Sign-Off History
 </button>

 <button
 onClick={() => setActiveTab('DOKUMEN')}
 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
 activeTab === 'DOKUMEN'
 ? 'bg-primary text-white text-white dark:text-gray-900 shadow-sm dark:shadow-none'
 : 'text-muted hover:bg-surface-muted hover:text-foreground dark:text-foreground'
 }`}
 >
 <FileText size={15} className="text-primary" />
 Integritas Dokumen SOP
 </button>
 </div>

 {/* MODULE 1: MONITORING PERUBAHAN DATA (BEFORE VS AFTER DETAILED DIFF VIEW) */}
 {activeTab === 'MONITORING_PERUBAHAN' && (
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-5">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-2xl border">
 <Diff size={22} />
 </div>
 <div>
 <h2 className="text-lg font-black text-foreground dark:text-foreground tracking-tight flex items-center gap-2">
 Monitoring Perubahan Data (Data Change Tracker)
 <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full border">
 Audit Grade
 </span>
 </h2>
 <p className="text-xs text-muted font-medium">
 Setiap perubahan parameter kredit, suku bunga, dan nilai agunan dapat dibandingkan secara presisi (Before vs After).
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
 <input
 type="text"
 placeholder="Cari user, entitas, ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 pr-4 py-2 bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
 />
 </div>

 <select
 value={riskFilter}
 onChange={(e) => setRiskFilter(e.target.value)}
 className="px-3 py-2 bg-background dark:bg-white/5 border border-border rounded-xl text-xs font-bold text-foreground dark:text-gray-200 focus:outline-none"
 >
 <option value="ALL">Semua Risk Level</option>
 <option value="CRITICAL">Critical Risk</option>
 <option value="HIGH">High Risk</option>
 <option value="MEDIUM">Medium Risk</option>
 <option value="LOW">Low Risk</option>
 </select>
 </div>
 </div>

 {/* Change Log Table / Cards */}
 <div className="space-y-4">
 {filteredLogs.map((log) => (
 <div 
 key={log.id} 
 className={`p-5 rounded-2xl border transition-all space-y-4 ${
 log.riskLevel === 'CRITICAL' ? ' /40 hover:' :
 log.riskLevel === 'HIGH' ? ' /30 hover:' :
 'bg-background dark:bg-white/5/40 border-border/80 hover:border-slate-300 dark:border-primary-light/20'
 }`}
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
 <div className="flex items-center gap-3">
 <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase ${
 log.action === 'OVERRIDE' ? ' text-foreground' :
 log.action === 'UPDATE' ? ' text-foreground' :
 log.action === 'APPROVE' ? ' text-foreground' :
 'bg-slate-800 dark:bg-slate-200 text-foreground'
 }`}>
 {log.action}
 </span>
 <div>
 <h4 className="text-sm font-black text-foreground dark:text-foreground">{log.description}</h4>
 <p className="text-[10px] text-muted font-semibold">
 ID: <strong className="text-foreground">{log.id}</strong> • Entitas: <strong className="text-foreground">{log.entity} ({log.entityId})</strong>
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 text-xs font-bold shrink-0">
 <span className="text-muted text-[11px] font-semibold flex items-center gap-1">
 <Clock size={12} /> {log.timestamp}
 </span>
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
 log.riskLevel === 'CRITICAL' ? ' ' :
 log.riskLevel === 'HIGH' ? ' ' :
 'bg-surface-muted text-foreground border-border'
 }`}>
 Risk: {log.riskLevel}
 </span>
 </div>
 </div>

 {/* User Info & IP Address */}
 <div className="flex items-center justify-between text-[11px] font-semibold text-muted bg-surface/70 p-2.5 rounded-xl border border-border">
 <div className="flex items-center gap-2">
 <User size={13} className="text-muted" />
 <span>Diubah Oleh: <strong className="text-foreground dark:text-foreground">{log.user}</strong> ({log.role})</span>
 </div>
 <div className="flex items-center gap-2">
 <Server size={13} className="text-muted" />
 <span>IP Client: <strong className="font-mono text-foreground">{log.ipAddress}</strong></span>
 </div>
 </div>

 {/* COMPARISON MATRIX (BEFORE VS AFTER SIDE-BY-SIDE) */}
 {log.beforeValue && log.afterValue && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
 {/* Before / Original Value */}
 <div className="p-3.5 rounded-xl /70 border space-y-1.5">
 <div className="flex items-center justify-between text-xs font-black border-b pb-1">
 <span>❌ NILAI SEBELUM (ORIGINAL)</span>
 <span className="text-[10px] font-extrabold">State Prior</span>
 </div>
 <div className="space-y-1 font-mono text-[11px] text-foreground">
 {Object.entries(log.beforeValue).map(([key, val]) => (
 <div key={key} className="flex justify-between py-0.5 border-b">
 <span className="text-muted font-sans font-bold">{key}:</span>
 <span className="font-bold">{typeof val === 'number' ? formatIDR(val) : String(val)}</span>
 </div>
 ))}
 </div>
 </div>

 {/* After / Changed Value */}
 <div className="p-3.5 rounded-xl /70 border space-y-1.5">
 <div className="flex items-center justify-between text-xs font-black border-b pb-1">
 <span>✅ NILAI SESUDAH (PERUBAHAN REVISI)</span>
 <span className="text-[10px] font-extrabold">State Updated</span>
 </div>
 <div className="space-y-1 font-mono text-[11px] text-foreground">
 {Object.entries(log.afterValue).map(([key, val]) => (
 <div key={key} className="flex justify-between py-0.5 border-b">
 <span className="text-muted font-sans font-bold">{key}:</span>
 <span className="font-black">{typeof val === 'number' ? formatIDR(val) : String(val)}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* MODULE 2: AUDIT TRAIL LENGKAP */}
 {activeTab === 'AUDIT_TRAIL' && (
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <History size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">Kronologis Audit Trail Transaksi</h3>
 <p className="text-xs text-muted font-medium">Histori Perubahan Database Immutable (Read-Only Audit Log)</p>
 </div>
 </div>
 </div>

 <div className="relative border-l-2 border-border ml-4 pl-6 space-y-6 my-4">
 {auditLogs.map((log) => (
 <div key={log.id} className="relative group">
 {/* Bullet node */}
 <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${
 log.riskLevel === 'CRITICAL' ? ' ring-4 ' :
 log.riskLevel === 'HIGH' ? ' ring-4 ' :
 ' ring-4 '
 }`} />

 <div className="bg-background dark:bg-white/5 p-4 rounded-2xl border border-border/90 space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="font-extrabold text-foreground dark:text-foreground">{log.description}</span>
 <span className="text-[11px] font-mono text-muted">{log.timestamp}</span>
 </div>
 <p className="text-xs text-muted">
 User: <strong>{log.user}</strong> ({log.role}) • Entity ID: <strong className="font-mono">{log.entityId}</strong>
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* MODULE 3: LOG AKTIVITAS USER */}
 {activeTab === 'LOG_AKTIVITAS' && (
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <Activity size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">Sistem Log Aktivitas User Real-time</h3>
 <p className="text-xs text-muted font-medium">Pemantauan login, pengaksesan modul, dan aksi sistem BPR ARA</p>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-background dark:bg-white/5 border-b border-border text-muted font-black">
 <th className="p-3">WAKTU</th>
 <th className="p-3">USER / PEKERJAAN</th>
 <th className="p-3">AKSI / OPERASI</th>
 <th className="p-3">MODUL</th>
 <th className="p-3">IP ADDRESS</th>
 <th className="p-3">RISK</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-white/10 font-medium text-foreground">
 {auditLogs.map((log) => (
 <tr key={log.id} className="hover:bg-background dark:bg-white/5/80">
 <td className="p-3 font-mono text-muted whitespace-nowrap">{log.timestamp}</td>
 <td className="p-3">
 <strong className="text-foreground dark:text-foreground block">{log.user}</strong>
 <span className="text-[10px] text-muted">{log.role}</span>
 </td>
 <td className="p-3">
 <span className="font-black text-foreground dark:text-foreground">{log.action}</span> - {log.description}
 </td>
 <td className="p-3 font-bold">{log.entity}</td>
 <td className="p-3 font-mono text-muted">{log.ipAddress}</td>
 <td className="p-3">
 <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
 log.riskLevel === 'CRITICAL' ? ' ' :
 log.riskLevel === 'HIGH' ? ' ' :
 'bg-surface-muted text-foreground'
 }`}>
 {log.riskLevel}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* MODULE 4: EVIDENCE DIGITAL */}
 {activeTab === 'EVIDENCE' && (
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <FileSearch size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">Bukti Audit & Keaslian Agunan (Evidence Digital)</h3>
 <p className="text-xs text-muted font-medium">Verifikasi Berkas Agunan SHM, BPKB & Laporan Keuangan Audited</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {auditEvidenceList.map((ev) => (
 <div key={ev.id} className="p-4 rounded-2xl border border-border bg-background space-y-3">
 <div className="flex items-start justify-between gap-2">
 <div>
 <span className="text-[10px] font-black uppercase">{ev.documentType}</span>
 <h4 className="text-xs font-black text-foreground dark:text-foreground">{ev.debtorName}</h4>
 <p className="text-[10px] text-muted font-bold">App ID: {ev.applicationId}</p>
 </div>
 <span className="text-[10px] font-black px-2 py-0.5 rounded">
 {ev.verificationStatus}
 </span>
 </div>

 <div className="bg-surface p-2.5 rounded-xl border border-border space-y-1 font-mono text-[10px] text-muted">
 <div className="flex justify-between"><span>File:</span> <strong className="text-foreground dark:text-foreground truncate max-w-[150px]">{ev.fileName}</strong></div>
 <div className="flex justify-between"><span>Size:</span> <span>{ev.fileSize}</span></div>
 <div className="pt-1 border-t border-border truncate">
 <span>Hash SHA256:</span> <strong className="font-mono text-[9px] block truncate">{ev.hashSHA256}</strong>
 </div>
 </div>

 <p className="text-[10px] text-muted italic">Catatan Auditor: {ev.notes}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* MODULE 5: APPROVAL HISTORY */}
 {activeTab === 'APPROVAL' && (
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <CheckSquare size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">Histori Persetujuan Komite (Approval Sign-Off)</h3>
 <p className="text-xs text-muted font-medium">Jejak Keputusan Komite Kredit & Overriding Limit</p>
 </div>
 </div>
 </div>

 <div className="space-y-3">
 {approvalAuditTrail.map((apr) => (
 <div key={apr.id} className="p-4 rounded-2xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <h4 className="text-xs font-black text-foreground dark:text-foreground">{apr.debtorName}</h4>
 <span className="text-[10px] font-black px-2 py-0.5 rounded">
 {formatIDR(apr.nominal)}
 </span>
 </div>
 <p className="text-[11px] text-muted font-medium">
 Tahap: <strong>{apr.stage}</strong> • Penyetuju: <strong>{apr.approverName} ({apr.approverRole})</strong>
 </p>
 <p className="text-[10px] text-muted italic">Catatan: {apr.notes}</p>
 </div>

 <div className="text-right shrink-0">
 <span className="text-xs font-black border px-3 py-1 rounded-full block">
 {apr.decision}
 </span>
 <span className="text-[10px] text-muted font-mono block mt-1">{apr.decisionTime}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* MODULE 6: DOKUMEN INTEGRITY */}
 {activeTab === 'DOKUMEN' && (
 <div className="bg-surface shadow-md p-6 rounded-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl">
 <FileText size={20} />
 </div>
 <div>
 <h3 className="text-base font-black text-foreground dark:text-foreground">Integritas Dokumen SOP Kredit BPR</h3>
 <p className="text-xs text-muted font-medium">Pemeriksaan Kelengkapan Berkas & Legalitas Perjanjian Kredit</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 bg-background dark:bg-white/5 rounded-2xl border border-border space-y-2">
 <h4 className="text-xs font-black text-foreground dark:text-foreground">Checklist SOP Legalitas Berkas Kredit</h4>
 <ul className="space-y-1.5 text-xs font-medium text-foreground dark:text-gray-200">
 <li className="flex items-center gap-2"><CheckCircle2 size={14} /> KTP Suami Istri & Kartu Keluarga (Verified Clean)</li>
 <li className="flex items-center gap-2"><CheckCircle2 size={14} /> NPWP & NIB / SIUP Usaha (Verified Active)</li>
 <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Asli SHM / BPKB Agunan Tersimpan di Vault Kas Pusat</li>
 <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Akta Pengikatan APHT Notaris (Complete)</li>
 </ul>
 </div>

 <div className="p-4 bg-background dark:bg-white/5 rounded-2xl border border-border space-y-2">
 <h4 className="text-xs font-black text-foreground dark:text-foreground">Standar Pengamanan Data Audit (Security Standard)</h4>
 <p className="text-xs text-muted leading-relaxed">
 Seluruh log aktivitas dan jejak audit disinkronkan secara real-time ke database terenkripsi SHA-256. Tidak ada opsi penghapusan (No Delete Policy) untuk menjamin transparansi pemeriksaan OJK dan Audit Eksternal.
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
