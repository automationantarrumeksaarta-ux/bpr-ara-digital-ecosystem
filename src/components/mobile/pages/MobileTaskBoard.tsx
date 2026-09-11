import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ClipboardList, FileText, ImageIcon, Plus, Search, User2, UserCheck, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { saringTugasUntuk } from '../../../utils/hirarki';
import { tugasTertunggak, hariTerlambat } from '../../../utils/tugas';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone, HIT_TARGET, type ToneName } from '../ui/tokens';

/**
 * Daftar tugas versi aplikasi.
 *
 * Bukan TaskTableView yang dipersempit. Versi web adalah tabel sepuluh kolom
 * yang di layar HP hanya bisa dibaca dengan menggeser ke samping.
 *
 * Susunan di sini menjawab pertanyaan yang sebenarnya dibawa pengguna saat
 * membuka aplikasi: apa yang harus saya kerjakan sekarang. Karena itu tugas
 * mendesak diangkat ke atas LINTAS TAHAP — sebelumnya tugas yang terlambat
 * lima hari tetap tersembunyi selama pengguna berada di tab yang lain.
 *
 * Penyaringan dan pengurutan tidak mengubah aturan apa pun; hanya cara data
 * yang sama ditampilkan.
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
const tenggat = (tanggal?: string): { teks: string; mendesak: boolean; lewat: boolean } | null => {
  if (!tanggal) return null;
  const t = new Date(`${tanggal}T00:00:00`);
  if (Number.isNaN(t.getTime())) return null;
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const selisih = Math.round((t.getTime() - hariIni.getTime()) / 86_400_000);
  if (selisih === 0) return { teks: 'Hari ini', mendesak: true, lewat: false };
  if (selisih < 0) return { teks: `Terlambat ${Math.abs(selisih)} hari`, mendesak: true, lewat: true };
  if (selisih === 1) return { teks: 'Besok', mendesak: true, lewat: false };
  return { teks: `${selisih} hari lagi`, mendesak: false, lewat: false };
};

const MobileTaskBoard: React.FC = () => {
  const { flowTasks, currentUser, taskRoutes, allUsers } = useApp() as any;
  const [tahap, setTahap] = useState<Tahap>('aktif');
  const [cari, setCari] = useState('');
  const [hanyaSaya, setHanyaSaya] = useState(false);
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const namaSaya = (currentUser?.name ?? '').trim().toLowerCase();
  const tabSaya = ((currentUser as any)?.assignedMemberTab ?? '').trim().toLowerCase();

  const milikSaya = (t: any) => {
    const pic = (t.assignedTo ?? t.pic ?? '').trim().toLowerCase();
    return !!pic && (pic === namaSaya || pic === tabSaya);
  };

  /*
   * Papan tugas hanya memuat tugas sendiri dan tugas bawahan, berjenjang —
   * aturan yang sama persis dengan versi web, lewat utilitas bersama.
   *
   * Sebelumnya `flowTasks` dipakai apa adanya, sehingga setiap pegawai melihat
   * papan tugas seluruh kantor. Penyaring "Tugas saya" hanya mempersempit
   * tampilan, bukan membatasi hak akses.
   */
  const terlihat = useMemo(
    () => saringTugasUntuk(flowTasks ?? [], currentUser?.id, currentUser?.name, taskRoutes ?? {}, allUsers ?? []),
    [flowTasks, currentUser?.id, currentUser?.name, taskRoutes, allUsers],
  );

  const dasar = useMemo(
    () => terlihat.filter((t: any) => !hanyaSaya || milikSaya(t)),
    [terlihat, hanyaSaya, namaSaya, tabSaya],
  );

  const tertunggak = useMemo(() => tugasTertunggak(terlihat), [terlihat]);

  const jumlahPerTahap = useMemo(() => {
    const n: Record<Tahap, number> = { aktif: 0, menunggu: 0, selesai: 0 };
    for (const t of dasar) {
      const s = (t.status ?? '').toLowerCase();
      (Object.keys(TAHAP) as Tahap[]).forEach(k => { if (TAHAP[k].cocok(s)) n[k]++; });
    }
    return n;
  }, [dasar]);

  /*
   * Tugas mendesak dikumpulkan lintas tahap: terlambat atau jatuh tempo hari
   * ini, dan belum selesai. Tidak ada aturan baru — hanya menyorot tugas yang
   * memang sudah ada di daftar.
   */
  const mendesak = useMemo(() => {
    if (cari.trim()) return [];
    return dasar
      .filter((t: any) => {
        if (TAHAP.selesai.cocok((t.status ?? '').toLowerCase())) return false;
        const jt = tenggat(t.tanggalFU || t.tanggal);
        return !!jt?.mendesak;
      })
      .sort((a: any, b: any) => (a.tanggalFU ?? a.tanggal ?? '').localeCompare(b.tanggalFU ?? b.tanggal ?? ''));
  }, [dasar, cari]);

  const idMendesak = useMemo(() => new Set(mendesak.map((t: any) => t.id)), [mendesak]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return dasar
      .filter((t: any) => {
        if (q) {
          return [t.deskripsiTugas, t.assignedTo, t.unit, t.beisCategory]
            .some(v => (v ?? '').toString().toLowerCase().includes(q));
        }
        if (!TAHAP[tahap].cocok((t.status ?? '').toLowerCase())) return false;
        // Tidak diulang di bawah kalau sudah tampil di blok mendesak.
        return !idMendesak.has(t.id);
      })
      .sort((a: any, b: any) => {
        const pa = warnaPrioritas(a.prioritas) === 'danger' ? 0 : 1;
        const pb = warnaPrioritas(b.prioritas) === 'danger' ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return (a.tanggalFU ?? a.tanggal ?? '').localeCompare(b.tanggalFU ?? b.tanggal ?? '');
      });
  }, [dasar, tahap, cari, idMendesak]);

  const sedangMencari = !!cari.trim();

  return (
    <Screen>
      <AppBar
        title="Task Board"
        back
        action={
          /* "Tugas saya" dipindah ke bilah atas supaya deretan chip di bawah
             murni berisi tahap — titik keputusan turun dari 5 jadi 4. */
          <button
            type="button"
            onClick={() => setHanyaSaya(v => !v)}
            aria-pressed={hanyaSaya}
            aria-label={hanyaSaya ? 'Tampilkan semua tugas' : 'Tampilkan tugas saya saja'}
            className={`w-11 h-11 mr-1 flex items-center justify-center ${radius.control} ${
              hanyaSaya ? `${tone.primary.bgSoft} ${tone.primary.text}` : ink.muted
            }`}
          >
            <UserCheck className="w-5 h-5" />
          </button>
        }
      />

      <Stack className="gap-4 pb-24">
        {/*
          Pengingat tugas yang lewat hari tetapi statusnya belum berubah.
          Tidak muncul bila tidak ada — spanduk yang selalu hadir akan berhenti
          dibaca dalam hitungan hari.
        */}
        {tertunggak.length > 0 && (
          <div className={`${radius.card} bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px text-amber-600" />
            <div className="min-w-0">
              <p className={`${text.footnote} font-semibold text-amber-700`}>
                {tertunggak.length} tugas lewat tenggat
              </p>
              <p className={`${text.caption} text-amber-700/80 mt-0.5 leading-relaxed`}>
                Terlama {hariTerlambat(tertunggak[0])} hari. Perbarui statusnya atau ajukan validasi.
              </p>
            </div>
          </div>
        )}

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

        {hanyaSaya && (
          <p className={`${text.caption} ${tone.primary.text} px-1 -mt-1 -mb-1 font-medium`}>
            Menampilkan tugas Anda saja
          </p>
        )}

        {/* --- Perlu segera: lintas tahap --- */}
        {mendesak.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className={`${text.headline} ${ink.strong} px-1`}>Perlu segera</h2>
            <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
              {mendesak.map((t: any) => (
                <BarisTugas key={t.id} tugas={t} tampilkanStatus onBuka={() => setDetail(t)} />
              ))}
            </Card>
          </section>
        )}

        {/* --- Tahap sebagai chip --- */}
        {!sedangMencari && (
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
          </div>
        )}

        {daftar.length === 0 ? (
          mendesak.length === 0 && (
            <Card flush>
              <EmptyState
                icon={ClipboardList}
                title={sedangMencari ? 'Tidak ada yang cocok' : `Tidak ada tugas ${TAHAP[tahap].label.toLowerCase()}`}
                description={
                  sedangMencari
                    ? 'Coba kata kunci lain, atau hapus pencarian.'
                    : hanyaSaya
                      ? 'Belum ada tugas yang ditugaskan kepada Anda pada tahap ini.'
                      : 'Tugas baru akan muncul di sini.'
                }
              />
            </Card>
          )
        ) : (
          <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
            {daftar.map((t: any) => (
              <BarisTugas
                key={t.id}
                tugas={t}
                /* Badge status hanya berguna saat isinya bisa berbeda-beda.
                   Di dalam satu chip tahap, semua baris berstatus sama —
                   badge-nya hanya mengulang judul chip yang sedang aktif. */
                tampilkanStatus={sedangMencari}
                onBuka={() => setDetail(t)}
              />
            ))}
          </Card>
        )}
      </Stack>

      <button
        type="button"
        onClick={() => setFormTerbuka(true)}
        aria-label="Buat tugas baru"
        className="fixed bottom-8 right-5 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-7 h-7" strokeWidth={2.2} />
      </button>

      {detail && <DetailTugas tugas={detail} onTutup={() => setDetail(null)} />}
      {formTerbuka && <FormTugas onTutup={() => setFormTerbuka(false)} onTersimpan={() => setFormTerbuka(false)} />}
    </Screen>
  );
};

/* ------------------------------------------------------------------ baris */

const BarisTugas: React.FC<{ tugas: any; tampilkanStatus: boolean; onBuka: () => void }> = ({
  tugas, tampilkanStatus, onBuka,
}) => {
  const nadaPrio = warnaPrioritas(tugas.prioritas);
  const nadaStatus = warnaStatus(tugas.status ?? '');
  const jt = tenggat(tugas.tanggalFU || tugas.tanggal);

  return (
    <button
      type="button"
      onClick={onBuka}
      className="w-full px-4 py-3.5 flex flex-col gap-2 text-left active:bg-slate-50 transition-colors"
    >
      <div className="flex items-start gap-2.5">
        {/* Satu penanda prioritas saja — batang warna. Teks "P1" di sebelahnya
            hanya mengulang keterangan yang sama. */}
        <span
          className={`w-1 self-stretch rounded-full shrink-0 ${
            nadaPrio === 'danger' ? 'bg-danger' : nadaPrio === 'warning' ? 'bg-warning' : 'bg-slate-200'
          }`}
        />
        <p className={`flex-1 min-w-0 ${text.body} font-medium ${ink.strong} leading-snug`}>
          {tugas.deskripsiTugas || '(tanpa deskripsi)'}
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap pl-3.5">
        {tampilkanStatus && (
          <span className={`${text.caption} font-semibold px-1.5 py-0.5 ${radius.control} ${tone[nadaStatus].bgSoft} ${tone[nadaStatus].text}`}>
            {tugas.status}
          </span>
        )}
        {tugas.assignedTo && (
          <span className={`${text.caption} ${ink.muted} flex items-center gap-1 min-w-0`}>
            <User2 className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[110px]">{tugas.assignedTo}</span>
          </span>
        )}
        {jt && (
          <span className={`${text.caption} flex items-center gap-1 ${jt.mendesak ? tone.danger.text : ink.faint}`}>
            <CalendarDays className="w-3 h-3 shrink-0" />
            {jt.teks}
          </span>
        )}
      </div>
    </button>
  );
};

/* ------------------------------------------------------------------ detail */

/**
 * Lembar detail baca-saja.
 *
 * Sebelumnya baris tugas tidak bisa ditekan sama sekali, sehingga arahan
 * atasan, bukti penyelesaian, dan lampiran hanya bisa dilihat lewat web.
 */
const DetailTugas: React.FC<{ tugas: any; onTutup: () => void }> = ({ tugas, onTutup }) => {
  const jt = tenggat(tugas.tanggalFU || tugas.tanggal);
  const lampiran: any[] = tugas.evidenceFiles ?? [];

  const baris = [
    { label: 'Status', nilai: tugas.status },
    { label: 'Prioritas', nilai: tugas.prioritas },
    { label: 'Penanggung jawab', nilai: tugas.assignedTo },
    { label: 'Unit', nilai: tugas.unit },
    { label: 'Jenis', nilai: tugas.jenisTeknis },
    { label: 'Tenggat', nilai: jt?.teks },
  ].filter(b => b.nilai);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header
        className={`shrink-0 border-b ${surface.divider} flex items-center gap-1 h-12 px-1`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          type="button"
          onClick={onTutup}
          aria-label="Tutup"
          className={`w-11 h-11 flex items-center justify-center ${ink.base} active:opacity-50`}
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className={`${text.title} ${ink.strong} flex-1`}>Detail tugas</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <p className={`${text.headline} ${ink.strong} leading-snug`}>
          {tugas.deskripsiTugas || '(tanpa deskripsi)'}
        </p>

        <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
          {baris.map(b => (
            <div key={b.label} className="px-4 py-3 flex items-center gap-3">
              <span className={`flex-1 ${text.body} ${ink.muted}`}>{b.label}</span>
              <span className={`${text.body} font-medium ${ink.strong} text-right`}>{b.nilai}</span>
            </div>
          ))}
        </Card>

        {tugas.arahanAtasan && (
          <div className="flex flex-col gap-1.5">
            <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
              Arahan atasan
            </span>
            <Card><p className={`${text.body} ${ink.base} leading-snug`}>{tugas.arahanAtasan}</p></Card>
          </div>
        )}

        {(tugas.penyelesaian || lampiran.length > 0) && (
          <div className="flex flex-col gap-1.5">
            <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
              Bukti penyelesaian
            </span>
            <Card className="flex flex-col gap-2.5">
              {tugas.penyelesaian && (
                <p className={`${text.body} ${ink.base} leading-snug break-words`}>{tugas.penyelesaian}</p>
              )}
              {lampiran.map((f: any, i: number) => (
                <a
                  key={f.id ?? i}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`min-h-[36px] flex items-center gap-2 ${text.body} font-medium ${tone.primary.text}`}
                >
                  {String(f.type ?? '').startsWith('image/')
                    ? <ImageIcon className="w-4 h-4 shrink-0" />
                    : <FileText className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{f.name ?? 'Lampiran'}</span>
                </a>
              ))}
            </Card>
          </div>
        )}

        <p className={`${text.caption} ${ink.faint} text-center px-6`}>
          Perubahan status dan validasi dilakukan lewat Approval Queue atau versi web.
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ form */

const PRIORITAS = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;

/**
 * Form tugas baru — lembar penuh, bukan dialog.
 *
 * Di layar HP, dialog kecil menyisakan sedikit ruang untuk papan ketik dan
 * membuat isian terdorong keluar layar.
 */
const FormTugas: React.FC<{ onTutup: () => void; onTersimpan: () => void }> = ({ onTutup, onTersimpan }) => {
  const { createFlowTask, currentUser, allUsers } = useApp() as any;

  const [deskripsi, setDeskripsi] = useState('');
  const [prioritas, setPrioritas] = useState<string>('P3');
  const [pic, setPic] = useState<string>(currentUser?.name ?? '');
  const [tenggatTgl, setTenggatTgl] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  const simpan = () => {
    if (!deskripsi.trim()) return;
    setMenyimpan(true);
    createFlowTask({
      deskripsiTugas: deskripsi.trim(),
      prioritas,
      assignedTo: pic,
      pic,
      tanggalFU: tenggatTgl || undefined,
      status: 'Planned',
    });
    onTersimpan();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
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
        <h1 className={`${text.title} ${ink.strong} flex-1`}>Tugas baru</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
            Deskripsi tugas
          </span>
          <textarea
            value={deskripsi}
            onChange={e => setDeskripsi(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Mis. Kunjungan penagihan debitur an. Budi Santoso"
            className={`w-full px-3.5 py-3 ${radius.control} border ${surface.divider} ${text.body} ${ink.strong} placeholder:text-slate-400 outline-none focus:border-blue-500 resize-none`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
            Prioritas
          </span>
          <div className="flex gap-2">
            {PRIORITAS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioritas(p)}
                className={`flex-1 min-h-[44px] ${radius.control} ${text.body} font-semibold border transition-colors ${
                  prioritas === p
                    ? 'bg-primary text-white border-transparent'
                    : `${surface.card} ${ink.base} ${surface.divider}`
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className={`${text.caption} ${ink.faint} px-1`}>P1 paling mendesak, P5 paling longgar</span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
            Penanggung jawab
          </span>
          <div className={`relative flex items-center px-3.5 min-h-[44px] ${surface.card} ${radius.control} border ${surface.divider}`}>
            <span className={`flex-1 ${text.body} ${ink.strong} truncate`}>{pic || 'Pilih'}</span>
            <User2 className={`w-4 h-4 ${ink.faint}`} />
            <select
              value={pic}
              onChange={e => setPic(e.target.value)}
              aria-label="Penanggung jawab"
              className="absolute inset-0 w-full h-full opacity-0"
            >
              {[currentUser?.name, ...(allUsers ?? []).map((u: any) => u.name)]
                .filter((v, i, arr) => v && arr.indexOf(v) === i)
                .map((n: string) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
            Tenggat (opsional)
          </span>
          <input
            type="date"
            value={tenggatTgl}
            onChange={e => setTenggatTgl(e.target.value)}
            className={`w-full px-3.5 min-h-[44px] ${radius.control} border ${surface.divider} ${text.body} ${ink.strong} outline-none focus:border-blue-500`}
          />
        </label>
      </div>

      <div
        className={`shrink-0 border-t ${surface.divider} px-4 py-3`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button
          type="button"
          disabled={!deskripsi.trim() || menyimpan}
          onClick={simpan}
          className={`w-full min-h-[52px] ${radius.control} ${text.headline} text-white bg-primary disabled:bg-slate-300 transition-transform active:scale-[0.98] disabled:active:scale-100`}
        >
          {menyimpan ? 'Menyimpan…' : 'Simpan tugas'}
        </button>
      </div>
    </div>
  );
};

export default MobileTaskBoard;
