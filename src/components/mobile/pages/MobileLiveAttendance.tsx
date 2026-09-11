import React, { useRef, useState } from 'react';
import {
  AlertCircle, Building2, Camera, Check, ChevronLeft, ChevronRight,
  Clock, LogIn, LogOut, RefreshCw, RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useMobileAttendance, formatJam } from '../../../hooks/useMobileAttendance';
import { useKantorAbsen } from '../../../hooks/useKantorAbsen';
import { MiniMap } from '../ui/MiniMap';
import { LembarPenuh, PesanKecil, TombolUtama } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';
import { kecilkanGambar } from '../../../utils/gambar';

type Aksi = 'masuk' | 'pulang';

/**
 * Layar absen.
 *
 * Petanya dibuat memenuhi bagian atas layar, bukan kotak kecil di dalam kartu,
 * karena hal pertama yang ingin dipastikan pegawai adalah "apakah saya sudah di
 * tempat yang benar". Tombol segarkan disediakan di atas peta karena pembacaan
 * GPS pertama sering masih kasar dan membaik setelah beberapa detik.
 *
 * Swafoto wajib. Titik lokasi hanya membuktikan ponselnya berada di kantor;
 * fotonya yang membuktikan orangnya sendiri yang hadir. Tanpa itu absen bisa
 * dititipkan ke rekan yang kebetulan sedang berada di kantor.
 */

const MobileLiveAttendance: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { posisi, alamat, memuat: memuatLokasi, error: errorLokasi, minta } = useGeolocation();
  const { hariIni, muatUlang } = useMobileAttendance();
  const {
    radiusMeter, akurasiMaksMeter, jamMasuk, jamPulang,
    petaUbinUrl, petaAtribusi, terdekat,
  } = useKantorAbsen(posisi);

  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'ok' | 'gagal'; teks: string } | null>(null);
  const [aksiSwafoto, setAksiSwafoto] = useState<Aksi | null>(null);

  const sudahMasuk = !!hariIni?.clock_in_time;
  const sudahPulang = !!hariIni?.clock_out_time;

  const sinyalKasar = !!posisi && posisi.akurasi > akurasiMaksMeter;
  const diLuarRadius = !!terdekat && !terdekat.diDalamRadius;
  const bolehAbsen = !!posisi && !sinyalKasar && !diLuarRadius;

  const kirim = async (aksi: Aksi, selfie: string) => {
    if (!currentUser?.id || !posisi) return;
    setMengirim(true);
    setPesan(null);
    try {
      const res = await fetch(`/api/attendances/clock-${aksi === 'masuk' ? 'in' : 'out'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          lat: posisi.lat,
          lng: posisi.lng,
          akurasi: posisi.akurasi,
          selfie,
          location: alamat ?? `${posisi.lat.toFixed(5)}, ${posisi.lng.toFixed(5)}`,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setPesan({ tipe: 'ok', teks: data.message ?? `Absen ${aksi} berhasil dicatat.` });
        setAksiSwafoto(null);
        muatUlang();
      } else {
        setPesan({ tipe: 'gagal', teks: data?.error ?? 'Gagal mencatat absen.' });
      }
    } catch {
      setPesan({ tipe: 'gagal', teks: 'Tidak dapat terhubung ke server.' });
    }
    setMengirim(false);
  };

  const segarkan = () => { minta(); muatUlang(); };

  const now = new Date();
  const aksiBerikut: Aksi = sudahMasuk ? 'pulang' : 'masuk';

  const alasanTerkunci = !posisi
    ? 'Menunggu lokasi terbaca.'
    : sinyalKasar
      ? `Sinyal GPS masih meleset sampai ${Math.round(posisi.akurasi)} meter. Tekan segarkan atau berdiri di tempat terbuka.`
      : diLuarRadius
        ? `Anda ${Math.round(terdekat!.jarak).toLocaleString('id-ID')} meter dari ${terdekat!.kantor.nama}. Absen hanya dalam radius ${radiusMeter} meter.`
        : null;

  return (
    /*
      Mengisi tinggi area konten kerangka, bukan `fixed inset-0`.
      Layar ini salah satu tab utama sehingga navigasi bawah tetap tampil;
      dengan posisi tetap, panel bawah menimpa navigasi itu.
    */
    <div className="h-full flex flex-col bg-slate-100">
      {/* ------------------------------------------------ peta memenuhi atas */}
      <div className="relative flex-1 min-h-[42vh]">
        {posisi ? (
          <MiniMap
            lat={posisi.lat}
            lng={posisi.lng}
            kantor={terdekat?.kantor}
            radiusMeter={radiusMeter}
            ubinUrl={petaUbinUrl ?? undefined}
            atribusi={petaAtribusi ?? undefined}
            /*
              height={0} menyerahkan tinggi ke kelas, bukan ke style; nilai
              bawaan 176px akan memaksa peta jadi pita tipis di puncak layar.
              Dipakai h-full, bukan `absolute inset-0`: akar MiniMap sudah
              membawa kelas `relative`, dan di Tailwind `relative` mengalahkan
              `absolute` yang datang belakangan, sehingga inset-0 tidak
              memberi tinggi sama sekali.
            */
            height={0}
            className="h-full w-full !rounded-none"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-200">
            <RefreshCw className={`w-5 h-5 ${ink.faint} ${memuatLokasi ? 'animate-spin' : ''}`} />
            <span className={`${text.footnote} ${ink.muted} px-8 text-center`}>
              {errorLokasi ?? 'Mencari lokasi Anda…'}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute left-4 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
          style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>

        {/* Pembacaan GPS pertama kerap kasar; ini jalan keluarnya. */}
        <button
          type="button"
          onClick={segarkan}
          aria-label="Segarkan lokasi"
          className="absolute right-4 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
          style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <RefreshCw className={`w-5 h-5 text-slate-700 ${memuatLokasi ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ------------------------------------------------ panel bawah */}
      <div
        className="shrink-0 px-4 pt-3 pb-3 flex flex-col gap-3 overflow-y-auto bg-slate-100"
        
      >
        {pesan && <PesanKecil teks={pesan.teks} jenis={pesan.tipe} />}

        {/* Lokasi & kantor terdekat */}
        <div className={`${surface.card} ${radius.card} shadow-sm px-4 py-3.5 flex items-start gap-3`}>
          <Building2
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              terdekat ? (terdekat.diDalamRadius ? tone.positive.text : tone.danger.text) : ink.faint
            }`}
          />
          <div className="flex-1 min-w-0">
            <span className={`block ${text.caption} ${ink.muted}`}>Lokasi</span>
            <span className={`block ${text.headline} ${ink.strong} uppercase truncate`}>
              {terdekat?.kantor.nama ?? 'Di luar jangkauan kantor'}
            </span>
            {terdekat && (
              <span
                className={`block ${text.caption} mt-0.5 tabular-nums ${
                  terdekat.diDalamRadius ? tone.positive.text : tone.danger.text
                }`}
              >
                {Math.round(terdekat.jarak).toLocaleString('id-ID')} m dari titik kantor
                {posisi && ` · akurasi ±${Math.round(posisi.akurasi)} m`}
              </span>
            )}
            {/*
              Koordinat mentah ditampilkan supaya bila absen tertolak padahal
              pegawai memang di kantor, angkanya bisa langsung dibandingkan
              dengan titik kantor yang tercatat — penyebab tersering justru
              titik kantornya yang meleset, bukan ponselnya.
            */}
            {posisi && (
              <span className={`block ${text.caption} ${ink.faint} mt-0.5 tabular-nums`}>
                {posisi.lat.toFixed(6)}, {posisi.lng.toFixed(6)}
              </span>
            )}
          </div>
        </div>

        {/* Jam kerja hari ini */}
        <div className={`${surface.card} ${radius.card} shadow-sm overflow-hidden divide-y ${surface.hairline}`}>
          <div className="px-4 py-3 flex items-center gap-3">
            <Clock className={`w-5 h-5 shrink-0 ${ink.faint}`} />
            <div className="flex-1 min-w-0">
              <span className={`block ${text.caption} ${ink.muted}`}>Reguler</span>
              <span className={`block ${text.headline} ${ink.strong} tabular-nums`}>
                {jamMasuk} – {jamPulang}
              </span>
            </div>
            <span className={`${text.caption} ${ink.faint} text-right shrink-0`}>
              {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <BarisJam ikon={LogIn} label="Masuk" jam={formatJam(hariIni?.clock_in_time)} terisi={sudahMasuk} />
          <BarisJam ikon={LogOut} label="Pulang" jam={formatJam(hariIni?.clock_out_time)} terisi={sudahPulang} />
        </div>

        {/* Tombol aksi */}
        {sudahPulang ? (
          <div className={`${surface.card} ${radius.card} shadow-sm px-4 py-3.5 flex items-center gap-2.5`}>
            <Check className={`w-5 h-5 shrink-0 ${tone.positive.text}`} />
            <p className={`${text.body} ${ink.base}`}>Absen hari ini sudah lengkap. Terima kasih.</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={!bolehAbsen || mengirim}
              onClick={() => { setPesan(null); setAksiSwafoto(aksiBerikut); }}
              className={`min-h-[54px] ${radius.control} flex items-center justify-between px-5 ${text.headline} text-white transition-transform active:scale-[0.98] disabled:active:scale-100 disabled:bg-slate-300 ${
                sudahMasuk ? 'bg-primary' : 'bg-success'
              }`}
            >
              <span className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Absen {aksiBerikut}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>

            <p className={`${text.caption} ${ink.faint} text-center px-4 leading-relaxed`}>
              {alasanTerkunci ?? 'Anda akan diminta berswafoto sebelum absen dikirim.'}
            </p>
          </>
        )}
      </div>

      {aksiSwafoto && (
        <LembarSwafoto
          aksi={aksiSwafoto}
          memproses={mengirim}
          onTutup={() => setAksiSwafoto(null)}
          onKirim={(foto) => kirim(aksiSwafoto, foto)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------- baris jam */

const BarisJam: React.FC<{
  ikon: React.ElementType; label: string; jam: string; terisi: boolean;
}> = ({ ikon: Ikon, label, jam, terisi }) => (
  <div className="px-4 py-3 flex items-center gap-3">
    <Ikon className={`w-5 h-5 shrink-0 ${terisi ? tone.positive.text : ink.faint}`} />
    <span className={`flex-1 ${text.body} ${ink.muted}`}>{label}</span>
    <span className={`${text.headline} tabular-nums ${terisi ? ink.strong : ink.faint}`}>{jam}</span>
  </div>
);

/* ------------------------------------------------------------- swafoto */

/**
 * Langkah swafoto sebelum absen dikirim.
 *
 * Memakai kamera depan lewat `capture="user"` pada input berkas, sehingga tidak
 * memerlukan plugin kamera tambahan. Foto dikecilkan di perangkat lalu dikirim
 * sebagai data URL bersama data absen — satu permintaan, dan tidak tersandung
 * kerusakan unggah biner di dalam APK.
 */
const LembarSwafoto: React.FC<{
  aksi: Aksi;
  memproses: boolean;
  onTutup: () => void;
  onKirim: (foto: string) => void;
}> = ({ aksi, memproses, onTutup, onKirim }) => {
  const [foto, setFoto] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [mengolah, setMengolah] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ambil = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const berkas = e.target.files?.[0];
    if (!berkas) return;
    setGalat(null);
    setMengolah(true);
    try {
      setFoto(await kecilkanGambar(berkas, { maksPiksel: 640, mutu: 0.72, potongPersegi: true }));
    } catch (err: any) {
      setGalat(err?.message ?? 'Gagal memproses foto.');
    } finally {
      setMengolah(false);
      e.target.value = '';
    }
  };

  return (
    <LembarPenuh
      judul={`Swafoto absen ${aksi}`}
      onTutup={onTutup}
      aksi={
        foto ? (
          <TombolUtama memproses={memproses} onClick={() => onKirim(foto)} label={`Kirim absen ${aksi}`} />
        ) : (
          <TombolUtama memproses={mengolah} onClick={() => inputRef.current?.click()} label="Buka kamera" />
        )
      }
    >
      <input ref={inputRef} type="file" accept="image/*" capture="user" onChange={ambil} className="hidden" />

      {galat && <PesanKecil teks={galat} jenis="gagal" />}

      {foto ? (
        <>
          <img src={foto} alt="Swafoto absen" className={`w-full ${radius.card}`} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`min-h-[48px] ${radius.control} border ${surface.divider} ${text.body} font-semibold ${ink.base} flex items-center justify-center gap-2 active:bg-slate-50`}
          >
            <RotateCcw className="w-4 h-4" />
            Ambil ulang
          </button>
        </>
      ) : (
        <div className={`${radius.card} bg-slate-100 aspect-square flex flex-col items-center justify-center gap-3`}>
          <Camera className={`w-10 h-10 ${ink.faint}`} strokeWidth={1.5} />
          <p className={`${text.footnote} ${ink.muted} text-center px-8 leading-relaxed`}>
            Ambil foto wajah Anda di tempat absen. Foto ini tersimpan bersama catatan kehadiran.
          </p>
        </div>
      )}

      <div className={`${radius.control} px-3.5 py-3 flex items-start gap-2.5 ${tone.neutral.bgSoft}`}>
        <AlertCircle className={`w-4 h-4 shrink-0 mt-px ${ink.muted}`} />
        <p className={`${text.caption} ${ink.muted} leading-relaxed`}>
          Swafoto wajib agar kehadiran tercatat atas nama orangnya sendiri, bukan sekadar ponselnya.
        </p>
      </div>
    </LembarPenuh>
  );
};

export default MobileLiveAttendance;
