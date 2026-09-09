import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronLeft,
  MapPin,
  Clock,
  LogOut
} from 'lucide-react';

const MobileLiveAttendance: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [todayRecord, setTodayRecord] = useState<any>(null);

  useEffect(() => {
    fetchTodayRecord();
  }, []);

  const fetchTodayRecord = async () => {
    if (!currentUser) return;
    try {
      const d = new Date();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      
      const res = await fetch(`/api/attendances?user_id=${currentUser.id}&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        // Find today's record
        const todayStr = d.toISOString().split('T')[0];
        const record = data.data.find((r: any) => r.date === todayStr);
        if (record) setTodayRecord(record);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClockIn = async () => {
    if (!currentUser) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/attendances/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          lat: -7.795580,
          lng: 110.369490,
          location: "Jl. Melati No. 12, Kec. Gamping, Sleman, Yogyakarta"
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: data.message });
        setTodayRecord(data.data);
      } else {
        setStatusMsg({ type: 'error', text: data.error });
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Koneksi gagal' });
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!currentUser) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/attendances/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          lat: -7.795580,
          lng: 110.369490,
          location: "Jl. Melati No. 12, Kec. Gamping, Sleman, Yogyakarta"
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: data.message });
        setTodayRecord(data.data);
      } else {
        setStatusMsg({ type: 'error', text: data.error });
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Koneksi gagal' });
    }
    setLoading(false);
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bg-[#f8fafc] dark:bg-gray-900 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 dark:text-gray-300">
          <ChevronLeft className="w-5 h-5 font-bold" />
        </button>
        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Absen</h1>
        <div className="w-9" />
      </div>

      <div className="p-5 flex flex-col gap-5">
        
        {/* Status Message */}
        {statusMsg && (
          <div className={`p-3 rounded-lg text-xs font-bold ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lokasi */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Lokasi Saat Ini</h3>
              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mt-1 leading-snug">
                Jl. Melati No. 12<br/>Kec. Gamping, Sleman,<br/>Yogyakarta
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-gray-400">Akurasi: 12 m</span>
            </div>
          </div>

          {/* Jam */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2">Jam Masuk & Pulang</h3>
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-gray-600 dark:text-gray-400">Masuk</span>
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{todayRecord?.clock_in_time || '--:--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-600 dark:text-gray-400">Pulang</span>
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{todayRecord?.clock_out_time || '--:--'}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-[9px] text-gray-400">{todayStr}</span>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="relative w-full h-48 bg-[#e5e7eb] dark:bg-gray-800 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
          <svg className="w-full h-full opacity-60 dark:opacity-30" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            {/* Simulated streets */}
            <path d="M -50 50 L 450 150 M -50 100 L 450 200 M 100 -50 L 50 350 M 200 -50 L 250 350 M 300 -50 L 150 350" stroke="#cbd5e1" strokeWidth="4" fill="none" />
            <path d="M -50 80 L 450 180 M -50 130 L 450 230" stroke="#cbd5e1" strokeWidth="2" fill="none" />
          </svg>
          
          {/* My Location Pin */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {/* Tooltip */}
            <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-lg mb-2 whitespace-nowrap border border-gray-100 dark:border-gray-700 relative">
              <div className="flex items-start gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>
                <div>
                  <p className="text-[9px] font-bold text-gray-800 dark:text-gray-100">Lokasi Anda saat ini</p>
                  <p className="text-[8px] text-gray-500">Jl. Melati No. 12, Kec. Gamping...</p>
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 rotate-45 border-r border-b border-gray-100 dark:border-gray-700"></div>
            </div>
            
            {/* Pulsing Dot */}
            <div className="relative flex justify-center items-center">
              <div className="absolute w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
              <div className="absolute w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-2">
          <button 
            disabled={loading || !!todayRecord?.clock_in_time}
            onClick={handleClockIn}
            className={`flex-1 flex flex-col items-start p-4 rounded-2xl transition-all shadow-md active:scale-95 ${todayRecord?.clock_in_time ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            <LogOut className={`w-6 h-6 mb-1 ${todayRecord?.clock_in_time ? 'text-gray-400' : 'text-emerald-100'}`} />
            <span className={`text-xs font-bold ${todayRecord?.clock_in_time ? 'text-gray-500' : 'text-white'}`}>Absen Masuk</span>
            <span className={`text-[9px] ${todayRecord?.clock_in_time ? 'text-gray-400' : 'text-emerald-200'}`}>Masuk kerja</span>
          </button>

          <button 
            disabled={loading || !todayRecord?.clock_in_time || !!todayRecord?.clock_out_time}
            onClick={handleClockOut}
            className={`flex-1 flex flex-col items-start p-4 rounded-2xl transition-all shadow-md active:scale-95 ${(!todayRecord?.clock_in_time || todayRecord?.clock_out_time) ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <LogOut className={`w-6 h-6 mb-1 rotate-180 ${(!todayRecord?.clock_in_time || todayRecord?.clock_out_time) ? 'text-gray-400' : 'text-blue-100'}`} />
            <span className={`text-xs font-bold ${(!todayRecord?.clock_in_time || todayRecord?.clock_out_time) ? 'text-gray-500' : 'text-white'}`}>Absen Pulang</span>
            <span className={`text-[9px] ${(!todayRecord?.clock_in_time || todayRecord?.clock_out_time) ? 'text-gray-400' : 'text-blue-200'}`}>Pulang kerja</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default MobileLiveAttendance;
