import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle, Camera, Check, ImageIcon, MapPin, Plus, RefreshCw, Trash2, X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { AppBar, Card, EmptyState, Screen, Skeleton, Stack } from '../ui/primitives';
import { MiniMap } from '../ui/MiniMap';
import { ink, radius, surface, text, tone } from '../ui/tokens';
import { alamatBerkas, ambilApi } from '../../../utils/api';
import { kecilkanGambar } from '../../../utils/gambar';

/**
 * Aktivitas lapangan.
 *
 * Alurnya sengaja satu arah dan pendek: tekan tombol tambah, kamera langsung
 * terbuka, lokasi terdeteksi di latar, lalu tinggal menulis keterangan dan
 * kirim. Petugas mencatat sambil berdiri di lokasi, sering satu tangan.
 *
 * Daftar hanya menampilkan hari berjalan supaya tidak menumpuk; seluruh
 * riwayat tetap tersimpan dan dibaca lewat menu Marketing di web.
 */

const jamDari = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

interface Aktivitas {
  id: string;
  photo_url: string;
  location: string | null;
  description: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

const MobileActivities: React.FC = () => {
  const { currentUser } = useApp();
  const [daftar, setDaftar] = useState<Aktivitas[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [formTerbuka, setFormTerbuka] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const res = await fetch('/api/activities', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const json = await res.json();
      setDaftar(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setDaftar([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { if (currentUser) muat(); }, [currentUser, muat]);

  const hapus = async (id: string) => {
    await fetch(`/api/activities/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    });
    muat();
  };

  const hariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Screen>
      <AppBar title="Aktivitas" back />

      <Stack className="gap-4 pb-24">
        <p className={`${text.caption} ${ink.faint} px-1 -mb-1`}>
          {hariIni} · daftar direset tiap hari, riwayat tetap tersimpan
        </p>

        {memuat ? (
          <Card flush className="p-4 flex flex-col gap-3">
            {[0, 1].map(i => <Skeleton key={i} className="h-24" />)}
          </Card>
        ) : daftar.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={Camera}
              title="Belum ada aktivitas hari ini"
              description="Tekan tombol tambah untuk memotret kunjungan, kanvasing, atau penagihan di lapangan."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {daftar.map(a => (
              <Card key={a.id} flush className="overflow-hidden">
                <img
                  src={alamatBerkas(a.photo_url)}
                  alt={a.description ?? 'Foto aktivitas'}
                  className="w-full aspect-[4/3] object-cover bg-slate-100"
                  loading="lazy"
                />
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`${text.caption} ${ink.faint} flex items-center gap-1 min-w-0`}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{a.location ?? `${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}`}</span>
                    </span>
                    <span className={`${text.caption} ${ink.faint} shrink-0 tabular-nums`}>
                      {jamDari(a.created_at)}
                    </span>
                  </div>
                  {a.description && (
                    <p className={`${text.body} ${ink.base} leading-snug`}>{a.description}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => hapus(a.id)}
                    className={`self-start mt-1 min-h-[36px] px-2 -ml-2 flex items-center gap-1.5 ${text.caption} font-semibold ${ink.faint} active:opacity-50`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>

      {/* Aksi utama layar ini. Satu tombol, satu tugas. */}
      <button
        type="button"
        onClick={() => setFormTerbuka(true)}
        aria-label="Tambah aktivitas"
        className="fixed bottom-8 right-5 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-7 h-7" strokeWidth={2.2} />
      </button>

      {formTerbuka && (
        <FormAktivitas
          onTutup={() => setFormTerbuka(false)}
          onTersimpan={() => { setFormTerbuka(false); muat(); }}
        />
      )}
    </Screen>
  );
};

/* ------------------------------------------------------------------ form */

const FormAktivitas: React.FC<{ onTutup: () => void; onTersimpan: () => void }> = ({
  onTutup, onTersimpan,
}) => {
  const { posisi, alamat, memuat: memuatLokasi, error: errorLokasi, minta } = useGeolocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kamera dibuka begitu form muncul — mengurangi satu ketukan.
  useEffect(() => { inputRef.current?.click(); }, []);

  // Objek URL pratinjau harus dilepas, kalau tidak blob-nya menetap di memori.
  useEffect(() => () => { if (pratinjau) URL.revokeObjectURL(pratinjau); }, [pratinjau]);

  const pilihFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (pratinjau) URL.revokeObjectURL(pratinjau);
    setFile(f);
    setPratinjau(URL.createObjectURL(f));
    setError(null);
  };

  const kirim = async () => {
    if (!file) { setError('Ambil foto terlebih dahulu.'); return; }
    if (!posisi) { setError('Lokasi belum terdeteksi. Tunggu sebentar atau perbarui lokasi.'); return; }

    setMengirim(true);
    setError(null);
    try {
      /*
       * Foto disimpan sebagai data URL, bukan diunggah sebagai berkas.
       *
       * Dua sebab. Pertama, unggahan multipart dari APK tidak dapat diandalkan:
       * CapacitorHttp membaca badan permintaan sebagai teks sehingga isi biner
       * rusak. Kedua, hasil unggahan dikembalikan sebagai jalur `/uploads/...`,
       * dan di dalam APK halaman disajikan dari http://localhost sehingga jalur
       * itu dicari di localhost dan tidak pernah ketemu — itulah ikon gambar
       * rusak yang terlihat di layar Aktivitas.
       *
       * Ukurannya dibatasi 1024 piksel tanpa pemotongan persegi: ini foto bukti
       * kunjungan, dan memotongnya menjadi bujur sangkar dapat membuang bagian
       * yang justru menjadi buktinya.
       */
      const fotoDataUrl = await kecilkanGambar(file, {
        maksPiksel: 1024,
        mutu: 0.72,
        potongPersegi: false,
        batasByte: 700 * 1024,
      });

      const { res, json } = await ambilApi('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          photo_url: fotoDataUrl,
          lat: posisi.lat,
          lng: posisi.lng,
          location: alamat ?? `${posisi.lat.toFixed(5)}, ${posisi.lng.toFixed(5)}`,
          description: keterangan,
        }),
      });
      if (!res.ok) throw new Error(json?.error ?? 'Gagal menyimpan aktivitas');
      onTersimpan();
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setMengirim(false);
    }
  };

  const siap = !!file && !!posisi && !mengirim;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // capture memberi tahu WebView untuk membuka kamera belakang langsung,
        // bukan galeri. Ini bekerja tanpa menambah plugin Capacitor.
        capture="environment"
        onChange={pilihFoto}
        className="hidden"
      />

      <header
        className={`shrink-0 border-b ${surface.divider} flex items-center gap-1 h-12 px-1`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          type="button"
          onClick={onTutup}
          aria-label="Batal"
          className={`w-11 h-11 flex items-center justify-center ${ink.base} active:opacity-50`}
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className={`${text.title} ${ink.strong} flex-1`}>Aktivitas baru</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* --- Foto --- */}
        {pratinjau ? (
          <div className="relative">
            <img src={pratinjau} alt="Pratinjau" className={`w-full aspect-[4/3] object-cover ${radius.card}`} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`absolute bottom-3 right-3 min-h-[36px] px-3 ${radius.pill} bg-slate-900/80 text-white ${text.footnote} font-semibold flex items-center gap-1.5`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Ulangi
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-full aspect-[4/3] ${radius.card} border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 active:bg-slate-50`}
          >
            <Camera className={`w-8 h-8 ${ink.faint}`} strokeWidth={1.5} />
            <span className={`${text.body} font-medium ${ink.base}`}>Ambil foto</span>
            <span className={`${text.caption} ${ink.faint}`}>Kamera akan terbuka</span>
          </button>
        )}

        {/* --- Lokasi --- */}
        <Card flush className="overflow-hidden">
          <div className="px-4 py-3 flex items-start gap-2.5">
            <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${ink.muted}`} />
            <div className="flex-1 min-w-0">
              <span className={`block ${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                Lokasi
              </span>
              {memuatLokasi ? (
                <span className={`block ${text.body} ${ink.faint} mt-1`}>Mencari lokasi…</span>
              ) : errorLokasi ? (
                <span className={`block ${text.footnote} ${tone.danger.text} mt-1`}>{errorLokasi}</span>
              ) : posisi ? (
                <>
                  <span className={`block ${text.body} ${ink.strong} mt-1 leading-snug`}>
                    {alamat ?? 'Alamat tidak dikenali'}
                  </span>
                  <span className={`block ${text.caption} ${ink.faint} mt-1 tabular-nums`}>
                    {posisi.lat.toFixed(5)}, {posisi.lng.toFixed(5)} · ±{posisi.akurasi} m
                  </span>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={minta}
              aria-label="Perbarui lokasi"
              className={`w-9 h-9 -mr-1 -mt-1 flex items-center justify-center ${ink.muted} active:opacity-50`}
            >
              <RefreshCw className={`w-4 h-4 ${memuatLokasi ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {posisi && <MiniMap lat={posisi.lat} lng={posisi.lng} height={140} className="mx-3 mb-3" />}
        </Card>

        {/* --- Keterangan --- */}
        <label className="flex flex-col gap-1.5">
          <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
            Keterangan
          </span>
          <textarea
            value={keterangan}
            onChange={e => setKeterangan(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Mis. Kunjungan penagihan an. Budi Santoso, janji bayar 15 September."
            className={`w-full px-3.5 py-3 ${radius.control} border ${surface.divider} ${text.body} ${ink.strong} placeholder:text-slate-400 outline-none focus:border-blue-500 resize-none`}
          />
          <span className={`${text.caption} ${ink.faint} px-1 self-end`}>{keterangan.length}/300</span>
        </label>

        {error && (
          <div className={`${radius.control} ${tone.danger.bgSoft} px-3.5 py-3 flex items-start gap-2.5`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-px ${tone.danger.text}`} />
            <p className={`${text.footnote} ${tone.danger.text}`}>{error}</p>
          </div>
        )}
      </div>

      <div
        className={`shrink-0 border-t ${surface.divider} px-4 py-3`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button
          type="button"
          disabled={!siap}
          onClick={kirim}
          className={`w-full min-h-[52px] ${radius.control} flex items-center justify-center gap-2 ${text.headline} text-white bg-primary disabled:bg-slate-300 transition-transform active:scale-[0.98] disabled:active:scale-100`}
        >
          {mengirim ? 'Mengirim…' : <><Check className="w-5 h-5" /> Simpan aktivitas</>}
        </button>
        {!siap && !mengirim && (
          <p className={`${text.caption} ${ink.faint} text-center mt-2`}>
            {!file ? 'Ambil foto terlebih dahulu' : 'Menunggu lokasi terdeteksi'}
          </p>
        )}
      </div>
    </div>
  );
};

export default MobileActivities;
