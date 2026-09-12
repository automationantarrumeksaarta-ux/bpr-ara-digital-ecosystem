import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import {
  useEwsAlerts, LABEL_KATEGORI, LABEL_JALUR, KETERANGAN_JALUR, LABEL_TINDAK_LANJUT,
  type JalurEws, type KategoriEws, type PeringatanEws,
} from '../../hooks/useEwsAlerts';
import { PageContainer } from '../ui/PageContainer';
import { DeretAngka } from '../credit/StageShell';
import { Kosong, KosongKarenaSaringan, NadaPill, Panel } from '../credit/StageParts';
import { rupiah, rupiahRingkas } from '../credit/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

/**
 * Peringatan Dini Risiko Kredit.
 *
 * Halaman ini ditulis ulang sepenuhnya. Versi sebelumnya tidak membaca data
 * kredit sama sekali: ia mengurai berkas .xls di dalam peramban, memperlakukan
 * kolom rupiah "Tungakan" seolah-olah satuan hari (`tunggakan > 20` disebut
 * "Hari"), lalu menyusun peringatan tanpa kode dan tanpa modul dengan nomor
 * nasabah acak sehingga tombol "Investigasi" menuju nasabah yang tidak ada.
 * Pilihan "Tindakan Lanjutan" pun tidak terhubung ke apa pun — apa pun yang
 * dipilih, yang tersimpan selalu teks "Resolved via Dashboard".
 *
 * Sekarang seluruh aturan dijalankan server terhadap tabel `loans`, dan
 * tindak lanjut petugas benar-benar tersimpan.
 */

const PILIHAN_TINDAK_LANJUT = ['TERBUKA', 'DITINDAKLANJUTI', 'SELESAI', 'DIABAIKAN'] as const;

const AWAL_DITAMPILKAN = 50;

export const EwsRiskView: React.FC = () => {
  const { memuat, tersedia, alasan, galat, peringatan, ringkas, diagnostik, muatUlang, simpanTindakLanjut } = useEwsAlerts();

  const [cari, setCari] = useState('');
  const [tingkat, setTingkat] = useState<'SEMUA' | 'RED' | 'YELLOW'>('SEMUA');
  const [kategori, setKategori] = useState<'SEMUA' | KategoriEws>('SEMUA');
  const [jalur, setJalur] = useState<'SEMUA' | JalurEws>('SEMUA');
  const [sembunyikanSelesai, setSembunyikanSelesai] = useState(true);
  const [batas, setBatas] = useState(AWAL_DITAMPILKAN);
  const [dipilih, setDipilih] = useState<PeringatanEws | null>(null);

  const daftar = useMemo(() => peringatan.filter(p => {
    const q = cari.trim().toLowerCase();
    const cocokCari = q === '' ||
      p.nama.toLowerCase().includes(q) ||
      p.acuan.toLowerCase().includes(q) ||
      (p.petugas ?? '').toLowerCase().includes(q) ||
      (p.kelurahan ?? '').toLowerCase().includes(q);
    const cocokTingkat = tingkat === 'SEMUA' || p.tingkat === tingkat;
    const cocokKategori = kategori === 'SEMUA' || p.kategori === kategori;
    const cocokJalur = jalur === 'SEMUA' || p.jalur === jalur;
    const status = p.tindakLanjut?.status ?? 'TERBUKA';
    const cocokStatus = !sembunyikanSelesai || (status !== 'SELESAI' && status !== 'DIABAIKAN');
    return cocokCari && cocokTingkat && cocokKategori && cocokJalur && cocokStatus;
  }), [peringatan, cari, tingkat, kategori, jalur, sembunyikanSelesai]);

  const adaSaringan =
    cari.trim() !== '' || tingkat !== 'SEMUA' || kategori !== 'SEMUA' || jalur !== 'SEMUA';
  const resetSaringan = () => {
    setCari(''); setTingkat('SEMUA'); setKategori('SEMUA'); setJalur('SEMUA');
  };

  const kategoriTersedia = useMemo(
    () => [...new Set(peringatan.map(p => p.kategori))].sort(),
    [peringatan],
  );

  /* ------------------------------------------------------------ keadaan */

  if (memuat) {
    return (
      <PageContainer>
        <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />
      </PageContainer>
    );
  }

  if (galat) {
    return (
      <PageContainer>
        <Panel>
          <Kosong
            icon={AlertTriangle}
            judul="Peringatan dini tidak dapat dimuat"
            keterangan={galat}
            aksi={<Button onClick={muatUlang}><RefreshCw className="mr-1.5 h-4 w-4" /> Coba lagi</Button>}
          />
        </Panel>
      </PageContainer>
    );
  }

  if (!tersedia) {
    return (
      <PageContainer>
        <header>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Peringatan Dini Risiko Kredit</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Menyaring seluruh rekening kredit untuk menemukan tanda bahaya sebelum menjadi kredit bermasalah.
          </p>
        </header>
        <Panel>
          <Kosong
            icon={ShieldCheck}
            judul="Belum ada data kredit untuk diperiksa"
            keterangan={alasan ?? 'Unggah berkas Nominatif Kredit lebih dulu, lalu peringatan akan tersusun sendiri dari data itu.'}
          />
        </Panel>
      </PageContainer>
    );
  }

  /* -------------------------------------------------------------- isi */

  return (
    <PageContainer>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Peringatan Dini Risiko Kredit</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Memantau dua penurunan golongan sebelum terjadi: Lancar yang mulai goyah menuju DPK,
            dan DPK yang mendekati Kurang Lancar. Rekening yang sudah KL, D, atau M tidak muncul
            di sini karena penanganannya ada di Collection &amp; Recovery. Seluruh angka dihitung
            dari Nominatif Kredit yang terakhir diunggah.
          </p>
        </div>
        <Button variant="secondary" onClick={muatUlang}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Hitung ulang
        </Button>
      </header>

      {/*
        Dua jalur didahulukan atas hitungan merah/kuning, karena pertanyaan
        pertama di halaman ini bukan "seberapa gawat" melainkan "berapa rekening
        yang sedang bergerak turun, dan ke mana". Angkanya rekening unik, bukan
        jumlah peringatan — satu rekening bisa memicu beberapa aturan sekaligus.
      */}
      <DeretAngka
        angka={[
          {
            label: 'DPK → Kurang Lancar',
            nilai: ringkas.dpkKeKl.toLocaleString('id-ID'),
            konteks: `${rupiahRingkas(ringkas.nilaiDpkKeKl)} baki debet`,
            nada: ringkas.dpkKeKl > 0 ? 'danger' : 'default',
          },
          {
            label: 'Lancar → DPK',
            nilai: ringkas.lKeDpk.toLocaleString('id-ID'),
            konteks: `${rupiahRingkas(ringkas.nilaiLKeDpk)} baki debet`,
            nada: ringkas.lKeDpk > 0 ? 'warning' : 'default',
          },
          {
            label: 'Perlu perhatian',
            nilai: ringkas.merah.toLocaleString('id-ID'),
            konteks: `dari ${ringkas.total.toLocaleString('id-ID')} peringatan`,
            nada: ringkas.merah > 0 ? 'danger' : 'default',
          },
          {
            label: 'Belum ditangani',
            nilai: ringkas.belumDitangani.toLocaleString('id-ID'),
            konteks: ringkas.sudahDitangani > 0
              ? `${ringkas.sudahDitangani.toLocaleString('id-ID')} sudah ditindaklanjuti`
              : 'Belum ada yang ditindaklanjuti',
          },
        ]}
      />

      {/* Jalur adalah sumbu utama halaman ini, jadi ia berdiri sendiri di luar
          bilah alat penyaring yang sudah padat. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Saring jalur penurunan"
          className="inline-flex rounded-xl border border-border bg-surface p-1"
        >
          {([
            ['SEMUA', 'Semua jalur', peringatan.length],
            ['DPK_KE_KL', LABEL_JALUR.DPK_KE_KL, peringatan.filter(p => p.jalur === 'DPK_KE_KL').length],
            ['L_KE_DPK', LABEL_JALUR.L_KE_DPK, peringatan.filter(p => p.jalur === 'L_KE_DPK').length],
          ] as const).map(([nilai, label, jumlah]) => {
            const aktif = jalur === nilai;
            return (
              <button
                key={nilai}
                type="button"
                role="tab"
                aria-selected={aktif}
                onClick={() => { setJalur(nilai as any); setBatas(AWAL_DITAMPILKAN); }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  aktif
                    ? 'bg-primary-light text-primary-dark'
                    : 'text-slate-500 hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {label}
                <span className="ml-1.5 tabular-nums opacity-70">{jumlah.toLocaleString('id-ID')}</span>
              </button>
            );
          })}
        </div>
        {jalur !== 'SEMUA' && (
          <p className="text-xs leading-relaxed text-slate-500">{KETERANGAN_JALUR[jalur]}</p>
        )}
      </div>

      <Panel
        judul="Daftar peringatan"
        hitungan={daftar.length}
        padat
        alat={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search" value={cari} onChange={e => { setCari(e.target.value); setBatas(AWAL_DITAMPILKAN); }}
                placeholder="Cari nasabah, rekening, petugas, atau desa"
                aria-label="Cari peringatan"
                className="w-56 rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring lg:w-72"
              />
            </div>
            <select
              value={tingkat} onChange={e => setTingkat(e.target.value as any)}
              aria-label="Saring tingkat"
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="SEMUA">Semua tingkat</option>
              <option value="RED">Perlu perhatian</option>
              <option value="YELLOW">Pantau</option>
            </select>
            <select
              value={kategori} onChange={e => setKategori(e.target.value as any)}
              aria-label="Saring jenis"
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="SEMUA">Semua jenis</option>
              {kategoriTersedia.map(k => (
                <option key={k} value={k}>{LABEL_KATEGORI[k]}</option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600">
              <input
                type="checkbox" checked={sembunyikanSelesai}
                onChange={e => setSembunyikanSelesai(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-primary)]"
              />
              Sembunyikan yang selesai
            </label>
          </>
        }
      >
        {daftar.length === 0 ? (
          adaSaringan || sembunyikanSelesai ? (
            <KosongKarenaSaringan onReset={() => { resetSaringan(); setSembunyikanSelesai(false); }} />
          ) : (
            <Kosong
              icon={ShieldCheck}
              judul="Tidak ada peringatan"
              keterangan="Seluruh rekening kredit lolos pemeriksaan. Peringatan akan muncul sendiri begitu ada rekening yang berhenti membayar, menunggak, atau lewat jatuh tempo."
            />
          )
        ) : (
          <>
            <Table wrapperClassName="border-0 rounded-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Peringatan</TableHead>
                  <TableHead>Petugas</TableHead>
                  <TableHead className="text-right">Baki debet</TableHead>
                  <TableHead className="text-right">Tindak lanjut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftar.slice(0, batas).map(p => {
                  const status = p.tindakLanjut?.status ?? 'TERBUKA';
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="py-3">
                        <NadaPill
                          label={p.tingkat === 'RED' ? 'Perhatian' : 'Pantau'}
                          nada={p.tingkat === 'RED' ? 'danger' : 'warning'}
                        />
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="block font-bold text-foreground">{p.nama}</span>
                        <span className="block text-[10px] tabular-nums text-slate-500">
                          {p.acuan}{p.kelurahan ? ` · ${p.kelurahan}` : ''}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-foreground">{p.judul}</span>
                          {/* Jalurnya ikut ditampilkan saat daftar belum disaring,
                              supaya arah penurunan terbaca tanpa membuka rincian. */}
                          {jalur === 'SEMUA' && (
                            <Badge variant={p.jalur === 'DPK_KE_KL' ? 'danger' : 'warning'}>
                              {LABEL_JALUR[p.jalur]}
                            </Badge>
                          )}
                          <Badge variant="neutral">{LABEL_KATEGORI[p.kategori]}</Badge>
                        </span>
                        <span className="mt-0.5 block max-w-lg text-[11px] leading-snug text-slate-500">
                          {p.keterangan}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-slate-600">
                        {p.petugas ?? '—'}
                        {p.kolektibilitas && (
                          <span className="block text-[10px] text-slate-500">Kol {p.kolektibilitas}</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right font-bold tabular-nums text-foreground">
                        {rupiah(p.bakiDebet)}
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          {status !== 'TERBUKA' && (
                            <span
                              className={cn(
                                'text-[10px] font-bold',
                                status === 'SELESAI' ? 'text-success'
                                  : status === 'DIABAIKAN' ? 'text-slate-400' : 'text-primary',
                              )}
                            >
                              {LABEL_TINDAK_LANJUT[status]}
                            </span>
                          )}
                          <Button variant="secondary" size="sm" onClick={() => setDipilih(p)}>
                            {status === 'TERBUKA' ? 'Tindak lanjuti' : 'Ubah'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {daftar.length > batas && (
              <div className="flex justify-center border-t border-border px-5 py-3">
                <Button variant="ghost" size="sm" onClick={() => setBatas(n => n + 100)}>
                  Tampilkan {Math.min(100, daftar.length - batas).toLocaleString('id-ID')} lagi
                  <span className="ml-1.5 text-slate-400">
                    ({batas.toLocaleString('id-ID')} dari {daftar.length.toLocaleString('id-ID')})
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>

      {/* Keterbukaan soal apa yang tidak bisa diperiksa. */}
      {diagnostik && (
        <details className="rounded-2xl border border-border bg-surface px-5 py-3.5 shadow-sm">
          <summary className="cursor-pointer text-xs font-bold text-foreground">
            Dasar perhitungan
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 text-[11px] sm:grid-cols-2">
            {[
              ['Seluruh rekening kredit', Number(diagnostik.totalPinjaman).toLocaleString('id-ID')],
              ['Golongan Lancar dipantau', `${Number(diagnostik.rekeningLancar).toLocaleString('id-ID')} rekening`],
              ['Golongan DPK dipantau', `${Number(diagnostik.rekeningDpk).toLocaleString('id-ID')} rekening`],
              ['Di luar lingkup karena sudah NPL', `${Number(diagnostik.dilewatiKarenaNpl).toLocaleString('id-ID')} rekening, ditangani Collection & Recovery`],
              ['Golongan tidak terbaca', `${Number(diagnostik.dilewatiKarenaGolonganTidakDikenal).toLocaleString('id-ID')} rekening`],
              ['Tanpa jadwal angsuran', `${Number(diagnostik.tanpaJadwalAngsuran).toLocaleString('id-ID')} rekening, aturan perilaku bayar dilewati`],
              ['Tanpa tanggal jatuh tempo', `${Number(diagnostik.tanpaTanggalJatuhTempo).toLocaleString('id-ID')} rekening`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex items-baseline justify-between gap-3 border-b border-border py-1">
                <span className="text-slate-500">{k}</span>
                <span className="text-right font-bold tabular-nums text-foreground">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Ambang batas yang dipakai: rekening Lancar ditandai sejak tunggakan pertama,
            rekening DPK ditandai mulai FT {(diagnostik.ambang?.FT_AMBANG_KL ?? 3) - 1} karena
            ambang Kurang Lancar ada di FT {diagnostik.ambang?.FT_AMBANG_KL}, setoran di bawah{' '}
            {Math.round((diagnostik.ambang?.BAYAR_CUKUP ?? 0) * 100)}% dari jadwal dihitung sebagai
            kurang bayar, dan kredit {rupiahRingkas(diagnostik.ambang?.NOMINAL_BESAR)} ke atas
            dinaikkan satu tingkat perhatian. Angka ini mengikuti praktik pengawasan yang lazim,
            bukan ketetapan OJK, dan dapat disesuaikan dengan kebijakan internal.
          </p>
          {diagnostik.catatanLingkup && (
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{diagnostik.catatanLingkup}</p>
          )}
        </details>
      )}

      <LembarTindakLanjut
        peringatan={dipilih}
        onTutup={() => setDipilih(null)}
        onSimpan={simpanTindakLanjut}
      />
    </PageContainer>
  );
};

/* --------------------------------------------------------- tindak lanjut */

const LembarTindakLanjut: React.FC<{
  peringatan: PeringatanEws | null;
  onTutup: () => void;
  onSimpan: (id: string, status: string, catatan?: string) => Promise<void>;
}> = ({ peringatan, onTutup, onSimpan }) => {
  const [status, setStatus] = useState('DITINDAKLANJUTI');
  const [catatan, setCatatan] = useState('');
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  // Selaraskan isian dengan peringatan yang baru dibuka.
  const [idTerakhir, setIdTerakhir] = useState<string | null>(null);
  if (peringatan && peringatan.id !== idTerakhir) {
    setIdTerakhir(peringatan.id);
    setStatus(peringatan.tindakLanjut?.status ?? 'DITINDAKLANJUTI');
    setCatatan(peringatan.tindakLanjut?.catatan ?? '');
    setGalat(null);
  }

  const simpan = async () => {
    if (!peringatan) return;
    setMemproses(true);
    setGalat(null);
    try {
      await onSimpan(peringatan.id, status, catatan.trim() || undefined);
      onTutup();
    } catch (e: any) {
      setGalat(e?.message ?? 'Gagal menyimpan');
    } finally {
      setMemproses(false);
    }
  };

  return (
    <Modal
      isOpen={peringatan !== null}
      onClose={onTutup}
      title="Tindak lanjut peringatan"
      description={peringatan ? `${peringatan.nama} · ${peringatan.judul}` : undefined}
    >
      {peringatan && (
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-muted px-3.5 py-3">
            <p className="text-[11px] leading-relaxed text-foreground">{peringatan.keterangan}</p>
            <p className="mt-2 text-[10px] tabular-nums text-slate-500">
              Kode {peringatan.kode}
              {peringatan.petugas && ` · Petugas ${peringatan.petugas}`}
              {peringatan.wilayah && ` · ${peringatan.wilayah}`}
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Status</legend>
            <div className="grid grid-cols-2 gap-2">
              {PILIHAN_TINDAK_LANJUT.map(s => {
                const aktif = status === s;
                return (
                  <button
                    key={s} type="button" aria-pressed={aktif}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      aktif ? 'border-primary bg-primary-light text-primary-dark'
                            : 'border-border bg-surface text-foreground hover:bg-surface-muted',
                    )}
                  >
                    {LABEL_TINDAK_LANJUT[s]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="ews-catatan" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Catatan
            </label>
            <textarea
              id="ews-catatan" rows={3} value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Apa yang sudah dilakukan, dan apa langkah berikutnya."
              className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {galat && (
            <p className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-[11px] font-bold text-danger">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> {galat}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onTutup}>Batal</Button>
            <Button onClick={simpan} loading={memproses}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Simpan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
