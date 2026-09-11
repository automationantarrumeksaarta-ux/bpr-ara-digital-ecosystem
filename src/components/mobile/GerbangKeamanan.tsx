import React from 'react';
import { MapPinOff, RefreshCw, ShieldAlert, Wrench } from 'lucide-react';
import { useKeamananPerangkat } from '../../hooks/useKeamananPerangkat';

/**
 * Gerbang keutuhan perangkat.
 *
 * Menahan aplikasi terbuka bila ponsel sedang disiapkan untuk memalsukan
 * kehadiran. Hanya berlaku di APK; di peramban gerbang ini tidak aktif sama
 * sekali karena pemeriksaannya memang tidak tersedia di sana.
 *
 * Dua sebab, dan bobotnya berbeda:
 *
 * - **Lokasi tiruan** adalah bukti. Ada aplikasi yang sedang berperan sebagai
 *   penyedia lokasi palsu, atau pembacaan terakhir ditandai tiruan oleh sistem.
 * - **Opsi Pengembang** adalah syarat, bukan bukti. Ia dibutuhkan untuk
 *   memasang lokasi palsu, tetapi banyak orang menyalakannya untuk hal lain.
 *   Diblokir karena diminta demikian, dan ini memang menutup jalan paling umum
 *   menuju absen titipan — konsekuensinya, pegawai yang menyalakannya untuk
 *   alasan lain juga ikut tertahan sampai mematikannya.
 *
 * Gagal-terbuka: bila plugin tidak ada atau melempar galat, aplikasi tetap
 * dibuka. Absensi yang menolak menyala karena pemeriksaannya sendiri
 * bermasalah jauh lebih merugikan daripada satu ponsel yang lolos.
 */

const BLOKIR_MODE_PENGEMBANG = true;

export const GerbangKeamanan: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { memeriksa, didukung, modePengembang, lokasiPalsu, periksaUlang } = useKeamananPerangkat();

  // Selagi memeriksa, jangan kedipkan layar blokir lebih dulu.
  if (memeriksa || !didukung) return <>{children}</>;

  const terhalang = lokasiPalsu || (BLOKIR_MODE_PENGEMBANG && modePengembang);
  if (!terhalang) return <>{children}</>;

  const sebab = lokasiPalsu
    ? {
        Ikon: MapPinOff,
        judul: 'Lokasi tiruan terdeteksi',
        keterangan:
          'Ada aplikasi yang sedang dipakai sebagai penyedia lokasi palsu di ponsel ini. ' +
          'Absensi tidak dapat dijalankan selama itu aktif.',
        langkah: [
          'Buka Pengaturan, lalu Opsi Pengembang.',
          'Cari "Pilih aplikasi lokasi tiruan" dan kosongkan pilihannya.',
          'Copot aplikasi lokasi palsu bila masih terpasang.',
        ],
      }
    : {
        Ikon: Wrench,
        judul: 'Opsi Pengembang aktif',
        keterangan:
          'Demi menjaga keabsahan absensi, aplikasi tidak dapat dibuka selama Opsi Pengembang menyala. ' +
          'Pengaturan itulah yang memungkinkan lokasi ponsel dipalsukan.',
        langkah: [
          'Buka Pengaturan ponsel.',
          'Masuk ke Sistem, lalu Opsi Pengembang.',
          'Matikan saklarnya di bagian paling atas.',
          'Kembali ke sini dan tekan Periksa ulang.',
        ],
      };

  const { Ikon } = sebab;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-white px-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
        <Ikon className="h-8 w-8 text-rose-500" strokeWidth={1.5} />
      </span>

      <div>
        <h1 className="text-lg font-bold text-slate-900">{sebab.judul}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{sebab.keterangan}</p>
      </div>

      <ol className="w-full space-y-2 text-left">
        {sebab.langkah.map((l, i) => (
          <li key={l} className="flex gap-2.5 text-xs leading-relaxed text-slate-600">
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
              {i + 1}
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={periksaUlang}
        className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-transform active:scale-[0.98]"
      >
        <RefreshCw className="h-4 w-4" />
        Periksa ulang
      </button>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
        <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          Hubungi bagian SDM bila Anda memerlukan Opsi Pengembang untuk keperluan kerja.
        </span>
      </p>
    </div>
  );
};
