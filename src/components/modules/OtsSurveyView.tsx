import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  AlertOctagon,
  Clock,
  Calendar,
  FileText,
  Camera,
  Send,
  Home,
  User,
  Fingerprint,
  Bell,
  RefreshCcw,
  ClipboardList,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Activity,
  Megaphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditPipelineHeader } from '../ui/CreditPipelineHeader';

export const OtsSurveyView: React.FC = () => {
  const { creditApplications, submitSurveyReport, collectionCases, recordCollectionVisit, recordAttendanceCheckIn, currentUser } = useApp();

  // Mobile App Navigation State
  const [currentTab, setCurrentTab] = useState<'BERANDA' | 'ABSENSI' | 'DATA_ABSENSI'>('BERANDA');
  const [activeMenu, setActiveMenu] = useState<'NONE' | 'AKTIVITAS_LIST' | 'AKTIVITAS_FORM'>('NONE');

  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Dates
  const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime);
  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // ----------------------------------------------------------------------
  // ACTIVITY & OTS LOGIC
  // ----------------------------------------------------------------------
  const [activityType, setActivityType] = useState<'COLLECTION' | 'LOS'>('COLLECTION');
  const [selectedId, setSelectedId] = useState<string>('');

  const surveyPendingApps = creditApplications.filter(a => a.currentStage === 'SURVEY' || a.currentStage === 'VERIFICATION');
  const pendingCollectionCases = collectionCases.filter(c => c.dpdDays > 0);
  
  const activeCase = collectionCases.find(c => c.id === selectedId);
  const activeApp = creditApplications.find(a => a.id === selectedId);

  const [formState, setFormState] = useState({ outcome: '', notes: '' });

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (activityType === 'COLLECTION' && activeCase) {
      if (!formState.outcome) return alert('Pilih hasil kunjungan!');
      recordCollectionVisit(activeCase.id, {
        date: currentTime.toISOString().split('T')[0],
        collectorName: currentUser.name,
        gpsLocation: `-7.55611, 110.8222 (Akurasi: 4m)`, // Solo coordinates roughly
        outcome: formState.outcome,
        nextAction: formState.notes || 'Tidak ada catatan tambahan.',
      });
      alert('Laporan Aktivitas Berhasil Dikirim!');
      setActiveMenu('AKTIVITAS_LIST');
    } else if (activityType === 'LOS' && activeApp) {
      submitSurveyReport(activeApp.id, { surveyorSummary: formState.notes, surveyScore: 85 } as any);
      alert('Laporan Survey Dikirim!');
      setActiveMenu('AKTIVITAS_LIST');
    }
  };

  const handleAbsenMasuk = () => {
    recordAttendanceCheckIn(-7.55611, 110.8222, '', 'Absen Masuk Mobile');
    alert('Berhasil Absen Masuk!');
    setCurrentTab('BERANDA');
  };

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // ----------------------------------------------------------------------
  // COMPONENTS FOR SCREENS
  // ----------------------------------------------------------------------

  const renderBeranda = () => (
    <div className="pb-24 animate-in fade-in bg-background min-h-full">
      {/* Blue Header Section */}
      <div className="bg-primary rounded-b-[40px] pt-12 pb-16 px-6 text-primary-foreground relative shadow-lg">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20">
              <User className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-white">absen ara</p>
              <p className="text-[10px] font-medium text-white/80">{currentUser.role}</p>
            </div>
          </div>
          <button className="relative">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border border-primary"></span>
          </button>
        </div>

        {/* Company Logo Placeholder */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <Briefcase className="w-3 h-3 text-primary" />
              </div>
              <span className="font-black italic text-sm tracking-widest text-white">PT. BPR ARA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping Content Box */}
      <div className="-mt-12 px-5 space-y-4">
        
        {/* Attendance Card */}
        <div className="bg-surface rounded-2xl shadow-lg p-5 border border-border">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted font-bold">Reguler</p>
                <p className="text-sm font-black text-foreground">08:00 - 17:00</p>
                <p className="text-[10px] font-bold text-primary mt-0.5">Masuk: -</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted font-bold">{formattedDate.split(',')[0]}</p>
              <p className="text-[10px] font-medium text-muted mt-0.5">{formattedDate.split(',')[1]}</p>
              <p className="text-[10px] font-bold text-muted mt-0.5">Pulang: -</p>
            </div>
          </div>
          
          <div className="pt-4">
            <h4 className="text-[11px] font-black text-foreground text-center mb-3">Rekap Absensi Bulan ini</h4>
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-border">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase">Hadir <ChevronRight className="inline w-3 h-3"/></p>
                <p className="text-sm font-black text-success mt-0.5">0 Hari</p>
                <div className="w-full h-1 bg-success mt-2 rounded-full"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase">Izin <ChevronRight className="inline w-3 h-3"/></p>
                <p className="text-sm font-black text-primary mt-0.5">0 Hari</p>
                <div className="w-full h-1 bg-primary mt-2 rounded-full"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase">Saldo Cuti <ChevronRight className="inline w-3 h-3"/></p>
                <p className="text-sm font-black text-warning mt-0.5">12 Hari</p>
                <div className="w-full h-1 bg-warning mt-2 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Menu Grid */}
        <div>
          <h3 className="font-bold text-foreground text-sm mb-3 px-1 mt-6">Menu Utama</h3>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {[
              { icon: <FileText className="text-primary w-6 h-6"/>, label: 'Izin' },
              { icon: <Clock className="text-primary w-6 h-6"/>, label: 'Lembur' },
              { icon: <RefreshCcw className="text-primary w-6 h-6"/>, label: 'Shift' },
              { icon: <Wallet className="text-primary w-6 h-6"/>, label: 'Reimbursement' },
              { icon: <Wallet className="text-primary w-6 h-6"/>, label: 'Info Gaji' },
              { 
                icon: <ClipboardList className="text-primary w-6 h-6"/>, 
                label: 'Aktivitas',
                action: () => setActiveMenu('AKTIVITAS_LIST')
              },
              { icon: <Megaphone className="text-primary w-6 h-6"/>, label: 'Pengumuman' },
            ].map((menu, i) => (
              <div key={i} onClick={menu.action} className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform">
                <div className="w-12 h-12 bg-surface rounded-2xl shadow-sm border border-border flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary-light opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {menu.icon}
                </div>
                <span className="text-[10px] font-medium text-muted text-center leading-tight w-16">{menu.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const renderAbsensiMap = () => (
    <div className="h-full flex flex-col bg-background relative animate-in fade-in">
      {/* Fake Map Background */}
      <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/14/11993/8664.png')] bg-cover bg-center opacity-70 mix-blend-multiply"></div>
      
      {/* Header Back */}
      <div className="relative z-10 pt-12 px-4 flex justify-between items-center">
        <button onClick={() => setCurrentTab('BERANDA')} className="w-10 h-10 bg-surface rounded-full flex items-center justify-center shadow-lg text-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center shadow-lg text-muted">
          <RefreshCcw className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Map Pins */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="animate-bounce">
          <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center shadow-lg border-2 border-white">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Action */}
      <div className="relative z-20 bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 pb-24 space-y-4">
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-2"></div>
        
        <div className="flex items-center gap-3 bg-background p-3 rounded-xl">
          <MapPin className="text-muted w-5 h-5" />
          <div>
            <p className="text-[10px] font-medium text-muted">Lokasi</p>
            <p className="text-sm font-bold text-foreground">Kantor BPR ARA - Pusat</p>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <Clock className="text-muted w-5 h-5" />
            <div>
              <p className="text-[11px] font-bold text-foreground">Reguler</p>
              <p className="text-sm font-black text-foreground">08:00 - 17:00</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-muted">{formattedDate}</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-surface border border-border p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <Briefcase className="text-primary w-5 h-5" />
            <p className="text-xs font-bold text-muted">Jam Kerja<br/><span className="text-muted font-medium">-</span></p>
          </div>
          <button onClick={handleAbsenMasuk} className="bg-success hover:bg-success/90 active:bg-success/80 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-success/30 transition-all">
            Absensi Masuk <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex justify-between items-center bg-surface border border-border p-3 rounded-2xl shadow-sm opacity-50">
          <div className="flex items-center gap-3">
            <Clock className="text-warning w-5 h-5" />
            <p className="text-xs font-bold text-muted">Istirahat<br/><span className="text-muted font-medium">-</span></p>
          </div>
          <button className="bg-muted text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
            Mulai Istirahat <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAktivitasList = () => (
    <div className="h-full bg-background flex flex-col animate-in slide-in-from-right-4 pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pt-12 flex items-center justify-between">
        <button onClick={() => setActiveMenu('NONE')} className="p-2"><ArrowLeft size={20}/></button>
        <h2 className="font-bold">Laporan Aktivitas</h2>
        <button className="p-2"><div className="w-5 h-5"></div></button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface border-b border-border">
        <button 
          onClick={() => setActivityType('COLLECTION')}
          className={`flex-1 py-3 text-[11px] font-bold text-center border-b-2 transition-colors ${activityType === 'COLLECTION' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
        >
          PENAGIHAN ({pendingCollectionCases.length})
        </button>
        <button 
          onClick={() => setActivityType('LOS')}
          className={`flex-1 py-3 text-[11px] font-bold text-center border-b-2 transition-colors ${activityType === 'LOS' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
        >
          SURVEY ({surveyPendingApps.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activityType === 'COLLECTION' && pendingCollectionCases.map(c => (
          <div key={c.id} onClick={() => { setSelectedId(c.id); setActiveMenu('AKTIVITAS_FORM'); }} className="bg-surface p-4 rounded-xl shadow-sm border border-border cursor-pointer active:bg-primary-light/50 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm text-foreground">{c.debtorName}</span>
              <span className="text-[9px] font-black bg-danger/10 text-danger px-1.5 py-0.5 rounded">DPD {c.dpdDays}</span>
            </div>
            <p className="text-[10px] text-muted font-medium">Tunggakan: <strong className="text-foreground">{formatIDR(c.overdueAmount)}</strong></p>
          </div>
        ))}
        {activityType === 'LOS' && surveyPendingApps.map(app => (
          <div key={app.id} onClick={() => { setSelectedId(app.id); setActiveMenu('AKTIVITAS_FORM'); }} className="bg-surface p-4 rounded-xl shadow-sm border border-border cursor-pointer active:bg-primary-light/50 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm text-foreground">{app.customerName}</span>
              <span className="text-[9px] font-black bg-primary-light text-primary px-1.5 py-0.5 rounded">SURVEY BARU</span>
            </div>
            <p className="text-[10px] text-muted font-medium">Plafon: <strong className="text-foreground">{formatIDR(app.requestedPlafon)}</strong></p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAktivitasForm = () => (
    <div className="h-full bg-surface flex flex-col animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pt-12 flex items-center justify-between">
        <button onClick={() => setActiveMenu('AKTIVITAS_LIST')} className="p-2"><ArrowLeft size={20}/></button>
        <h2 className="font-bold text-sm truncate max-w-[200px]">
          {activityType === 'COLLECTION' ? activeCase?.debtorName : activeApp?.customerName}
        </h2>
        <button className="p-2"><div className="w-5 h-5"></div></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-background pb-24">
        {/* Step 1: Geotag (Auto) */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase mb-2 block">1. Bukti Lokasi (Otomatis)</label>
          <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success"><MapPin size={20}/></div>
            <div>
              <div className="text-foreground font-bold text-xs">-7.55611, 110.8222</div>
              <div className="text-[9px] text-success font-bold bg-success/10 px-1 py-0.5 rounded inline-block mt-1">✓ LOKASI SESUAI (Akurasi 4m)</div>
            </div>
          </div>
        </div>

        {/* Step 2: Camera */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase mb-2 block">2. Foto Bukti (Kamera)</label>
          <button className="w-full bg-surface border-2 border-dashed border-muted/30 rounded-xl py-8 flex flex-col items-center justify-center text-primary active:bg-primary-light transition-colors">
            <Camera size={32} className="mb-2"/>
            <span className="font-bold text-xs">Ketuk untuk Buka Kamera</span>
          </button>
        </div>

        {/* Step 3: Outcome */}
        {activityType === 'COLLECTION' && (
          <div>
            <label className="text-[10px] font-bold text-muted uppercase mb-2 block">3. Hasil Kunjungan</label>
            <div className="grid grid-cols-2 gap-2">
              {['Janji Bayar', 'Bayar Langsung', 'Rumah Kosong', 'Tolak Bayar'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFormState({...formState, outcome: opt})}
                  className={`p-2.5 rounded-lg text-[11px] font-bold border transition-colors ${
                    formState.outcome === opt ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-border text-muted hover:bg-background'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Notes */}
        <div>
          <label className="text-[10px] font-bold text-muted uppercase mb-2 block">4. Catatan (Opsional)</label>
          <textarea
            rows={3}
            value={formState.notes}
            onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
            placeholder="Tuliskan keterangan tambahan..."
            className="w-full p-3 rounded-xl bg-surface border border-border text-xs focus:outline-none focus:border-primary font-medium text-foreground"
          />
        </div>
        
        <button onClick={handleSaveActivity} className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-4">
          <Send size={16}/> Kirim Laporan
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center bg-primary-navy min-h-screen -mx-4 -mt-4 p-4 sm:p-8">
      <div className="w-full max-w-[400px]">
        <CreditPipelineHeader currentStage="Field Survey" />
      </div>
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[400px] bg-background rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[800px] border-[12px] border-black relative">
        
        {/* Dynamic Island / Notch Simulation */}
        <div className="absolute top-0 w-full flex justify-center z-50">
          <div className="w-32 h-6 bg-black rounded-b-3xl"></div>
        </div>
        <div className="absolute top-0 left-0 w-full px-6 py-1.5 flex justify-between items-center text-white text-[10px] font-bold z-40">
          <span>{formattedTime}</span>
          <div className="flex gap-1.5 items-center">
            <Activity size={10}/>
            <div className="w-4 h-2.5 border border-white rounded-[2px] relative"><div className="absolute inset-px bg-white w-[80%]"></div></div>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden relative">
          {activeMenu === 'NONE' ? (
            <>
              {currentTab === 'BERANDA' && renderBeranda()}
              {currentTab === 'ABSENSI' && renderAbsensiMap()}
              {currentTab === 'DATA_ABSENSI' && <div className="p-8 text-center text-muted mt-20">Fitur Data Absensi belum aktif.</div>}
            </>
          ) : (
            <>
              {activeMenu === 'AKTIVITAS_LIST' && renderAktivitasList()}
              {activeMenu === 'AKTIVITAS_FORM' && renderAktivitasForm()}
            </>
          )}
        </div>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        {activeMenu === 'NONE' && (
          <div className="bg-surface border-t border-border px-6 py-2 pb-6 absolute bottom-0 w-full z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end">
              
              <button 
                onClick={() => setCurrentTab('BERANDA')} 
                className={`flex flex-col items-center gap-1 w-16 ${currentTab === 'BERANDA' ? 'text-primary' : 'text-muted'}`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] font-bold">BERANDA</span>
              </button>

              {/* Big Center Button */}
              <button 
                onClick={() => setCurrentTab('ABSENSI')} 
                className="relative -top-5 flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 text-white border-4 border-surface group-active:scale-95 transition-transform hover:bg-primary-dark">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${currentTab === 'ABSENSI' ? 'text-primary' : 'text-muted'}`}>ABSENSI</span>
              </button>

              <button 
                onClick={() => setCurrentTab('DATA_ABSENSI')} 
                className={`flex flex-col items-center gap-1 w-16 ${currentTab === 'DATA_ABSENSI' ? 'text-primary' : 'text-muted'}`}
              >
                <ClipboardList className="w-5 h-5" />
                <span className="text-[9px] font-bold text-center leading-tight">DATA<br/>ABSENSI</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
