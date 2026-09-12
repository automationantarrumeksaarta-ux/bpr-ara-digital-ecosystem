import React, { useState } from 'react';
import DashboardKreditBermasalah from './legacy-dashboards/DashboardKreditBermasalah';
import { useApp } from '../../context/AppContext';
import { useKreditBermasalah, type KreditBermasalah } from '../../hooks/useCollection';

const rupiahRingkas = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1).replace('.', ',')} M`
    : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(0)} jt`
      : `Rp ${Math.round(n).toLocaleString('id-ID')}`;

/**
 * NPL & Restructuring.
 *
 * Halaman ini sebelumnya memberi `INITIAL_NPL_DATA`, sebuah array kosong,
 * padahal tabel `loans` sudah memuat seluruh rekening bermasalah hasil unggahan
 * nominatif. Tombol simpannya pun dipasangi penangan kosong, dan penggunanya
 * ditulis tetap sebagai `Admin` / `Master Admin`.
 *
 * Daftarnya kini dihitung server dari `loans`, sedangkan catatan tindak lanjut
 * petugas disimpan terpisah di `collection_tindakan` supaya tidak ikut terhapus
 * saat nominatif berikutnya diunggah.
 */
export const NplRestructuringView: React.FC = () => {
  const { currentUser } = useApp();
  const { memuat, galat, data, ringkas, simpanTindakan } = useKreditBermasalah();
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);

  const perbaruiItem = (item: KreditBermasalah) => {
    setGalatSimpan(null);
    simpanTindakan(item.id, item.actionStatus, item.actionNotes)
      .catch((e: any) => setGalatSimpan(e?.message ?? 'Gagal menyimpan tindak lanjut.'));
  };

  /*
   * Menambah rekening bermasalah secara manual tidak dilayani: daftar ini
   * cerminan tabel `loans`, dan baris yang ditambah tangan akan hilang pada
   * unggahan nominatif berikutnya sekaligus membuat totalnya berbeda dengan
   * laporan resmi.
   */
  const tolakTambah = () => {
    setGalatSimpan(
      'Rekening bermasalah tidak ditambahkan manual. Daftar ini mengikuti berkas Nominatif '
      + 'Kredit; unggah nominatif terbaru lewat Data Center bila ada rekening yang belum muncul.',
    );
  };

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          COLLECTION &amp; RECOVERY / NPL &amp; RESTRUCTURING
        </span>
        {ringkas && (
          <span className="text-[11px] text-slate-500 tabular-nums">
            {ringkas.jumlahRekening} rekening · {rupiahRingkas(ringkas.totalBakiDebet)} baki debet ·{' '}
            {ringkas.sudahDitangani} sudah ditindaklanjuti
          </span>
        )}
      </div>

      {galat && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-relaxed text-red-700">
          {galat}
        </div>
      )}
      {galatSimpan && (
        <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-relaxed text-amber-800">
          {galatSimpan}
        </div>
      )}
      {memuat && (
        <div className="mb-4 text-xs font-bold text-slate-400">Memuat data kredit bermasalah…</div>
      )}

      <DashboardKreditBermasalah
        nplList={data as any}
        onUpdateItem={perbaruiItem as any}
        onAddItem={tolakTambah as any}
        currentUser={currentUser as any}
      />
    </div>
  );
};
