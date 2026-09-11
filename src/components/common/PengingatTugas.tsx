import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { tugasTertunggak, hariTerlambat } from '../../utils/tugas';

/**
 * Pengingat tugas yang sudah lewat hari tetapi statusnya belum bergerak.
 *
 * Ditampilkan di atas papan tugas. Sengaja bukan pemberitahuan sekali lewat:
 * tugas yang tertunggak tetap tertunggak sampai statusnya diubah, jadi
 * pengingatnya pun harus ikut bertahan selama keadaannya belum berubah.
 *
 * Tidak muncul sama sekali bila tidak ada yang tertunggak. Spanduk yang selalu
 * hadir akan berhenti dibaca dalam hitungan hari.
 */

interface Props {
  tugas: any[];
  /** Dipanggil saat pengguna ingin melihat daftarnya. */
  onLihat?: () => void;
  className?: string;
}

export const PengingatTugas: React.FC<Props> = ({ tugas, onLihat, className = '' }) => {
  const tertunggak = tugasTertunggak(tugas ?? []);
  if (tertunggak.length === 0) return null;

  const terlama = tertunggak[0] as any;
  const hari = hariTerlambat(terlama);

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 ${className}`}
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-warning">
          {tertunggak.length.toLocaleString('id-ID')} tugas lewat tenggat dan statusnya belum berubah
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
          Terlama {hari.toLocaleString('id-ID')} hari:{' '}
          <span className="font-semibold">{terlama.deskripsiTugas ?? terlama.pic ?? 'tanpa judul'}</span>.
          Perbarui statusnya menjadi selesai atau ajukan validasi.
        </p>
      </div>
      {onLihat && (
        <button
          type="button"
          onClick={onLihat}
          className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-warning hover:underline"
        >
          Lihat
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
