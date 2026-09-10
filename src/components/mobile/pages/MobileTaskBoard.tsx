import React, { useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Search, User2, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone, HIT_TARGET, type ToneName } from '../ui/tokens';

/**
 * Daftar tugas versi aplikasi.
 *
 * Bukan TaskTableView yang dipersempit. Versi web adalah tabel 11 kolom yang
 * di layar HP hanya bisa dibaca dengan menggeser ke samping, dan tiap barisnya
 * setinggi 32px — jauh di bawah target sentuh yang layak.
 *
 * Di sini tiap tugas jadi satu baris daftar yang bisa disentuh, dengan
 * informasi yang benar-benar dipakai saat mengecek pekerjaan: apa tugasnya,
 * siapa penanggung jawabnya, kapan tenggatnya, dan seberapa mendesak.
 */

/** Status dikelompokkan menjadi tiga tahap yang dimengerti pengguna lapangan. */
type Tahap = 'aktif' | 'menunggu' | 'selesai';

const TAHAP: Record<Tahap, { label: string; cocok: (s: string) => boolean }> = {
  aktif: {
    label: 'Dikerjakan',
    cocok: s => ['planned', 'in progress', 'at risk', 'belum dimulai', 'proses'].includes(s),
  },
  menunggu: {
    label: 'Menunggu',
    cocok: s => ['submitted', 'blocked', 'escalated', 'minor rework', 'major rework', 'tertunda'].includes(s),
  },
  selesai: {
    label: 'Selesai',
    cocok: s => ['validated closed', 'improved', 'accepted', 'selesai'].includes(s),
  },
};

const warnaStatus = (status: string): ToneName => {
  const s = status.toLowerCase();
  if (TAHAP.selesai.cocok(s)) return 'positive';
  if (['blocked', 'escalated', 'at risk', 'major rework'].includes(s)) return 'danger';
  if (TAHAP.menunggu.cocok(s)) return 'warning';
  return 'primary';
};

/** P1/P2 mendesak, P3-P5 menengah, sisanya biasa. */
const warnaPrioritas = (p: string): ToneName => {
  const v = (p ?? '').toUpperCase();
  if (v === 'P1' || v === 'P2') return 'danger';
  if (['P3', 'P4', 'P5'].includes(v)) return 'warning';
  return 'neutral';
};

/** "Hari ini", "Terlambat 3 hari", "5 hari lagi". */
const tenggat = (tanggal?: string): { teks: string; mendesak: boolean } | null => {
  if (!tanggal) return null;
  const t = new Date(`${tanggal}T00:00:00`);
  if (Number.isNaN(t.getTime())) return null;
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const selisih = Math.round((t.getTime() - hariIni.getTime()) / 86_400_000);
  if (selisih === 0) return { teks: 'Hari ini', mendesak: true };
  if (selisih < 0) return { teks: `Terlambat ${Math.abs(selisih)} hari`, mendesak: true };
  if (selisih === 1) return { teks: 'Besok', mendesak: true };
  return { teks: `${selisih} hari lagi`, mendesak: false };
};

const MobileTaskBoard: React.FC = () => {
  const { flowTasks, currentUser } = useApp();
  const [tahap, setTahap] = useState<Tahap>('aktif');
  const [cari, setCari] = useState('');
  const [hanyaSaya, setHanyaSaya] = useState(false);

  const namaSaya = (currentUser?.name ?? '').trim().toLowerCase();
  const tabSaya = ((currentUser as any)?.assignedMemberTab ?? '').trim().toLowerCase();

  const milikSaya = (t: any) => {
    const pic = (t.assignedTo ?? t.pic ?? '').trim().toLowerCase();
    return !!pic && (pic === namaSaya || pic === tabSaya);
  };

  const jumlahPerTahap = useMemo(() => {
    const n: Record<Tahap, number> = { aktif: 0, menunggu: 0, selesai: 0 };
    for (const t of flowTasks ?? []) {
      if (hanyaSaya && !milikSaya(t)) continue;
      const s = (t.status ?? '').toLowerCase();
      (Object.keys(TAHAP) as Tahap[]).forEach(k => { if (TAHAP[k].cocok(s)) n[k]++; });
    }
    return n;
  }, [flowTasks, hanyaSaya, namaSaya, tabSaya]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return (flowTasks ?? [])
      .filter(t => {
        if (hanyaSaya && !milikSaya(t)) return false;
        if (!TAHAP[tahap].cocok((t.status ?? '').toLowerCase())) return false;
        if (!q) return true;
        return [t.deskripsiTugas, t.assignedTo, (t as any).unit, (t as any).beisCategory]
          .some(v => (v ?? '').toString().toLowerCase().includes(q));
      })
      .sort((a, b) => {
        // Yang mendesak lebih dulu, lalu tenggat terdekat.
        const pa = warnaPrioritas(a.prioritas) === 'danger' ? 0 : 1;
        const pb = warnaPrioritas(b.prioritas) === 'danger' ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return (a.tanggalFU ?? a.tanggal ?? '').localeCompare(b.tanggalFU ?? b.tanggal ?? '');
      });
  }, [flowTasks, tahap, cari, hanyaSaya, namaSaya, tabSaya]);

  return (
    <Screen>
      <AppBar title="Task Board" back />

      <Stack className="gap-4">
        {/* --- Pencarian --- */}
        <label className={`flex items-center gap-2.5 px-3.5 ${HIT_TARGET} ${surface.card} ${radius.control} border ${surface.divider}`}>
          <Search className={`w-4 h-4 shrink-0 ${ink.faint}`} />
          <input
            value={cari}
            onChange={e => setCari(e.target.value)}
            placeholder="Cari tugas, PIC, atau unit"
            className={`flex-1 min-w-0 bg-transparent outline-none ${text.body} ${ink.strong} placeholder:text-slate-400`}
          />
          {cari && (
            <button type="button" onClick={() => setCari('')} aria-label="Hapus pencarian" className="p-1 -mr-1">
              <X className={`w-4 h-4 ${ink.faint}`} />
            </button>
          )}
        </label>

        {/* --- Tahap sebagai chip, bukan tab tabel --- */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5">
          {(Object.keys(TAHAP) as Tahap[]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setTahap(k)}
              className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold transition-colors border ${
                tahap === k
                  ? 'bg-primary text-white border-transparent'
                  : `${surface.card} ${ink.base} ${surface.divider}`
              }`}
            >
              {TAHAP[k].label} · {jumlahPerTahap[k]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHanyaSaya(v => !v)}
            className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold transition-colors border flex items-center gap-1.5 ${
              hanyaSaya
                ? 'bg-primary text-white border-transparent'
                : `${surface.card} ${ink.base} ${surface.divider}`
            }`}
          >
            <User2 className="w-3.5 h-3.5" />
            Tugas saya
          </button>
        </div>

        {/* --- Daftar --- */}
        {daftar.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={ClipboardList}
              title={cari ? 'Tidak ada yang cocok' : `Tidak ada tugas ${TAHAP[tahap].label.toLowerCase()}`}
              description={
                cari
                  ? 'Coba kata kunci lain, atau hapus pencarian.'
                  : hanyaSaya
                    ? 'Belum ada tugas yang ditugaskan kepada Anda pada tahap ini.'
                    : 'Tugas baru akan muncul di sini.'
              }
            />
          </Card>
        ) : (
          <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
            {daftar.map(t => {
              const nadaStatus = warnaStatus(t.status ?? '');
              const nadaPrio = warnaPrioritas(t.prioritas);
              const jt = tenggat((t as any).tanggalFU || t.tanggal);
              return (
                <div key={t.id} className="px-4 py-3.5 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    {/* Penanda prioritas: satu batang tipis, bukan lencana berwarna di tiap kolom */}
                    <span
                      className={`w-1 self-stretch rounded-full shrink-0 ${
                        nadaPrio === 'danger' ? 'bg-danger' : nadaPrio === 'warning' ? 'bg-warning' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`flex-1 min-w-0 ${text.body} font-medium ${ink.strong} leading-snug`}>
                      {t.deskripsiTugas || '(tanpa deskripsi)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pl-3.5">
                    <span className={`${text.caption} font-semibold px-1.5 py-0.5 ${radius.control} ${tone[nadaStatus].bgSoft} ${tone[nadaStatus].text}`}>
                      {t.status}
                    </span>
                    {t.prioritas && (
                      <span className={`${text.caption} font-semibold ${tone[nadaPrio].text}`}>{t.prioritas}</span>
                    )}
                    {t.assignedTo && (
                      <span className={`${text.caption} ${ink.muted} flex items-center gap-1 min-w-0`}>
                        <User2 className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[110px]">{t.assignedTo}</span>
                      </span>
                    )}
                    {jt && (
                      <span className={`${text.caption} flex items-center gap-1 ${jt.mendesak ? tone.danger.text : ink.faint}`}>
                        <CalendarDays className="w-3 h-3 shrink-0" />
                        {jt.teks}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileTaskBoard;
