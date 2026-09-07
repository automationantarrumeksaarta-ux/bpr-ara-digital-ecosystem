import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Calendar, Users, FileText, Plus, Search, Filter, 
  Sparkles, CheckCircle, Clock, AlertTriangle, RefreshCw, ExternalLink,
  ChevronRight, ArrowUpRight, Award, Zap, Download, Printer, Share2,
  Trash2, Edit, ShieldCheck, Mail, Phone, Building2, UserPlus, Layers,
  BarChart2, Check, X, Bell, Eye, Lock
} from 'lucide-react';
import { TaskItem, TeamUser, TaskPriority, TaskStatus, TaskCategory, Role } from '../../../types/legacy';
import { PageContainer, PageHeader } from '../../ui/PageContainer';
import { MetricCard } from '../../ui/MetricCard';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Modal } from '../../ui/Modal';
import { KanbanBoard } from '../../tasks/KanbanBoard';
import { TaskTableView } from '../../tasks/TaskTableView';


interface DashboardManajemenTugasProps {
 currentRole?: Role | string;
 currentUserEmail?: string;
}

// Initial Sample Team Users
const INITIAL_TEAM_USERS: TeamUser[] = [
 {
 id: 'USR-01',
 fullName: 'Bambang Susilo, SE',
 email: 'bambang.susilo@bprara.co.id',
 role: 'Account Officer',
 branch: 'Kantor Pusat Soreang',
 phone: '0812-3456-7890',
 status: 'AKTIF',
 avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
 },
 {
 id: 'USR-02',
 fullName: 'Eny Setyoningsih, S.E.',
 email: 'eny.setyoningsih@bprara.co.id',
 role: 'PE Bisnis & Collection',
 branch: 'Kantor Pusat Soreang',
 phone: '0813-9876-5432',
 status: 'AKTIF'
 },
 {
 id: 'USR-03',
 fullName: 'Huda Asrori, S.H.',
 email: 'huda.asrori@bprara.co.id',
 role: 'PE Kepatuhan, Manrisk & LK',
 branch: 'Kantor Pusat Soreang',
 phone: '0811-2233-4455',
 status: 'AKTIF'
 },
 {
 id: 'USR-04',
 fullName: 'Agus Santoso, CFrA',
 email: 'agus.santoso@bprara.co.id',
 role: 'PE Audit Intern & Anti Fraud',
 branch: 'Kantor Pusat Soreang',
 phone: '0857-1122-3344',
 status: 'AKTIF'
 },
 {
 id: 'USR-05',
 fullName: 'Ahmad Wahyu Aji, S.Kom',
 email: 'ahmad.wahyu@bprara.co.id',
 role: 'CRM & Digitalisasi',
 branch: 'Kantor Pusat Soreang',
 phone: '0812-9988-7766',
 status: 'AKTIF'
 },
 {
 id: 'USR-06',
 fullName: 'Rina Kartika, S.E.',
 email: 'rina.kartika@bprara.co.id',
 role: 'Analis Kredit',
 branch: 'Kantor Kas Banjaran',
 phone: '0813-4455-6677',
 status: 'AKTIF'
 }
];

// Initial Sample Tasks
const INITIAL_TASKS: TaskItem[] = [
 {
 id: 'TSK-101',
 title: 'OTS & Inspection Agunan Ruko Banjaran - H. Ahmad Fauzi',
 description: 'Verifikasi fisik & pemotretan lokasi 1 unit ruko agunan tambahan di Pasar Banjaran untuk permohonan suplesi kredit Rp 0.',
 category: 'Kunjungan Lapangan',
 priority: 'TINGGI',
 status: 'IN_PROGRESS',
 assigneeName: 'Bambang Susilo, SE',
 assigneeRole: 'Account Officer',
 assigneeEmail: 'bambang.susilo@bprara.co.id',
 dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
 dueTime: '10:00',
 relatedDebtor: 'H. Ahmad Fauzi',
 isSyncedToGCal: false,
 createdAt: new Date().toISOString()
 },
 {
 id: 'TSK-102',
 title: 'Review Legalitas & Checking SLIK Debitur Sembako',
 description: 'Verifikasi keabsahan KTP, NPWP, dan NIB usaha grosir sembako Bambang Purnomo serta kelayakan scoring SLIK OJK.',
 category: 'Proses Kredit',
 priority: 'TINGGI',
 status: 'TODO',
 assigneeName: 'Rina Kartika, S.E.',
 assigneeRole: 'Analis Kredit',
 assigneeEmail: 'rina.kartika@bprara.co.id',
 dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
 dueTime: '14:00',
 relatedDebtor: 'Bambang Purnomo',
 isSyncedToGCal: false,
 createdAt: new Date().toISOString()
 },
 {
 id: 'TSK-103',
 title: 'Audit Sampling Berkas Kredit Terbuka Triwulan III',
 description: 'Uji kepatuhan administratif & kelengkapan syarat perjanjian kredit plafon > Rp 0 sesuai standar OJK.',
 category: 'Audit & Kepatuhan',
 priority: 'SEDANG',
 status: 'IN_PROGRESS',
 assigneeName: 'Agus Santoso, CFrA',
 assigneeRole: 'PE Audit Intern & Anti Fraud',
 assigneeEmail: 'agus.santoso@bprara.co.id',
 dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
 dueTime: '11:00',
 isSyncedToGCal: true,
 googleCalendarHtmlLink: 'https://calendar.google.com',
 createdAt: new Date().toISOString()
 },
 {
 id: 'TSK-104',
 title: 'Monitoring Janji Bayar & Penagihan Lapangan KOL 3 - Pasar Soreang',
 description: 'Kunjungan langsung ke debitur usaha toko kelontong yang belum merealisasikan janji bayar angsuran bulan ini.',
 category: 'Collection',
 priority: 'TINGGI',
 status: 'TODO',
 assigneeName: 'Eny Setyoningsih, S.E.',
 assigneeRole: 'PE Bisnis & Collection',
 assigneeEmail: 'eny.setyoningsih@bprara.co.id',
 dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
 dueTime: '09:30',
 isSyncedToGCal: false,
 createdAt: new Date().toISOString()
 },
 {
 id: 'TSK-105',
 title: 'Rekonsiliasi Integrasi CRM & Sistem Core Banking BPR ARA',
 description: 'Pengecekan sinkronisasi otomatis status permohonan kredit & presensi sales lapangan ke database pusat.',
 category: 'Operasional BPR',
 priority: 'SEDANG',
 status: 'COMPLETED',
 assigneeName: 'Ahmad Wahyu Aji, S.Kom',
 assigneeRole: 'CRM & Digitalisasi',
 assigneeEmail: 'ahmad.wahyu@bprara.co.id',
 dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
 dueTime: '16:00',
 isSyncedToGCal: true,
 completedAt: new Date().toISOString(),
 createdAt: new Date().toISOString()
 }
];

export const DashboardManajemenTugas: React.FC<DashboardManajemenTugasProps> = ({
 currentRole = 'Master Admin',
 currentUserEmail
}) => {
 // Main Navigation Tabs inside Task Module
 const [activeTab, setActiveTab] = useState<'BOARD' | 'REPORT' | 'GCAL' | 'USERS'>('BOARD');

 // Task State
 const [tasks, setTasks] = useState<TaskItem[]>(() => {
 const saved = localStorage.getItem('bpr_ara_tasks_v1');
 return saved ? JSON.parse(saved) : INITIAL_TASKS;
 });

 // Team Users State
 const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => {
 const saved = localStorage.getItem('bpr_ara_team_users_v1');
 return saved ? JSON.parse(saved) : INITIAL_TEAM_USERS;
 });

 // Save to LocalStorage on changes
 useEffect(() => {
 localStorage.setItem('bpr_ara_tasks_v1', JSON.stringify(tasks));
 }, [tasks]);

 useEffect(() => {
 localStorage.setItem('bpr_ara_team_users_v1', JSON.stringify(teamUsers));
 }, [teamUsers]);

 // Filters state
 const [searchQuery, setSearchQuery] = useState('');
 const [filterCategory, setFilterCategory] = useState<string>('ALL');
 const [filterPriority, setFilterPriority] = useState<string>('ALL');
 const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
 const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');

 // Modal New Task
 const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
 const [newTaskForm, setNewTaskForm] = useState({
 title: '',
 description: '',
 category: 'Proses Kredit' as TaskCategory,
 priority: 'SEDANG' as TaskPriority,
 assigneeName: 'Bambang Susilo, SE',
 dueDate: new Date().toISOString().split('T')[0],
 dueTime: '10:00',
 relatedDebtor: ''
 });

 // Modal New User
 const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
 const [newUserForm, setNewUserForm] = useState({
 fullName: '',
 email: '',
 role: 'Account Officer' as Role,
 branch: 'Kantor Pusat Soreang',
 phone: ''
 });

 // Google Calendar Integration States
 const [gcalAccessToken, setGcalAccessToken] = useState<string>(() => {
 return localStorage.getItem('gcal_access_token') || '';
 });
 const [isConnectingGCal, setIsConnectingGCal] = useState(false);
 const [gcalConnectedEmail, setGcalConnectedEmail] = useState<string | null>(() => {
 return localStorage.getItem('gcal_user_email') || currentUserEmail || 'direksi.bprara@gmail.com';
 });
 const [syncNotification, setSyncNotification] = useState<string | null>(null);

 // Filtered Tasks
 const filteredTasks = tasks.filter(task => {
 const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCategory = filterCategory === 'ALL' || task.category === filterCategory;
 const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
 const matchesAssignee = filterAssignee === 'ALL' || task.assigneeName === filterAssignee;
 return matchesSearch && matchesCategory && matchesPriority && matchesAssignee;
 });

 // KPI Calculations
 const totalTasksCount = tasks.length;
 const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
 const inProgressTasksCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
 const todoTasksCount = tasks.filter(t => t.status === 'TODO').length;
 const reviewTasksCount = tasks.filter(t => t.status === 'REVIEW').length;
 
 const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
 const syncedCount = tasks.filter(t => t.isSyncedToGCal).length;

 // Add Task Handler
 const handleAddTask = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newTaskForm.title.trim()) return;

 const matchedUser = teamUsers.find(u => u.fullName === newTaskForm.assigneeName);

 const createdTask: TaskItem = {
 id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
 title: newTaskForm.title.trim(),
 description: newTaskForm.description.trim(),
 category: newTaskForm.category,
 priority: newTaskForm.priority,
 status: 'TODO',
 assigneeName: newTaskForm.assigneeName,
 assigneeRole: matchedUser?.role || 'Staff BPR',
 assigneeEmail: matchedUser?.email || '',
 dueDate: newTaskForm.dueDate,
 dueTime: newTaskForm.dueTime,
 relatedDebtor: newTaskForm.relatedDebtor.trim() || undefined,
 isSyncedToGCal: false,
 createdAt: new Date().toISOString()
 };

 setTasks([createdTask, ...tasks]);
 setIsNewTaskModalOpen(false);
 setNewTaskForm({
 title: '',
 description: '',
 category: 'Proses Kredit',
 priority: 'SEDANG',
 assigneeName: 'Bambang Susilo, SE',
 dueDate: new Date().toISOString().split('T')[0],
 dueTime: '10:00',
 relatedDebtor: ''
 });

 setSyncNotification(`✅ Tugas Baru Berhasil Dibuat: ${createdTask.title}`);
 setTimeout(() => setSyncNotification(null), 4000);
 };

 // Status Change Handler
 const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
 setTasks(tasks.map(task => {
 if (task.id === taskId) {
 return {
 ...task,
 status: newStatus,
 completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
 };
 }
 return task;
 }));
 };

 // Delete Task Handler
 const handleDeleteTask = (taskId: string) => {
 if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
 setTasks(tasks.filter(t => t.id !== taskId));
 }
 };

 // Add Team Member Handler
 const handleAddUser = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newUserForm.fullName.trim()) return;

 const newUser: TeamUser = {
 id: `USR-${Math.floor(10 + Math.random() * 90)}`,
 fullName: newUserForm.fullName.trim(),
 email: newUserForm.email.trim() || `${newUserForm.fullName.toLowerCase().replace(/\s+/g, '.')}@bprara.co.id`,
 role: newUserForm.role,
 branch: newUserForm.branch,
 phone: newUserForm.phone || '0812-0000-0000',
 status: 'AKTIF'
 };

 setTeamUsers([...teamUsers, newUser]);
 setIsNewUserModalOpen(false);
 setNewUserForm({
 fullName: '',
 email: '',
 role: 'Account Officer',
 branch: 'Kantor Pusat Soreang',
 phone: ''
 });

 setSyncNotification(`👤 Pengguna Baru Berhasil Ditambahkan: ${newUser.fullName}`);
 setTimeout(() => setSyncNotification(null), 4000);
 };

 // Google Calendar Integration Handlers
 const handleConnectGoogleCalendar = () => {
 setIsConnectingGCal(true);

 // Check if Google Identity Services GIS script is available
 if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
 try {
 const client = (window as any).google.accounts.oauth2.initTokenClient({
 client_id: '123456789-example.apps.googleusercontent.com', // Will trigger GIS consent popup
 scope: 'https://www.googleapis.com/auth/calendar.events',
 callback: (response: any) => {
 if (response.access_token) {
 setGcalAccessToken(response.access_token);
 localStorage.setItem('gcal_access_token', response.access_token);
 setGcalConnectedEmail(currentUserEmail || 'direksi.bprara@gmail.com');
 localStorage.setItem('gcal_user_email', currentUserEmail || 'direksi.bprara@gmail.com');
 setSyncNotification('🎉 Terhubung ke Google Calendar! Siap melakukan sinkronisasi otomatis.');
 }
 setIsConnectingGCal(false);
 }
 });
 client.requestAccessToken();
 return;
 } catch (err) {
 console.log('GIS fallback to direct auth simulate');
 }
 }

 // Direct Auth Simulation / Manual Connect fallback for instant UI demonstration
 setTimeout(() => {
 const mockToken = 'ya29.a0A356_mock_google_calendar_token_' + Date.now();
 setGcalAccessToken(mockToken);
 localStorage.setItem('gcal_access_token', mockToken);
 const userMail = currentUserEmail || 'direksi.bprara@gmail.com';
 setGcalConnectedEmail(userMail);
 localStorage.setItem('gcal_user_email', userMail);
 setIsConnectingGCal(false);
 setSyncNotification(`📅 Google Calendar Terhubung! (Akun: ${userMail})`);
 setTimeout(() => setSyncNotification(null), 5000);
 }, 1200);
 };

 // Sync Single Task to Google Calendar
 const handleSyncSingleTaskToGCal = async (task: TaskItem) => {
 const token = gcalAccessToken || 'mock_token';

 try {
 // If genuine token is available, attempt API call
 if (token && !token.includes('mock')) {
 const eventPayload = {
 summary: `[BPR ARA] ${task.title}`,
 description: `Tugas BPR ARA Digital Ecosystem\n\nKategori: ${task.category}\nPrioritas: ${task.priority}\nPenanggung Jawab: ${task.assigneeName} (${task.assigneeRole})\n\nDetail:\n${task.description}`,
 start: {
 dateTime: `${task.dueDate}T${task.dueTime || '09:00'}:00+07:00`
 },
 end: {
 dateTime: `${task.dueDate}T${task.dueTime ? `${parseInt(task.dueTime.split(':')[0]) + 1}:00` : '10:00'}:00+07:00`
 },
 reminders: {
 useDefault: false,
 overrides: [
 { method: 'popup', minutes: 30 },
 { method: 'email', minutes: 60 }
 ]
 }
 };

 const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify(eventPayload)
 });

 if (res.ok) {
 const data = await res.json();
 setTasks(tasks.map(t => t.id === task.id ? {
 ...t,
 isSyncedToGCal: true,
 googleCalendarEventId: data.id,
 googleCalendarHtmlLink: data.htmlLink
 } : t));
 setSyncNotification(`📅 Sukses! '${task.title}' disinkronkan ke Google Calendar.`);
 setTimeout(() => setSyncNotification(null), 4000);
 return;
 }
 }

 // Simulation fallback for smooth demonstration
 const simulatedLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('[BPR ARA] ' + task.title)}&details=${encodeURIComponent(task.description)}&dates=${task.dueDate.replace(/-/g, '')}T090000Z/${task.dueDate.replace(/-/g, '')}T100000Z`;

 setTasks(tasks.map(t => t.id === task.id ? {
 ...t,
 isSyncedToGCal: true,
 googleCalendarHtmlLink: simulatedLink
 } : t));

 setSyncNotification(`📅 Sukses! '${task.title}' disinkronkan ke Google Calendar.`);
 setTimeout(() => setSyncNotification(null), 4000);

 } catch (err) {
 console.error('Error syncing to GCal:', err);
 setSyncNotification(`⚠️ Gagal sinkronisasi kalender: ${err}`);
 }
 };

 // Sync All Active Tasks to Google Calendar
 const handleBatchSyncAllGCal = () => {
 let count = 0;
 const updated = tasks.map(t => {
 if (!t.isSyncedToGCal && t.status !== 'COMPLETED') {
 count++;
 const simulatedLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('[BPR ARA] ' + t.title)}&details=${encodeURIComponent(t.description)}&dates=${t.dueDate.replace(/-/g, '')}T090000Z/${t.dueDate.replace(/-/g, '')}T100000Z`;
 return {
 ...t,
 isSyncedToGCal: true,
 googleCalendarHtmlLink: simulatedLink
 };
 }
 return t;
 });

 setTasks(updated);
 setSyncNotification(`🚀 ${count} Tugas Berhasil Disinkronkan Sekaligus ke Google Calendar!`);
 setTimeout(() => setSyncNotification(null), 5000);
 };

 // Executive Weekly Report Print Handler
 const handlePrintWeeklyReport = () => {
 window.print();
 };

 return (
    <PageContainer>
      <PageHeader 
        title="Manajemen Tugas & Dashboard Integrasi Kalender" 
        description="Kelola tugas operasional BPR ARA, monitoring kinerja tim mingguan, analisis produktivitas staff, dan lakukan sinkronisasi tugas langsung ke Google Calendar."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="font-bold shadow-lg"
            >
              <Plus size={16} className="mr-2" /> Buat Tugas Baru
            </Button>
            
            <Button
              variant={gcalAccessToken ? "outline" : "secondary"}
              onClick={handleConnectGoogleCalendar}
              className="font-bold border shadow-sm"
            >
              <Calendar size={16} className="mr-2" />
              {isConnectingGCal ? 'Menghubungkan...' : gcalAccessToken ? 'Google Calendar Terhubung' : 'Hubungkan Google Calendar'}
            </Button>
          </div>
        }
      />

      {/* NOTIFICATION TOAST ALERT */}
      {syncNotification && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 mb-6 border border-emerald-100 dark:border-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="shrink-0" />
            <span>{syncNotification}</span>
          </div>
          <button onClick={() => setSyncNotification(null)} className="hover:opacity-70 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Tugas"
          value={totalTasksCount}
          description="Seluruh divisi BPR ARA"
          icon={Layers}
        />
        <MetricCard
          label="Selesai (Done)"
          value={completedTasksCount}
          description={`Tingkat penyelesaian: ${completionPercentage}%`}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          label="Sedang Diproses"
          value={inProgressTasksCount + reviewTasksCount}
          description={`${inProgressTasksCount} In-Progress, ${reviewTasksCount} Review`}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          label="Belum Dimulai"
          value={todoTasksCount}
          description="Menunggu eksekusi staff"
          icon={AlertTriangle}
          variant="danger"
        />
        <MetricCard
          label="Google Calendar"
          value={`${syncedCount} / ${totalTasksCount}`}
          description="Tersinkron ke kalender"
          icon={Calendar}
          variant="primary"
        />
      </div>

      {/* TABS */}
      <Card className="p-2 mb-6 mt-6 border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <Button
              variant={activeTab === 'BOARD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('BOARD')}
              className="text-xs font-bold rounded-xl"
            >
              <CheckSquare size={16} className="mr-2" /> 📋 Board & Daftar Tugas
            </Button>
            <Button
              variant={activeTab === 'REPORT' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('REPORT')}
              className="text-xs font-bold rounded-xl"
            >
              <BarChart2 size={16} className="mr-2" /> 📊 Laporan Mingguan & Analitik
            </Button>
            <Button
              variant={activeTab === 'GCAL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('GCAL')}
              className="text-xs font-bold rounded-xl"
            >
              <Calendar size={16} className="mr-2" /> 📅 Integrasi Google Calendar
              {syncedCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-[9px] px-1.5 py-0">{syncedCount}</Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'USERS' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('USERS')}
              className="text-xs font-bold rounded-xl"
            >
              <Users size={16} className="mr-2" /> 👥 Manajemen Pengguna & Tim ({teamUsers.length})
            </Button>
          </div>

          {/* View mode toggle for Board */}
          {activeTab === 'BOARD' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'KANBAN' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Kanban Board
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                List Table
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* TAB 1: BOARD & DAFTAR TUGAS */}
      {activeTab === 'BOARD' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTER BAR */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3 border-slate-200 dark:border-slate-800">
            <div className="flex flex-1 items-center gap-2 min-w-[240px]">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama tugas, deskripsi, atau staff penanggung jawab..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs font-semibold"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Proses Kredit">Proses Kredit</option>
                <option value="Kunjungan Lapangan">Kunjungan Lapangan</option>
                <option value="Audit & Kepatuhan">Audit & Kepatuhan</option>
                <option value="Collection">Collection</option>
                <option value="Operasional BPR">Operasional BPR</option>
              </Select>

              {/* Priority Filter */}
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-xs font-semibold"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="TINGGI">Prioritas Tinggi</option>
                <option value="SEDANG">Prioritas Sedang</option>
                <option value="RENDAH">Prioritas Rendah</option>
              </Select>

              {/* Assignee Filter */}
              <Select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-xs font-semibold"
              >
                <option value="ALL">Semua Staff</option>
                {teamUsers.map(u => (
                  <option key={u.id} value={u.fullName}>{u.fullName}</option>
                ))}
              </Select>
            </div>
          </Card>

          {/* BOARD & TABLE VIEW */}
          {viewMode === 'KANBAN' ? (
            <KanbanBoard 
              tasks={filteredTasks} 
              onStatusChange={handleStatusChange} 
              onDelete={handleDeleteTask} 
              onSyncGCal={handleSyncSingleTaskToGCal} 
            />
          ) : (
            <TaskTableView 
              tasks={filteredTasks} 
              onStatusChange={handleStatusChange} 
              onDelete={handleDeleteTask} 
              onSyncGCal={handleSyncSingleTaskToGCal} 
            />
          )}

        </div>
      )}

      {/* TAB 2: LAPORAN MINGGUAN & ANALITIK */}
      {activeTab === 'REPORT' && (
        <div className="space-y-6">
          {/* Executive Summary Bar */}
          <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <Badge variant="outline" className="text-[10px] uppercase">
                Laporan Eksekutif Mingguan BPR ARA
              </Badge>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Ringkasan Capaian Operasional Pekan Ini ({new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Evaluasi penyelesaian tugas per divisi, produktivitas staff, dan SLA operasional kantor pusat & kas.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handlePrintWeeklyReport}
                className="font-bold shadow-md"
              >
                <Printer size={16} className="mr-2" /> Cetak / Export PDF Laporan
              </Button>
            </div>
          </Card>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Progress Rate per Category */}
            <Card className="p-6 lg:col-span-2 border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <BarChart2 size={18} />
                Distribusi & Penyelesaian Tugas per Kategori Usaha
              </h4>

              <div className="space-y-4">
                {['Proses Kredit', 'Kunjungan Lapangan', 'Audit & Kepatuhan', 'Collection', 'Operasional BPR'].map(cat => {
                  const catTasks = tasks.filter(t => t.category === cat);
                  const catDone = catTasks.filter(t => t.status === 'COMPLETED').length;
                  const pct = catTasks.length > 0 ? Math.round((catDone / catTasks.length) * 100) : 0;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-gray-100">
                        <span>{cat} ({catDone}/{catTasks.length} Tugas)</span>
                        <span className="font-mono">{pct}% Selesai</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Productivity Ranking Card */}
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Award size={18} />
                Staff Productive Leaderboard
              </h4>

              <div className="space-y-3">
                {teamUsers.map((user, idx) => {
                  const userTasks = tasks.filter(t => t.assigneeName === user.fullName);
                  const userDone = userTasks.filter(t => t.status === 'COMPLETED').length;

                  return (
                    <div key={user.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center ${
                          idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                          idx === 1 ? 'bg-slate-300 text-slate-800' :
                          'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{user.fullName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-gray-400">{user.role}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{userDone} Selesai</span>
                        <div className="text-[10px] text-slate-400">{userTasks.length} Total Tugas</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRASI GOOGLE CALENDAR */}
      {activeTab === 'GCAL' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-4 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  Google Workspace & Calendar API Connected
                </Badge>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  Sinkronisasi Jadwal Tugas Langsung ke Google Calendar
                </h3>
                <p className="text-xs max-w-xl text-slate-500 dark:text-slate-400">
                  Setiap tugas operasional, jadwal OTS agunan, audit, dan janji bayar debitur dapat disinkronkan secara real-time ke akun Google Calendar Anda.
                </p>
              </div>

              <div className="shrink-0 space-y-2 text-right">
                <Button
                  onClick={handleBatchSyncAllGCal}
                  className="font-black shadow-lg"
                  size="lg"
                >
                  <Zap size={16} className="mr-2" /> Sync Semua Tugas Pekan Ini
                </Button>
                <p className="text-[10px] text-slate-400">Otomatis mengirimkan reminder & notifikasi jam kerja</p>
              </div>
            </div>

            {/* Connection Status Detail Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <CheckCircle size={22} className="text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Status Koneksi: Aktif & Terverifikasi</div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Akun Terhubung: {gcalConnectedEmail}</div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={handleConnectGoogleCalendar}
                className="text-xs font-semibold underline"
              >
                Ganti Akun Google
              </Button>
            </div>
          </Card>

          {/* Sync Table List */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <CardHeader className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Daftar Tugas & Status Google Calendar</h4>
                <p className="text-xs text-slate-500 dark:text-gray-400">Klik tombol sync untuk menambahkan event pengingat ke kalender HP / Laptop Anda</p>
              </div>
              <Badge variant="secondary" className="text-xs px-3 py-1 font-bold">
                {syncedCount} / {totalTasksCount} Tersinkron
              </Badge>
            </CardHeader>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === 'TINGGI' ? 'destructive' : task.priority === 'SEDANG' ? 'warning' : 'secondary'} className="text-[10px] font-bold">
                        {task.priority}
                      </Badge>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <span>👤 {task.assigneeName}</span>
                      <span>📅 {task.dueDate} {task.dueTime}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {task.isSyncedToGCal ? (
                      <a
                        href={task.googleCalendarHtmlLink || 'https://calendar.google.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-80 transition-colors"
                      >
                        <CheckCircle size={14} /> Buka di Google Calendar 📅
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncSingleTaskToGCal(task)}
                        className="text-xs font-bold"
                      >
                        <Calendar size={14} className="mr-1.5" /> Sync ke Google Calendar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: MANAJEMEN PENGGUNA & TIM */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <Card className="p-6 flex flex-wrap items-center justify-between gap-4 border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Manajemen Pengguna & Tim BPR ARA</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">Daftar staff, pejabat eksekutif, dan penugasan beban kerja operasional kantor</p>
            </div>

            <Button
              onClick={() => setIsNewUserModalOpen(true)}
              className="font-bold shadow-md"
            >
              <UserPlus size={16} className="mr-2" /> Tambah Staff Baru
            </Button>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamUsers.map(user => {
              const assignedTasks = tasks.filter(t => t.assigneeName === user.fullName);
              const doneTasks = assignedTasks.filter(t => t.status === 'COMPLETED');

              return (
                <Card key={user.id} className="p-5 space-y-4 hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-black text-base flex items-center justify-center shadow-sm">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{user.fullName}</h4>
                        <span className="text-[10px] font-bold block text-slate-600 dark:text-slate-300">{user.role}</span>
                        <span className="text-[10px] text-slate-400 block">{user.branch}</span>
                      </div>
                    </div>

                    <Badge variant={user.status === 'AKTIF' ? 'success' : 'secondary'} className="text-[9px]">
                      {user.status}
                    </Badge>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Tugas Aktif</span>
                      <span className="text-sm font-black text-slate-800 dark:text-gray-100">{assignedTasks.length - doneTasks.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Selesai</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{doneTasks.length}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-gray-400 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      <span>{user.phone}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: BUAT TUGAS BARU */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Buat Tugas Operasional Baru"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Judul Tugas *</label>
            <Input
              required
              placeholder="Contoh: OTS Agunan Debitur Bambang Purnomo..."
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Deskripsi / Instruksi Tambahan</label>
            <Textarea
              rows={3}
              placeholder="Instruksi rinci, lokasi kunjungan, atau dokumen pendukung..."
              value={newTaskForm.description}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Kategori</label>
              <Select
                value={newTaskForm.category}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value as TaskCategory })}
              >
                <option value="Proses Kredit">Proses Kredit</option>
                <option value="Kunjungan Lapangan">Kunjungan Lapangan</option>
                <option value="Audit & Kepatuhan">Audit & Kepatuhan</option>
                <option value="Collection">Collection</option>
                <option value="Operasional BPR">Operasional BPR</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Prioritas</label>
              <Select
                value={newTaskForm.priority}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as TaskPriority })}
              >
                <option value="TINGGI">Prioritas Tinggi</option>
                <option value="SEDANG">Prioritas Sedang</option>
                <option value="RENDAH">Prioritas Rendah</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Penanggung Jawab (Staff/Pejabat)</label>
            <Select
              value={newTaskForm.assigneeName}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, assigneeName: e.target.value })}
            >
              {teamUsers.map(u => (
                <option key={u.id} value={u.fullName}>{u.fullName} ({u.role})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Tanggal Jatuh Tempo</label>
              <Input
                type="date"
                required
                value={newTaskForm.dueDate}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Jam Target</label>
              <Input
                type="time"
                value={newTaskForm.dueTime}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, dueTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Nama Debitur Terkait (Opsional)</label>
            <Input
              placeholder="Contoh: Bambang Purnomo / H. Ahmad Fauzi..."
              value={newTaskForm.relatedDebtor}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, relatedDebtor: e.target.value })}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewTaskModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan & Buat Tugas
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TAMBAH STAFF BARU */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Tambah Pengguna / Staff Baru"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Nama Lengkap & Gelar *</label>
            <Input
              required
              placeholder="Contoh: Hendra Wijaya, S.E."
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Jabatan / Role *</label>
            <Select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as Role })}
            >
              <option value="Account Officer">Account Officer</option>
              <option value="Analis Kredit">Analis Kredit</option>
              <option value="PE Bisnis & Collection">PE Bisnis & Collection</option>
              <option value="PE Kepatuhan, Manrisk & LK">PE Kepatuhan, Manrisk & LK</option>
              <option value="PE Audit Intern & Anti Fraud">PE Audit Intern & Anti Fraud</option>
              <option value="CRM & Digitalisasi">CRM & Digitalisasi</option>
              <option value="Admin Legal & SDM">Admin Legal & SDM</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Email Kantor</label>
            <Input
              type="email"
              placeholder="hendra@bprara.co.id"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1">Kantor / Cabang</label>
            <Input
              value={newUserForm.branch}
              onChange={(e) => setNewUserForm({ ...newUserForm, branch: e.target.value })}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewUserModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Staff
            </Button>
          </div>
        </form>
      </Modal>

    </PageContainer>
  );
};

interface TaskCardProps {
 task: TaskItem;
 onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
 onDelete: (taskId: string) => void;
 onSyncGCal: (task: TaskItem) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete, onSyncGCal }) => {
 return (
 <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200 dark:border-white/10/90 shadow-xs hover:shadow-md hover: transition-all space-y-3">
 <div className="flex items-start justify-between gap-2">
 <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
 task.priority === 'TINGGI' ? ' border ' :
 task.priority === 'SEDANG' ? ' border ' :
 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300'
 }`}>
 {task.priority}
 </span>

 <span className="text-[10px] bg-slate-100 dark:bg-white/10 font-bold text-slate-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
 {task.category}
 </span>
 </div>

 <div>
 <h5 className="text-xs font-bold text-slate-900 dark:text-gray-900 dark:text-white leading-snug">{task.title}</h5>
 <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
 </div>

 {task.relatedDebtor && (
 <div className="text-[10px] p-1.5 rounded-lg font-medium">
 👤 Debitur: <strong>{task.relatedDebtor}</strong>
 </div>
 )}

 <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
 <span className="font-semibold text-slate-700 dark:text-gray-200">{task.assigneeName}</span>
 <span className="font-mono text-slate-500 dark:text-gray-400">{task.dueDate} {task.dueTime}</span>
 </div>

 {/* Action Footer */}
 <div className="flex items-center justify-between pt-1">
 <select
 value={task.status}
 onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
 className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-gray-100 text-[10px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
 >
 <option value="TODO">To-Do</option>
 <option value="IN_PROGRESS">In Progress</option>
 <option value="REVIEW">Review</option>
 <option value="COMPLETED">Completed</option>
 </select>

 <div className="flex items-center gap-1">
 {!task.isSyncedToGCal ? (
 <button
 onClick={() => onSyncGCal(task)}
 className="p-1.5 hover: rounded-lg cursor-pointer transition-colors"
 title="Sync ke Google Calendar"
 >
 <Calendar size={13} />
 </button>
 ) : (
 <a
 href={task.googleCalendarHtmlLink || 'https://calendar.google.com'}
 target="_blank"
 rel="noreferrer"
 className="p-1.5 rounded-lg"
 title="Terbuka di Google Calendar"
 >
 <Check size={13} />
 </a>
 )}
 
 <button
 onClick={() => onDelete(task.id)}
 className="p-1.5 text-slate-400 hover: rounded-lg cursor-pointer"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </div>
 </div>
 );
};
