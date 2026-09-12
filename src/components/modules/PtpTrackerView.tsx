import React, { useState } from 'react';
import DashboardJanjiBayar from './legacy-dashboards/DashboardJanjiBayar';
import { useApp } from '../../context/AppContext';
import { useJanjiBayar, type JanjiBayar } from '../../hooks/useCollection';

/**
 * PTP Tracker — janji bayar debitur.
 *
 * Halaman ini sebelumnya memberi `INITIAL_JANJI_BAYAR_DATA`, sebuah array
 * kosong, dan memasang `onAddJanji={() => {}}` serta `onUpdateJanji={() => {}}`.
 * Petugas dapat mengisi formulir, menekan simpan, melihat barisnya muncul
 * sesaat, lalu hilang tanpa satu pun pesan galat. Penggunanya juga ditulis
 * tetap sebagai `Admin` / `Master Admin`, jadi siapa pun yang membuka halaman
 * ini tercatat sebagai admin.
 *
 * Sekarang janji bayar benar-benar tersimpan di tabel `janji_bayar`, dan
 * kegagalan menyimpan ditampilkan apa adanya.
 */
export const PtpTrackerView: React.FC = () => {
  const { currentUser } = useApp();
  const { memuat, galat, data, ringkas, tambah, perbarui } = useJanjiBayar();
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);

  const simpanBaru = (item: JanjiBayar) => {
    setGalatSimpan(null);
    tambah({
      accountNumber: item.accountNumber,
      debtorName: item.debtorName,
      aoName: item.aoName,
      branch: item.branch,
      promiseDate: item.promiseDate,
      promisedAmount: item.promisedAmount,
      notes: item.notes,
      contactWa: item.contactWa,
    }).catch((e: any) => setGalatSimpan(e?.message ?? 'Gagal menyimpan janji bayar.'));
  };

  const perbaruiItem = (item: JanjiBayar) => {
    setGalatSimpan(null);
    perbarui(item.id, { status: item.status, notes: item.notes })
      .catch((e: any) => setGalatSimpan(e?.message ?? 'Gagal memperbarui janji bayar.'));
  };

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          COLLECTION &amp; RECOVERY / PTP TRACKER
        </span>
        {ringkas && (
          <span className="text-[11px] text-slate-500 tabular-nums">
            {ringkas.menunggu} menunggu · {ringkas.terealisasi} terealisasi · {ringkas.ingkar} ingkar janji
          </span>
        )}
      </div>

      {galat && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-relaxed text-red-700">
          {galat}
        </div>
      )}
      {galatSimpan && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-relaxed text-red-700">
          {galatSimpan}
        </div>
      )}
      {memuat && (
        <div className="mb-4 text-xs font-bold text-slate-400">Memuat janji bayar…</div>
      )}

      <DashboardJanjiBayar
        janjiList={data as any}
        onUpdateJanji={perbaruiItem as any}
        onAddJanji={simpanBaru as any}
        currentUser={currentUser as any}
      />
    </div>
  );
};
