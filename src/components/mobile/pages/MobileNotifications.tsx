import React from 'react';
import { 
  CheckCircle,
  ClipboardList,
  Megaphone,
  FileText,
  Clock,
  Settings,
  SlidersHorizontal
} from 'lucide-react';

const MobileNotifications: React.FC = () => {
  const notifications = [
    {
      title: 'Pengajuan Cuti Disetujui',
      message: 'Pengajuan cuti Anda untuk tanggal 21-22 Apr 2025 telah disetujui oleh Bapak/Ibu...',
      time: '2 jam lalu',
      icon: CheckCircle,
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      color: 'text-emerald-500'
    },
    {
      title: 'Task Baru',
      message: 'Anda mendapat tugas baru: Verifikasi Data Nasabah - Loan Origination',
      time: '4 jam lalu',
      icon: ClipboardList,
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      color: 'text-blue-500'
    },
    {
      title: 'Pengumuman',
      message: 'Rapat bulanan seluruh karyawan akan dilaksanakan pada hari Jumat, 25 Apr 2025...',
      time: '6 jam lalu',
      icon: Megaphone,
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      color: 'text-orange-500'
    },
    {
      title: 'Pengajuan Izin',
      message: 'Pengajuan izin sakit Anda untuk tanggal 18 Apr 2025 telah disetujui.',
      time: 'Kemarin',
      icon: FileText,
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      color: 'text-emerald-500'
    },
    {
      title: 'Reminder',
      message: 'Jangan lupa untuk melakukan absen pulang hari ini sebelum pukul 17:00.',
      time: 'Kemarin',
      icon: Clock,
      bg: 'bg-red-50 dark:bg-red-900/30',
      color: 'text-red-500'
    },
    {
      title: 'Update Sistem',
      message: 'Maintenance sistem akan dilakukan pada 26 Apr 2025 pukul 22:00 - 24:00.',
      time: 'Kemarin',
      icon: Settings,
      bg: 'bg-slate-100 dark:bg-slate-800',
      color: 'text-slate-500'
    }
  ];

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Notification</h1>
        <button className="text-gray-500 hover:text-gray-800 transition-colors">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {notifications.map((notif, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex gap-3">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${notif.bg}`}>
              <notif.icon className={`w-5 h-5 ${notif.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">{notif.title}</h3>
                <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap ml-2">{notif.time}</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                {notif.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileNotifications;
