import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck, Check, CornerUpLeft, FileText, ImageIcon, Send, ShieldAlert, User2, X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { getAllUsersList } from '../../../utils/beisUtils';
import { isTugasAntreanSaya } from '../../../utils/approvalQueue';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

/**
 * Antrean persetujuan versi aplikasi.
 *
 * Versi web menampilkan tabel lebar dengan dua kolom arahan, kotak centang
 * massal, dan pratinjau berkas berdampingan. Di HP itu tidak terpakai:
 * atasan membuka aplikasi untuk memutuskan satu-satu, di sela kegiatan lain.
 *
 * Aturan siapa yang berhak memutuskan dipakai bersama dengan web lewat
 * utils/approvalQueue.ts — bukan disalin ulang di sini.
 */

/** Status yang benar-benar menunggu keputusan atasan. */
const MENUNGGU = ['submitted', 'escalated', 'minor rework', 'major rework'];

/** Jeda pembatalan sebelum keputusan benar-benar dikirim. */
const JEDA_BATAL_MS = 5000;

interface Tertunda {
  tugas: any;
  setujui: boolean;
  arahan: string;
}

const MobileApprovalQueue: React.FC = () => {
  const { flowTasks, updateTask, currentUser } = useApp() as any;

  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [arahan, setArahan] = useState('');
  const [tertunda, setTertunda] = useState<Tertunda | null>(null);
  const [diputuskan, setDiputuskan] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allUsers = useMemo(() => getAllUsersList(), []);

  /** Tugas yang menjadi wewenang pengguna ini — aturan sama persis dengan web. */
  const antreanSaya = useMemo(
    () => (flowTasks ?? []).filter((t: any) => isTugasAntreanSaya(t, currentUser, allUsers as any)),
    [flowTasks, currentUser, allUsers],
  );

  const menunggu = useMemo(
    () => antreanSaya
      .filter((t: any) => MENUNGGU.includes((t.status ?? '').toLowerCase()))
      .filter((t: any) => !diputuskan.includes(t.id))
      .sort((a: any, b: any) => (a.tanggalFU ?? a.tanggal ?? '').localeCompare(b.tanggalFU ?? b.tanggal ?? '')),
    [antreanSaya, diputuskan],
  );

  /* Jumlah awal dipakai untuk penghitung kemajuan; tanpa ini pengguna tidak
     tahu sudah sampai mana di antara tumpukan kartu yang sama besar. */
  const [totalAwal, setTotalAwal] = useState<number | null>(null);
  useEffect(() => {
    if (totalAwal === null && antreanSaya.length > 0) {
      setTotalAwal(antreanSaya.filter((t: any) => MENUNGGU.includes((t.status ?? '').toLowerCase())).length);
    }
  }, [antreanSaya, totalAwal]);

  /** Kirim keputusan yang sudah lewat masa pembatalan. */
  const kirim = useCallback((p: Tertunda) => {
    updateTask({
      ...p.tugas,
      status: p.setujui ? 'Validated Closed' : 'Minor Rework',
      arahanAtasan: p.arahan.trim() || p.tugas.arahanAtasan || '',
      updatedAt: new Date().toISOString(),
    });
  }, [updateTask]);

  /*
   * Keputusan tidak langsung ditulis. Kartu hilang dari daftar seketika
   * (terasa cepat), tetapi penulisan ditunda beberapa detik supaya salah
   * tekan masih bisa dibatalkan. Ini menggantikan dialog konfirmasi, yang
   * memperlambat setiap keputusan benar demi melindungi yang jarang salah.
   */
  const putuskan = (tugas: any, setujui: boolean, teksArahan = '') => {
    if (tertunda && timerRef.current) {
      clearTimeout(timerRef.current);
      kirim(tertunda);
    }

    const baru: Tertunda = { tugas, setujui, arahan: teksArahan };
    setTertunda(baru);
    setDiputuskan(d => [...d, tugas.id]);
    setTerbuka(null);
    setArahan('');

    timerRef.current = setTimeout(() => {
      kirim(baru);
      setTertunda(null);
      timerRef.current = null;
    }, JEDA_BATAL_MS);
  };

  const batalkan = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setDiputuskan(d => d.filter(id => id !== tertunda?.tugas.id));
    setTertunda(null);
  };

  // Keputusan yang masih tertunda harus tetap terkirim bila layar ditinggalkan.
  useEffect(() => () => {
    if (timerRef.current && tertunda) {
      clearTimeout(timerRef.current);
      kirim(tertunda);
    }
  }, [tertunda, kirim]);

  const selesai = totalAwal !== null ? totalAwal - menunggu.length : 0;

  return (
    <Screen>
      <AppBar
        title="Approval Queue"
        back
        action={
          totalAwal && totalAwal > 0 ? (
            <span className={`h-11 pr-3 flex items-center ${text.footnote} font-semibold ${ink.muted} tabular-nums`}>
              {selesai}/{totalAwal}
            </span>
          ) : undefined
        }
      />

      <Stack className="gap-4 pb-24">
        {menunggu.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={antreanSaya.length === 0 ? ShieldAlert : BadgeCheck}
              title={
                antreanSaya.length === 0
                  ? 'Anda belum ditunjuk sebagai validator'
                  : 'Tidak ada yang menunggu keputusan'
              }
              description={
                antreanSaya.length === 0
                  ? 'Antrean ini hanya menampilkan tugas yang Anda tunjuk sebagai validator, atau yang dieskalasikan kepada Anda.'
                  : selesai > 0
                    ? `${selesai} tugas sudah Anda putuskan. Tugas baru akan muncul setelah staf mengirimkannya.`
                    : 'Tugas yang dikirim staf untuk divalidasi akan muncul di sini.'
              }
            />
          </Card>
        ) : (
          <>
            <p className={`${text.caption} ${ink.faint} px-1 -mb-1`}>
              {menunggu.length} tugas menunggu keputusan Anda
            </p>

            {menunggu.map((t: any) => {
              const dibuka = terbuka === t.id;
              const lampiran: any[] = t.evidenceFiles ?? [];
              return (
                <Card key={t.id} className="flex flex-col gap-3">
                  <p className={`${text.body} font-medium ${ink.strong} leading-snug`}>
                    {t.deskripsiTugas || '(tanpa deskripsi)'}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`${text.caption} font-semibold px-1.5 py-0.5 ${radius.control} ${tone.warning.bgSoft} ${tone.warning.text}`}>
                      {t.status}
                    </span>
                    {t.assignedTo && (
                      <span className={`${text.caption} ${ink.muted} flex items-center gap-1 min-w-0`}>
                        <User2 className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{t.assignedTo}</span>
                      </span>
                    )}
                    {t.prioritas && (
                      <span className={`${text.caption} font-semibold ${ink.muted}`}>{t.prioritas}</span>
                    )}
                  </div>

                  {(t.penyelesaian || lampiran.length > 0) && (
                    <div className={`${radius.control} bg-slate-50 px-3 py-2.5 flex flex-col gap-2`}>
                      <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                        Bukti penyelesaian
                      </span>
                      {t.penyelesaian && (
                        <p className={`${text.footnote} ${ink.base} leading-snug break-words`}>{t.penyelesaian}</p>
                      )}
                      {/*
                        Lampiran dapat dibuka, bukan sekadar tercetak sebagai
                        URL. Memutuskan tanpa bisa melihat buktinya adalah
                        meminta persetujuan buta.
                      */}
                      {lampiran.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {lampiran.map((f: any, i: number) => (
                            <a
                              key={f.id ?? i}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`min-h-[36px] flex items-center gap-2 ${text.footnote} font-medium ${tone.primary.text}`}
                            >
                              {String(f.type ?? '').startsWith('image/')
                                ? <ImageIcon className="w-4 h-4 shrink-0" />
                                : <FileText className="w-4 h-4 shrink-0" />}
                              <span className="truncate">{f.name ?? 'Lampiran'}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {dibuka && (
                    <textarea
                      value={arahan}
                      onChange={e => setArahan(e.target.value)}
                      rows={3}
                      autoFocus
                      placeholder="Tuliskan apa yang perlu diperbaiki…"
                      className={`w-full px-3.5 py-3 ${radius.control} border ${surface.divider} ${text.body} ${ink.strong} placeholder:text-slate-400 outline-none focus:border-blue-500 resize-none`}
                    />
                  )}

                  {/*
                    Kedua tindakan tetap terlihat saat kotak arahan terbuka.
                    Sebelumnya tombol setujui menghilang, sehingga atasan yang
                    berubah pikiran harus membatalkan dulu.
                  */}
                  <div className="flex gap-2">
                    {dibuka ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { setTerbuka(null); setArahan(''); }}
                          aria-label="Tutup kotak arahan"
                          className={`w-11 min-h-[44px] ${radius.control} border ${surface.divider} ${ink.muted} flex items-center justify-center shrink-0`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!arahan.trim()}
                          onClick={() => putuskan(t, false, arahan)}
                          className={`flex-1 min-h-[44px] ${radius.control} bg-warning text-white ${text.body} font-semibold flex items-center justify-center gap-1.5 disabled:bg-slate-300 active:scale-[0.98] transition-transform`}
                        >
                          <Send className="w-4 h-4" />
                          Kirim perbaikan
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setTerbuka(t.id); setArahan(t.arahanAtasan ?? ''); }}
                        className={`flex-1 min-h-[44px] ${radius.control} border ${surface.divider} ${text.body} font-semibold ${ink.base} flex items-center justify-center gap-1.5 active:bg-slate-50`}
                      >
                        <CornerUpLeft className="w-4 h-4" />
                        Beri arahan
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => putuskan(t, true, dibuka ? arahan : '')}
                      className={`flex-1 min-h-[44px] ${radius.control} bg-success text-white ${text.body} font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform`}
                    >
                      <Check className="w-4 h-4" />
                      Setujui
                    </button>
                  </div>
                </Card>
              );
            })}
          </>
        )}

        <div className="h-2" />
      </Stack>

      {/* Pembatalan menggantikan konfirmasi: melindungi dari salah tekan
          tanpa memperlambat setiap keputusan yang benar. */}
      {tertunda && (
        <div
          role="status"
          className="fixed left-4 right-4 bottom-8 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-lg"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <span className={`flex-1 min-w-0 ${text.footnote} truncate`}>
            {tertunda.setujui ? 'Disetujui' : 'Dikirim untuk perbaikan'}
          </span>
          <button
            type="button"
            onClick={batalkan}
            className={`${text.footnote} font-bold text-blue-300 shrink-0 min-h-[36px] px-2`}
          >
            Batalkan
          </button>
        </div>
      )}
    </Screen>
  );
};

export default MobileApprovalQueue;
