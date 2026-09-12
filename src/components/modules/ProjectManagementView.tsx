import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase, CalendarDays, ClipboardList, Crown, Plus, RefreshCw, Search, Send, Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../ui/PageContainer';
import { DeretAngka } from '../credit/StageShell';
import {
  BarisAntrean, BelumAdaPilihan, Kosong, KosongKarenaSaringan, NadaPill, Panel, StageWorkbench,
} from '../credit/StageParts';
import { tanggalPendek } from '../credit/pipeline';
import { ambilApi } from '../../utils/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

/**
 * Modul Proyek.
 *
 * Sebelumnya proyek hanya hidup di dalam state React: `useGetProjects` memulai
 * dengan array kosong lalu menambah ke state. Apa pun yang diketik hilang
 * begitu halaman dimuat ulang, tidak ada seorang pun selain pembuatnya yang
 * bisa melihatnya, dan tombol tambah hanya muncul untuk peran 'Master Admin'.
 *
 * Sekarang tersimpan di server. Siapa pun dapat ditetapkan sebagai ketua —
 * kepemimpinan proyek tidak terikat jabatan — dan ketua beserta anggotanya
 * mencatat laporan kemajuan di halaman yang sama.
 *
 * Bentuknya mengikuti kerangka "antrean + meja kerja" yang dipakai tahap
 * Analisis, Komite, dan Legal: kiri daftar proyek, kanan yang sedang dikerjakan.
 */

type StatusProyek = 'On Track' | 'Delayed' | 'At Risk' | 'Completed';

const STATUS: { nilai: StatusProyek; label: string; nada: 'success' | 'warning' | 'danger' | 'info' }[] = [
  { nilai: 'On Track', label: 'Sesuai rencana', nada: 'success' },
  { nilai: 'Delayed', label: 'Terlambat', nada: 'warning' },
  { nilai: 'At Risk', label: 'Berisiko', nada: 'danger' },
  { nilai: 'Completed', label: 'Selesai', nada: 'info' },
];

const rupaStatus = (s: string) => STATUS.find(x => x.nilai === s) ?? STATUS[0];

interface Proyek {
  id: string;
  title: string;
  description: string | null;
  leader_id: string;
  leader_name: string | null;
  unit: string | null;
  members: { id: string; name?: string | null }[];
  deadline: string | null;
  target: number;
  actual: number;
  status: StatusProyek;
  created_by: string;
  jumlahLaporan: number;
  laporanTerakhir: string | null;
  bolehLapor: boolean;
}

interface Laporan {
  id: string;
  author_name: string | null;
  progress: number | null;
  body: string;
  created_at: string;
}

const kelasIsian =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground ' +
  'placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

const Label: React.FC<{ children: React.ReactNode; untuk?: string }> = ({ children, untuk }) => (
  <label htmlFor={untuk} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
    {children}
  </label>
);

/** Bilah kemajuan. Angka ditulis di sampingnya, bukan hanya panjang batangnya. */
const Kemajuan: React.FC<{ actual: number; target: number; nada: string }> = ({ actual, target, nada }) => {
  const persen = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-500',
            nada === 'success' ? 'bg-success' : nada === 'warning' ? 'bg-warning'
              : nada === 'danger' ? 'bg-danger' : 'bg-primary',
          )}
          style={{ width: `${persen}%` }}
        />
      </span>
      <span className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums text-foreground">
        {persen}%
      </span>
    </div>
  );
};

export const ProjectManagementView: React.FC = () => {
  const { currentUser, allUsers } = useApp() as any;

  const [proyek, setProyek] = useState<Proyek[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [cari, setCari] = useState('');
  const [saringStatus, setSaringStatus] = useState<'SEMUA' | StatusProyek>('SEMUA');
  const [terpilihId, setTerpilihId] = useState<string>('');
  const [bukaForm, setBukaForm] = useState(false);
  const [pemicu, setPemicu] = useState(0);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      const { res, json } = await ambilApi('/api/projects');
      if (!res.ok) throw new Error(json?.error ?? 'Gagal memuat proyek');
      setProyek(json.data ?? []);
    } catch (e: any) {
      setGalat(e?.message ?? 'Terjadi kesalahan');
      setProyek([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat, pemicu]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return proyek.filter(p => {
      const cocokCari = q === '' ||
        p.title.toLowerCase().includes(q) ||
        (p.leader_name ?? '').toLowerCase().includes(q) ||
        (p.unit ?? '').toLowerCase().includes(q);
      const cocokStatus = saringStatus === 'SEMUA' || p.status === saringStatus;
      return cocokCari && cocokStatus;
    });
  }, [proyek, cari, saringStatus]);

  useEffect(() => {
    if (daftar.length === 0) { if (terpilihId) setTerpilihId(''); return; }
    if (!daftar.some(p => p.id === terpilihId)) setTerpilihId(daftar[0].id);
  }, [daftar, terpilihId]);

  const aktif = proyek.find(p => p.id === terpilihId) ?? null;

  const berjalan = proyek.filter(p => p.status !== 'Completed').length;
  const berisiko = proyek.filter(p => p.status === 'At Risk' || p.status === 'Delayed').length;
  const sayaPimpin = proyek.filter(p => p.leader_id === currentUser?.id).length;
  const belumDilapor = proyek.filter(p => p.jumlahLaporan === 0).length;

  const adaSaringan = cari.trim() !== '' || saringStatus !== 'SEMUA';

  return (
    <PageContainer>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Proyek</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Siapa pun dapat ditetapkan sebagai ketua proyek. Ketua dan anggotanya mencatat kemajuan
            di sini, dan atasannya dapat memantau tanpa perlu ikut melapor.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setPemicu(n => n + 1)}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', memuat && 'animate-spin')} /> Muat ulang
          </Button>
          <Button onClick={() => setBukaForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Proyek baru
          </Button>
        </div>
      </header>

      <DeretAngka
        angka={[
          { label: 'Berjalan', nilai: berjalan.toLocaleString('id-ID'), konteks: `dari ${proyek.length} proyek` },
          {
            label: 'Perlu perhatian',
            nilai: berisiko.toLocaleString('id-ID'),
            konteks: berisiko > 0 ? 'Terlambat atau berisiko' : 'Tidak ada',
            nada: berisiko > 0 ? 'warning' : 'default',
          },
          { label: 'Anda pimpin', nilai: sayaPimpin.toLocaleString('id-ID'), konteks: 'Sebagai ketua proyek' },
          {
            label: 'Belum dilaporkan',
            nilai: belumDilapor.toLocaleString('id-ID'),
            konteks: belumDilapor > 0 ? 'Belum ada laporan sama sekali' : 'Semua sudah dilaporkan',
            nada: belumDilapor > 0 ? 'danger' : 'default',
          },
        ]}
      />

      <StageWorkbench
        judulAntrean="Daftar proyek"
        jumlah={daftar.length}
        antrean={
          memuat ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-muted" />)}
            </div>
          ) : galat ? (
            <Kosong rapat icon={Briefcase} judul="Gagal memuat" keterangan={galat} />
          ) : daftar.length === 0 ? (
            adaSaringan ? (
              <KosongKarenaSaringan rapat onReset={() => { setCari(''); setSaringStatus('SEMUA'); }} />
            ) : (
              <Kosong
                rapat
                icon={Briefcase}
                judul="Belum ada proyek"
                keterangan="Buat proyek pertama dan tetapkan ketuanya."
              />
            )
          ) : (
            daftar.map(p => {
              const r = rupaStatus(p.status);
              return (
                <BarisAntrean
                  key={p.id}
                  terpilih={terpilihId === p.id}
                  onClick={() => setTerpilihId(p.id)}
                  utama={p.title}
                  kedua={`${p.leader_name ?? '—'}${p.deadline ? ` · ${tanggalPendek(p.deadline)}` : ''}`}
                  kanan={<NadaPill label={r.label} nada={r.nada} />}
                  bawah={<Kemajuan actual={p.actual} target={p.target} nada={r.nada} />}
                />
              );
            })
          )
        }
      >
        {!aktif ? (
          <BelumAdaPilihan
            icon={ClipboardList}
            judul="Pilih proyek untuk melihat laporannya"
            keterangan="Klik salah satu proyek di sebelah kiri. Riwayat laporan kemajuan dan lembar pelaporannya akan terbuka di sini."
            /*
             * Saat pemuatan gagal, panel ini tidak boleh ikut menyatakan
             * daftarnya kosong. Daftar di sebelah kiri sudah berkata "gagal
             * memuat", dan panel yang berkata "tidak ada yang perlu dikerjakan"
             * di sebelahnya membuat kegagalan terbaca sebagai keadaan normal.
             */
            antreanKosong={!galat && !memuat && daftar.length === 0}
            judulKosong={adaSaringan ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek'}
            keteranganKosong={
              adaSaringan
                ? 'Saringan yang dipakai menyisakan nol proyek. Hapus saringannya untuk melihat seluruh daftar.'
                : 'Buat proyek pertama lewat tombol Proyek baru, lalu tetapkan ketuanya. Siapa pun dapat ditetapkan sebagai ketua.'
            }
          />
        ) : (
          <DetailProyek
            proyek={aktif}
            semuaPengguna={allUsers ?? []}
            onBerubah={() => setPemicu(n => n + 1)}
          />
        )}
      </StageWorkbench>

      {/* Saringan diletakkan di bawah karena daftar proyek jarang panjang;
          menaruhnya di puncak hanya akan mendorong isi utama ke bawah. */}
      <Panel judul="Saring daftar">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search" value={cari} onChange={e => setCari(e.target.value)}
              placeholder="Cari nama proyek, ketua, atau unit"
              aria-label="Cari proyek"
              className={cn(kelasIsian, 'w-64 pl-9')}
            />
          </div>
          <select
            value={saringStatus} onChange={e => setSaringStatus(e.target.value as any)}
            aria-label="Saring status" className={cn(kelasIsian, 'w-auto cursor-pointer')}
          >
            <option value="SEMUA">Semua status</option>
            {STATUS.map(s => <option key={s.nilai} value={s.nilai}>{s.label}</option>)}
          </select>
        </div>
      </Panel>

      <FormProyek
        buka={bukaForm}
        onTutup={() => setBukaForm(false)}
        semuaPengguna={allUsers ?? []}
        penggunaKini={currentUser}
        onTersimpan={() => { setBukaForm(false); setPemicu(n => n + 1); }}
      />
    </PageContainer>
  );
};

/* ------------------------------------------------------------------ detail */

const DetailProyek: React.FC<{
  proyek: Proyek;
  semuaPengguna: any[];
  onBerubah: () => void;
}> = ({ proyek, onBerubah }) => {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [isi, setIsi] = useState('');
  const [progres, setProgres] = useState<string>('');
  const [status, setStatus] = useState<StatusProyek>(proyek.status);
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    setStatus(proyek.status);
    setProgres('');
    setIsi('');
    (async () => {
      setMemuat(true);
      try {
        const { res, json } = await ambilApi(`/api/projects/${proyek.id}/reports`);
        if (batal) return;
        setLaporan(res.ok ? (json.data ?? []) : []);
      } catch {
        /*
         * Daftar laporan bukan isi utama panel ini, jadi kegagalannya tidak
         * boleh menjatuhkan seluruh komponen. Sebelumnya tidak ada `catch` di
         * sini sama sekali, sehingga balasan yang bukan JSON menjadi penolakan
         * janji yang tidak tertangani.
         */
        if (!batal) setLaporan([]);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, [proyek.id, proyek.status]);

  const kirim = async () => {
    if (!isi.trim()) return;
    setMengirim(true);
    setGalat(null);
    try {
      const { res, json } = await ambilApi(`/api/projects/${proyek.id}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          body: isi.trim(),
          progress: progres === '' ? undefined : Number(progres),
          status,
        }),
      });
      if (!res.ok) throw new Error(json?.error ?? 'Gagal menyimpan laporan');
      setIsi('');
      setProgres('');
      onBerubah();
    } catch (e: any) {
      setGalat(e?.message ?? 'Terjadi kesalahan');
    } finally {
      setMengirim(false);
    }
  };

  const r = rupaStatus(proyek.status);

  return (
    <div className="space-y-5">
      <Panel judul={proyek.title} alat={<NadaPill label={r.label} nada={r.nada} />}>
        {proyek.description && (
          <p className="-mt-1 mb-4 text-xs leading-relaxed text-slate-600">{proyek.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Ketua', nilai: proyek.leader_name ?? '—', ikon: Crown },
            { label: 'Anggota', nilai: proyek.members.length ? `${proyek.members.length} orang` : 'Belum ada', ikon: Users },
            { label: 'Tenggat', nilai: proyek.deadline ? tanggalPendek(proyek.deadline) : 'Belum ditetapkan', ikon: CalendarDays },
            { label: 'Laporan', nilai: `${proyek.jumlahLaporan}`, ikon: ClipboardList },
          ].map(k => (
            <div key={k.label} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                <k.ikon className="h-3 w-3" /> {k.label}
              </p>
              <p className="mt-1 truncate text-xs font-bold tabular-nums text-foreground">{k.nilai}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Kemajuan</p>
          <Kemajuan actual={proyek.actual} target={proyek.target} nada={r.nada} />
        </div>

        {proyek.members.length > 0 && (
          <p className="mt-3 text-[11px] text-slate-500">
            Anggota: {proyek.members.map(m => m.name ?? m.id).join(', ')}
          </p>
        )}
      </Panel>

      {/* --------------------------- lapor --------------------------- */}
      {proyek.bolehLapor ? (
        <Panel judul="Catat kemajuan">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_11rem]">
            <div className="sm:col-span-3">
              <Label untuk="isi-laporan">Laporan</Label>
              <textarea
                id="isi-laporan" rows={3} value={isi} onChange={e => setIsi(e.target.value)}
                placeholder="Apa yang sudah dikerjakan sejak laporan terakhir, dan apa hambatannya."
                className={cn(kelasIsian, 'resize-y')}
              />
            </div>
            <div className="sm:col-start-2">
              <Label untuk="progres">Kemajuan</Label>
              <input
                id="progres" type="number" min={0} max={proyek.target}
                value={progres} onChange={e => setProgres(e.target.value)}
                placeholder={`0–${proyek.target}`}
                className={cn(kelasIsian, 'tabular-nums')}
              />
            </div>
            <div>
              <Label untuk="status-proyek">Status</Label>
              <select
                id="status-proyek" value={status} onChange={e => setStatus(e.target.value as StatusProyek)}
                className={cn(kelasIsian, 'cursor-pointer')}
              >
                {STATUS.map(s => <option key={s.nilai} value={s.nilai}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {galat && (
            <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[11px] font-bold text-danger">{galat}</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-[11px] text-slate-500">
              Angka kemajuan yang diisi di sini menjadi kemajuan proyek. Kosongkan bila belum berubah.
            </p>
            <Button disabled={!isi.trim()} loading={mengirim} onClick={kirim}>
              <Send className="mr-1.5 h-4 w-4" /> Kirim laporan
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel>
          <Kosong
            rapat
            icon={ClipboardList}
            judul="Anda memantau proyek ini"
            keterangan="Hanya ketua, anggota, dan pembuat proyek yang mencatat laporan kemajuan."
          />
        </Panel>
      )}

      {/* --------------------------- riwayat --------------------------- */}
      <Panel judul="Riwayat laporan" hitungan={laporan.length}>
        {memuat ? (
          <div className="space-y-2">
            {[0, 1].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-muted" />)}
          </div>
        ) : laporan.length === 0 ? (
          <Kosong
            rapat
            icon={ClipboardList}
            judul="Belum ada laporan"
            keterangan="Laporan pertama akan muncul di sini beserta nama pelapor dan waktunya."
          />
        ) : (
          <ol className="space-y-3">
            {laporan.map(l => (
              <li key={l.id} className="rounded-xl bg-surface-muted px-3.5 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">{l.author_name ?? 'Tanpa nama'}</span>
                  <span className="text-[10px] tabular-nums text-slate-500">
                    {new Date(l.created_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                    {l.progress !== null && ` · kemajuan ${l.progress}`}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-foreground">{l.body}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
};

/* -------------------------------------------------------------------- form */

const FormProyek: React.FC<{
  buka: boolean;
  onTutup: () => void;
  semuaPengguna: any[];
  penggunaKini: any;
  onTersimpan: () => void;
}> = ({ buka, onTutup, semuaPengguna, penggunaKini, onTersimpan }) => {
  const [judul, setJudul] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [ketuaId, setKetuaId] = useState('');
  const [anggota, setAnggota] = useState<string[]>([]);
  const [tenggat, setTenggat] = useState('');
  const [target, setTarget] = useState('100');
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    if (!buka) return;
    setJudul(''); setKeterangan(''); setTenggat(''); setTarget('100');
    setAnggota([]); setGalat(null);
    setKetuaId(penggunaKini?.id ?? '');
  }, [buka, penggunaKini?.id]);

  const orang = (semuaPengguna ?? []).filter((u: any) => u?.id && u?.name);
  const siap = judul.trim() !== '' && ketuaId !== '';

  const simpan = async () => {
    if (!siap) return;
    setMengirim(true);
    setGalat(null);
    try {
      const { res, json } = await ambilApi('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: judul.trim(),
          description: keterangan.trim(),
          leaderId: ketuaId,
          members: anggota.map(id => ({ id, name: orang.find((u: any) => u.id === id)?.name })),
          deadline: tenggat || undefined,
          target: Number(target) || 100,
        }),
      });
      if (!res.ok) throw new Error(json?.error ?? 'Gagal menyimpan proyek');
      onTersimpan();
    } catch (e: any) {
      setGalat(e?.message ?? 'Terjadi kesalahan');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <Modal
      isOpen={buka}
      onClose={onTutup}
      title="Proyek baru"
      description="Tetapkan ketua dan anggotanya. Siapa pun dapat menjadi ketua, tidak terikat jabatan."
    >
      <div className="space-y-4">
        <div>
          <Label untuk="judul-proyek">Nama proyek</Label>
          <input id="judul-proyek" value={judul} onChange={e => setJudul(e.target.value)}
            placeholder="Mis. Digitalisasi arsip kredit" className={kelasIsian} />
        </div>

        <div>
          <Label untuk="ket-proyek">Keterangan</Label>
          <textarea id="ket-proyek" rows={2} value={keterangan}
            onChange={e => setKeterangan(e.target.value)}
            placeholder="Apa yang hendak dicapai proyek ini."
            className={cn(kelasIsian, 'resize-y')} />
        </div>

        <div>
          <Label untuk="ketua">Ketua proyek</Label>
          <select id="ketua" value={ketuaId} onChange={e => setKetuaId(e.target.value)}
            className={cn(kelasIsian, 'cursor-pointer')}>
            <option value="">Pilih ketua…</option>
            {orang.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}{u.unit ? ` · ${u.unit}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Anggota</Label>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-border">
            {orang.filter((u: any) => u.id !== ketuaId).map((u: any) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={anggota.includes(u.id)}
                  onChange={e => setAnggota(a => e.target.checked ? [...a, u.id] : a.filter(x => x !== u.id))}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-primary)]"
                />
                <span className="text-xs text-foreground">{u.name}</span>
                {u.unit && <span className="text-[10px] text-slate-500">{u.unit}</span>}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Anggota boleh mencatat laporan kemajuan, sama seperti ketua.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label untuk="tenggat-proyek">Tenggat</Label>
            <input id="tenggat-proyek" type="date" value={tenggat}
              onChange={e => setTenggat(e.target.value)} className={kelasIsian} />
          </div>
          <div>
            <Label untuk="target-proyek">Target kemajuan</Label>
            <input id="target-proyek" type="number" min={1} value={target}
              onChange={e => setTarget(e.target.value)} className={cn(kelasIsian, 'tabular-nums')} />
          </div>
        </div>

        {galat && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-[11px] font-bold text-danger">{galat}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onTutup}>Batal</Button>
          <Button disabled={!siap} loading={mengirim} onClick={simpan}>
            <Plus className="mr-1.5 h-4 w-4" /> Buat proyek
          </Button>
        </div>
      </div>
    </Modal>
  );
};
