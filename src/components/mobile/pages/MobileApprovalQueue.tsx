import React, { useMemo, useState } from 'react';
import { BadgeCheck, Check, CornerUpLeft, Send, User2, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

/**
 * Antrean persetujuan versi aplikasi.
 *
 * Versi web menampilkan tabel lebar dengan dua kolom arahan, kotak centang
 * massal, dan pratinjau berkas berdampingan. Di HP itu tidak terpakai:
 * atasan membuka aplikasi untuk memutuskan satu-satu, biasanya di sela
 * kegiatan lain.
 *
 * Di sini tiap tugas jadi satu kartu keputusan: apa yang diminta, siapa yang
 * mengerjakan, lalu dua tindakan yang jelas — setujui atau minta perbaikan.
 */

/** Status yang benar-benar menunggu keputusan atasan. */
const MENUNGGU = ['submitted', 'escalated', 'minor rework', 'major rework'];

const sudahSelesai = (s: string) =>
  ['validated closed', 'improved', 'accepted', 'selesai'].includes(s.toLowerCase());

const MobileApprovalQueue: React.FC = () => {
  const { flowTasks, updateTask, currentUser } = useApp() as any;
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const [arahan, setArahan] = useState('');
  const [memproses, setMemproses] = useState(false);

  const antrean = useMemo(
    () => (flowTasks ?? [])
      .filter((t: any) => MENUNGGU.includes((t.status ?? '').toLowerCase()))
      .sort((a: any, b: any) => (a.tanggalFU ?? a.tanggal ?? '').localeCompare(b.tanggalFU ?? b.tanggal ?? '')),
    [flowTasks],
  );

  const selesaiHariIni = useMemo(
    () => (flowTasks ?? []).filter((t: any) => sudahSelesai(t.status ?? '')).length,
    [flowTasks],
  );

  const putuskan = (tugas: any, setujui: boolean) => {
    setMemproses(true);
    updateTask({
      ...tugas,
      status: setujui ? 'Validated Closed' : 'Minor Rework',
      arahanAtasan: arahan.trim() || tugas.arahanAtasan || '',
      updatedAt: new Date().toISOString(),
    });
    setTerbuka(null);
    setArahan('');
    setMemproses(false);
  };

  return (
    <Screen>
      <AppBar title="Approval Queue" back />

      <Stack className="gap-4">
        {antrean.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={BadgeCheck}
              title="Tidak ada yang menunggu keputusan"
              description={
                selesaiHariIni > 0
                  ? `${selesaiHariIni} tugas sudah divalidasi. Tugas baru akan muncul di sini setelah staf mengirimkannya.`
                  : 'Tugas yang dikirim staf untuk divalidasi akan muncul di sini.'
              }
            />
          </Card>
        ) : (
          <>
            <p className={`${text.caption} ${ink.faint} px-1 -mb-1`}>
              {antrean.length} tugas menunggu keputusan Anda
            </p>

            {antrean.map((t: any) => {
              const dibuka = terbuka === t.id;
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

                  {t.penyelesaian && (
                    <div className={`${radius.control} bg-slate-50 px-3 py-2.5`}>
                      <span className={`block ${text.caption} ${ink.muted} uppercase tracking-wide font-semibold mb-1`}>
                        Bukti penyelesaian
                      </span>
                      <p className={`${text.footnote} ${ink.base} leading-snug break-words`}>{t.penyelesaian}</p>
                    </div>
                  )}

                  {!dibuka ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setTerbuka(t.id); setArahan(t.arahanAtasan ?? ''); }}
                        className={`flex-1 min-h-[44px] ${radius.control} border ${surface.divider} ${text.body} font-semibold ${ink.base} flex items-center justify-center gap-1.5 active:bg-slate-50`}
                      >
                        <CornerUpLeft className="w-4 h-4" />
                        Beri arahan
                      </button>
                      <button
                        type="button"
                        disabled={memproses}
                        onClick={() => putuskan(t, true)}
                        className={`flex-1 min-h-[44px] ${radius.control} bg-success text-white ${text.body} font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform`}
                      >
                        <Check className="w-4 h-4" />
                        Setujui
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <textarea
                        value={arahan}
                        onChange={e => setArahan(e.target.value)}
                        rows={3}
                        autoFocus
                        placeholder="Tuliskan apa yang perlu diperbaiki…"
                        className={`w-full px-3.5 py-3 ${radius.control} border ${surface.divider} ${text.body} ${ink.strong} placeholder:text-slate-400 outline-none focus:border-blue-500 resize-none`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setTerbuka(null); setArahan(''); }}
                          className={`min-h-[44px] px-4 ${radius.control} border ${surface.divider} ${text.body} font-semibold ${ink.muted} flex items-center gap-1.5`}
                        >
                          <X className="w-4 h-4" />
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={!arahan.trim() || memproses}
                          onClick={() => putuskan(t, false)}
                          className={`flex-1 min-h-[44px] ${radius.control} bg-warning text-white ${text.body} font-semibold flex items-center justify-center gap-1.5 disabled:bg-slate-300 active:scale-[0.98] transition-transform`}
                        >
                          <Send className="w-4 h-4" />
                          Kirim perbaikan
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileApprovalQueue;
