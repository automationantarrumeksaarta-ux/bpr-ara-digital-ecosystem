import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, MapPin, X, AlertTriangle, RefreshCcw, Save } from 'lucide-react';
import { useCreateAbsence } from '../../hooks/useDashboardData';

interface ActivityAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userId?: string;
}

export const ActivityAbsenceModal: React.FC<ActivityAbsenceModalProps> = ({ 
  isOpen, 
  onClose,
  userId = 'user-1'
}) => {
  const { mutate: createAbsence, isPending: isCreatingAbsence } = useCreateAbsence();
  
  // Dummy tasks for dropdown
  const dummyTasks = [
    { id: 't1', title: 'Visit Nasabah A' },
    { id: 't2', title: 'Survey Lokasi Proyek B' },
    { id: 't3', title: 'Meeting Internal Cabang' }
  ];

  const [taskId, setTaskId] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('Prospek');
  const [visitResult, setVisitResult] = useState('');
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setLocationError("Kamera tidak didukung pada perangkat/browser ini (Mungkin karena bukan koneksi HTTPS).");
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setLocationError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const fetchLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        }
      },
      (error) => {
        setLocationError('Akses lokasi ditolak. Wajib mengizinkan lokasi untuk absen.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      fetchLocation();
    } else {
      stopCamera();
      setPhotoDataUrl(null);
      setLocation(null);
      setAddress('');
      setTaskId('');
      setClientName('');
      setVisitResult('');
    }
    return () => stopCamera();
  }, [isOpen, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !location) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`;
    const locationStr = address || `Lat: ${location.lat}, Lng: ${location.lng}`;
    
    ctx.fillText(timestamp, 20, canvas.height - 50);
    ctx.fillText(locationStr.substring(0, 80) + (locationStr.length > 80 ? '...' : ''), 20, canvas.height - 20);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPhotoDataUrl(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDataUrl || !location) {
      alert("Foto dan Lokasi wajib ada!");
      return;
    }

    const newAbsence = {
      id: `abs-${Date.now()}`,
      userId,
      taskId: taskId || undefined,
      activity: 'Aktivitas Tercatat',
      clientName,
      visitResult,
      category,
      photoUrl: photoDataUrl,
      latitude: location.lat,
      longitude: location.lng,
      address: address,
      timestamp: new Date().toISOString()
    };

    createAbsence(newAbsence);

    // Generate Google Calendar URL
    const title = encodeURIComponent(`Absen: ${category} - ${clientName}`);
    const details = encodeURIComponent(
      `Aktivitas: ${category}\nKlien: ${clientName}\nHasil: ${visitResult}\nLokasi: ${address}`
    );
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const dates = `${dateStr}T090000Z/${dateStr}T100000Z`;
    const locationEncoded = encodeURIComponent(address || `${location.lat},${location.lng}`);
    
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${locationEncoded}&dates=${dates}`;
    
    window.open(gcalUrl, '_blank');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#252528]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-gray-1000/20 flex items-center justify-center text-gray-800 dark:text-gray-200 dark:text-gray-800 dark:text-gray-200">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Absen Aktivitas</h2>
              <p className="text-xs text-gray-500">Wajib menyertakan foto dan lokasi akurat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
              {locationError ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-400 font-medium">{locationError}</p>
                </div>
              ) : photoDataUrl ? (
                <img src={photoDataUrl} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {!locationError && (
              <div className="flex gap-2">
                {!photoDataUrl ? (
                  <button 
                    type="button"
                    onClick={capturePhoto}
                    disabled={!location}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-colors"
                  >
                    {location ? 'Ambil Foto' : 'Mencari Lokasi...'}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={retakePhoto}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-xl font-bold transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> Ulangi Foto
                  </button>
                )}
              </div>
            )}

            <div className={`p-4 rounded-xl flex items-start gap-3 ${location ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'}`}>
              <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{location ? 'Lokasi Terdeteksi' : 'Sedang mendeteksi lokasi...'}</p>
                {address && <p className="text-xs opacity-80 mt-1">{address}</p>}
              </div>
            </div>
          </div>

          <form id="absence-form" onSubmit={handleSubmit} className="w-full lg:w-1/2 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Task Terkait (Opsional)
              </label>
              <select 
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252528] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Pilih Task --</option>
                {dummyTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Kategori Aktivitas <span className="text-red-500">*</span>
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252528] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Prospek">Prospek</option>
                <option value="Visit Maintenance Debitur">Visit Maintenance Debitur</option>
                <option value="Kolaborasi">Kolaborasi</option>
                <option value="Meeting Klien">Meeting Klien</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Nama Klien / Nasabah <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="Contoh: PT. Maju Jaya"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252528] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Deskripsi Hasil Kunjungan <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={visitResult}
                onChange={(e) => setVisitResult(e.target.value)}
                required
                rows={4}
                placeholder="Jelaskan hasil aktivitas..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252528] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-[#252528]/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button 
            form="absence-form"
            type="submit"
            disabled={!photoDataUrl || !!locationError || isCreatingAbsence}
            className="px-6 py-2.5 flex items-center gap-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreatingAbsence ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Absen</>}
          </button>
        </div>
      </div>
    </div>
  );
};
