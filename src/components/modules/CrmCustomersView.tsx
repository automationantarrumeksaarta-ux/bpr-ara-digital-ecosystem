import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HandCoins, Info, PiggyBank, RefreshCw, Search, UserRound, Users,
} from 'lucide-react';
import { PageContainer } from '../ui/PageContainer';
import { DeretAngka } from '../credit/StageShell';
import {
  BarisAntrean, BelumAdaPilihan, Kosong, KosongKarenaSaringan, KolPill, NadaPill, Panel, StageWorkbench,
} from '../credit/StageParts';
import { rupiah, rupiahRingkas, tanggalPendek } from '../credit/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

/**
 * CRM Nasabah.
 *
 * Menggantikan Customer 360 yang membaca `INITIAL_CUSTOMERS` — array kosong
 * yang tidak pernah diisi apa pun — sehingga isinya selalu kosong betapa pun
 * banyak data yang sudah diunggah.
 *
 * Fokusnya dipersempit ke pertanyaan yang benar-benar dipakai orang CRM di BPR:
 *
 * - Siapa yang punya kredit tetapi belum menabung? Itu peluang dana murah.
 * - Siapa yang menabung besar tetapi belum pernah mengambil kredit? Itu calon
 *   debitur yang riwayatnya sudah kita kenal.
 * - Siapa yang sedang bermasalah, dan siapa petugas yang memegangnya?
 *
 * Tiga pertanyaan itu yang menentukan susunan halaman ini, bukan daftar atribut
 * nasabah yang panjang.
 */

type Hubungan = 'kredit' | 'simpanan' | 'keduanya';
type Saring = 'SEMUA' | Hubungan | 'BERMASALAH';

interface Nasabah {
  kunci: string;
  nama: string;
  cif: string | null;
  ao: string | null;
  wilayah: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  alamat: string | null;
  jumlahKredit: number;
  bakiDebet: number;
  tunggakan: number;
  kolektibilitasTerburuk: string | null;
  bermasalah: boolean;
  jumlahTabungan: number;
  saldoTabungan: number;
  jumlahDeposito: number;
  saldoDeposito: number;
  hubungan: Hubungan;
}

const LABEL_HUBUNGAN: Record<Hubungan, { label: string; nada: 'info' | 'success' | 'neutral' }> = {
  kredit: { label: 'Kredit saja', nada: 'info' },
  simpanan: { label: 'Simpanan saja', nada: 'success' },
  keduanya: { label: 'Kredit & simpanan', nada: 'neutral' },
};

export const CrmCustomersView: React.FC = () => {
  const [data, setData] = useState<Nasabah[]>([]);
  const [ringkas, setRingkas] = useState<any>(null);
  const [diagnostik, setDiagnostik] = useState<any>(null);
  const [tersedia, setTersedia] = useState(true);
  const [alasan, setAlasan] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [cari, setCari] = useState('');
  const [saring, setSaring] = useState<Saring>('SEMUA');
  const [terpilih, setTerpilih] = useState<string>('');
  const [pemicu, setPemicu] = useState(0);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      const res = await fetch('/api/crm/nasabah', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Gagal memuat nasabah');
      setTersedia(!!json.tersedia);
      setAlasan(json.alasan ?? null);
      setData(json.data ?? []);
      setRingkas(json.ringkas ?? null);
      setDiagnostik(json.diagnostik ?? null);
    } catch (e: any) {
      setGalat(e?.message ?? 'Terjadi kesalahan');
      setData([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat, pemicu]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return data.filter(n => {
      const cocokCari = q === '' ||
        n.nama.toLowerCase().includes(q) ||
        (n.ao ?? '').toLowerCase().includes(q) ||
        (n.kelurahan ?? '').toLowerCase().includes(q) ||
        (n.cif ?? '').toLowerCase().includes(q);
      const cocokSaring =
        saring === 'SEMUA' ? true :
        saring === 'BERMASALAH' ? n.bermasalah :
        n.hubungan === saring;
      return cocokCari && cocokSaring;
    });
  }, [data, cari, saring]);

  useEffect(() => {
    if (daftar.length === 0) { if (terpilih) setTerpilih(''); return; }
    if (!daftar.some(n => n.kunci === terpilih)) setTerpilih(daftar[0].kunci);
  }, [daftar, terpilih]);

  const aktif = data.find(n => n.kunci === terpilih) ?? null;
  const adaSaringan = cari.trim() !== '' || saring !== 'SEMUA';

  const kelasIsian =
    'rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground ' +
    'outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

  if (memuat && data.length === 0) {
    return (
      <PageContainer>
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />
      </PageContainer>
    );
  }

  if (galat || !tersedia) {
    return (
      <PageContainer>
        <header>
          <h1 className="text-xl font-bold tracking-tight text-foreground">CRM Nasabah</h1>
        </header>
        <Panel>
          <Kosong
            icon={Users}
            judul={galat ? 'Data nasabah tidak dapat dimuat' : 'Belum ada data nasabah'}
            keterangan={galat ?? alasan ?? 'Unggah berkas nominatif lewat menu Data Center.'}
            aksi={<Button onClick={() => setPemicu(n => n + 1)}>Coba lagi</Button>}
          />
        </Panel>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">CRM Nasabah</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Satu nasabah dirangkum dari seluruh produk yang dimilikinya, supaya terlihat siapa yang
            perlu ditawari simpanan, siapa yang layak ditawari kredit, dan siapa yang perlu ditagih.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setPemicu(n => n + 1)}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', memuat && 'animate-spin')} /> Muat ulang
        </Button>
      </header>

      {ringkas && (
        <DeretAngka
          angka={[
            { label: 'Total nasabah', nilai: ringkas.totalNasabah.toLocaleString('id-ID'), konteks: 'Dari seluruh produk' },
            {
              label: 'Kredit tanpa simpanan',
              nilai: ringkas.hanyaKredit.toLocaleString('id-ID'),
              konteks: 'Peluang dana murah',
              nada: ringkas.hanyaKredit > 0 ? 'warning' : 'default',
            },
            {
              label: 'Simpanan tanpa kredit',
              nilai: ringkas.hanyaSimpanan.toLocaleString('id-ID'),
              konteks: 'Calon debitur yang sudah dikenal',
            },
            {
              label: 'Bermasalah',
              nilai: ringkas.bermasalah.toLocaleString('id-ID'),
              konteks: `Baki debet ${rupiahRingkas(ringkas.totalBakiDebet)}`,
              nada: ringkas.bermasalah > 0 ? 'danger' : 'default',
            },
          ]}
        />
      )}

      {/* Keterbatasan pencocokan disebut di muka, bukan disembunyikan. */}
      {diagnostik?.catatanPencocokan && (diagnostik.barisTabungan > 0 || diagnostik.barisDeposito > 0) && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
          <p className="text-[11px] leading-relaxed text-slate-500">{diagnostik.catatanPencocokan}</p>
        </div>
      )}

      <StageWorkbench
        judulAntrean="Daftar nasabah"
        jumlah={daftar.length}
        antrean={
          daftar.length === 0 ? (
            adaSaringan
              ? <KosongKarenaSaringan rapat onReset={() => { setCari(''); setSaring('SEMUA'); }} />
              : <Kosong rapat icon={Users} judul="Belum ada nasabah" keterangan="Unggah berkas nominatif lewat Data Center." />
          ) : (
            daftar.slice(0, 200).map(n => (
              <BarisAntrean
                key={n.kunci}
                terpilih={terpilih === n.kunci}
                onClick={() => setTerpilih(n.kunci)}
                utama={n.nama}
                kedua={`${rupiahRingkas(n.bakiDebet + n.saldoTabungan + n.saldoDeposito)}${n.ao ? ` · ${n.ao}` : ''}`}
                kanan={
                  n.bermasalah
                    ? <KolPill kol={n.kolektibilitasTerburuk ?? undefined} />
                    : <NadaPill {...LABEL_HUBUNGAN[n.hubungan]} />
                }
              />
            ))
          )
        }
      >
        {!aktif ? (
          <BelumAdaPilihan
            icon={UserRound}
            judul="Pilih nasabah untuk melihat rinciannya"
            keterangan="Klik salah satu nama di sebelah kiri. Seluruh rekening kredit dan simpanannya akan terbuka di sini."
            antreanKosong={daftar.length === 0}
          />
        ) : (
          <DetailNasabah nasabah={aktif} />
        )}
      </StageWorkbench>

      <Panel judul="Saring daftar">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search" value={cari} onChange={e => setCari(e.target.value)}
              placeholder="Cari nama, petugas, desa, atau nomor rekening"
              aria-label="Cari nasabah"
              className={cn(kelasIsian, 'w-72 pl-9')}
            />
          </div>
          <select
            value={saring} onChange={e => setSaring(e.target.value as Saring)}
            aria-label="Saring hubungan" className={cn(kelasIsian, 'cursor-pointer')}
          >
            <option value="SEMUA">Semua nasabah</option>
            <option value="kredit">Kredit tanpa simpanan</option>
            <option value="simpanan">Simpanan tanpa kredit</option>
            <option value="keduanya">Kredit & simpanan</option>
            <option value="BERMASALAH">Sedang bermasalah</option>
          </select>
          {daftar.length > 200 && (
            <span className="text-[11px] text-slate-500">
              Menampilkan 200 teratas dari {daftar.length.toLocaleString('id-ID')}. Persempit dengan pencarian.
            </span>
          )}
        </div>
      </Panel>
    </PageContainer>
  );
};

/* ------------------------------------------------------------------ detail */

const DetailNasabah: React.FC<{ nasabah: Nasabah }> = ({ nasabah }) => {
  const [rinci, setRinci] = useState<any>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      try {
        const res = await fetch(`/api/crm/nasabah/${encodeURIComponent(nasabah.kunci)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const json = await res.json();
        if (!batal) setRinci(res.ok ? json : null);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, [nasabah.kunci]);

  const h = LABEL_HUBUNGAN[nasabah.hubungan];

  return (
    <div className="space-y-5">
      <Panel
        judul={nasabah.nama}
        alat={
          nasabah.bermasalah
            ? <KolPill kol={nasabah.kolektibilitasTerburuk ?? undefined} />
            : <NadaPill {...h} />
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Petugas', nilai: nasabah.ao ?? '—' },
            { label: 'Wilayah', nilai: [nasabah.kelurahan, nasabah.kecamatan].filter(Boolean).join(', ') || nasabah.wilayah || '—' },
            { label: 'Baki debet', nilai: rupiah(nasabah.bakiDebet) },
            { label: 'Simpanan', nilai: rupiah(nasabah.saldoTabungan + nasabah.saldoDeposito) },
          ].map(k => (
            <div key={k.label} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{k.label}</p>
              <p className="mt-1 truncate text-xs font-bold tabular-nums text-foreground">{k.nilai}</p>
            </div>
          ))}
        </div>

        {nasabah.alamat && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{nasabah.alamat}</p>
        )}

        {/*
          Saran tindakan diturunkan dari keadaan nasabahnya, bukan ditulis tetap.
          Inilah alasan halaman ini ada: memberi tahu apa yang sebaiknya
          dilakukan, bukan sekadar memajang atribut.
        */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-primary-light px-3.5 py-3">
          <HandCoins className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-primary-dark">
            {nasabah.bermasalah
              ? `Kredit bermasalah dengan tunggakan ${rupiah(nasabah.tunggakan)}. Dahulukan penagihan dan tawarkan penjadwalan ulang bila usahanya masih berjalan.`
              : nasabah.hubungan === 'kredit'
                ? 'Nasabah kredit yang belum menabung di sini. Tawarkan rekening tabungan untuk pembayaran angsuran otomatis — sekaligus menambah dana murah.'
                : nasabah.hubungan === 'simpanan'
                  ? 'Penyimpan yang belum pernah mengambil kredit. Riwayat transaksinya sudah dikenal, jadi penilaiannya lebih mudah bila ada kebutuhan pembiayaan.'
                  : 'Sudah memakai kredit dan simpanan. Jaga hubungannya, dan tinjau apakah plafonnya masih sesuai kebutuhan usahanya.'}
          </p>
        </div>
      </Panel>

      {memuat ? (
        <Panel><div className="h-24 animate-pulse rounded-xl bg-surface-muted" /></Panel>
      ) : (
        <>
          <Panel judul="Rekening kredit" hitungan={rinci?.kredit?.length ?? 0} padat>
            {!rinci?.kredit?.length ? (
              <Kosong rapat icon={HandCoins} judul="Tidak ada rekening kredit" />
            ) : (
              <Table wrapperClassName="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Rekening</TableHead>
                    <TableHead className="text-right">Plafon</TableHead>
                    <TableHead className="text-right">Baki debet</TableHead>
                    <TableHead className="text-right">Tunggakan</TableHead>
                    <TableHead>Kolektibilitas</TableHead>
                    <TableHead className="text-right">Jatuh tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rinci.kredit.map((k: any) => (
                    <TableRow key={k.account_number}>
                      <TableCell className="py-2.5 font-bold tabular-nums text-foreground">
                        {k.account_number}
                        {k.ikatan && <span className="block text-[10px] font-normal text-slate-500">{k.ikatan}</span>}
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums text-slate-600">{rupiah(k.limit_amount)}</TableCell>
                      <TableCell className="py-2.5 text-right font-bold tabular-nums text-foreground">{rupiah(k.outstanding)}</TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums text-slate-600">
                        {rupiah((k.tunggakan_pokok ?? 0) + (k.tunggakan_bunga ?? 0))}
                        {k.frek_tunggakan > 0 && (
                          <span className="block text-[10px] text-danger">{k.frek_tunggakan}x tertunggak</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5"><KolPill kol={k.collectibility} /></TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums text-slate-600">
                        {tanggalPendek(k.tanggal_jatuh_tempo)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>

          <Panel judul="Simpanan" hitungan={(rinci?.tabungan?.length ?? 0) + (rinci?.deposito?.length ?? 0)} padat>
            {!(rinci?.tabungan?.length || rinci?.deposito?.length) ? (
              <Kosong
                rapat
                icon={PiggyBank}
                judul="Belum ada rekening simpanan"
                keterangan="Bila nasabah ini sebenarnya menabung, pastikan berkas nominatif tabungan dan deposito sudah diunggah lewat Data Center."
              />
            ) : (
              <Table wrapperClassName="border-0 rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Rekening</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(rinci.tabungan ?? []).map((t: any) => ({ ...t, jenis: 'Tabungan' })),
                    ...(rinci.deposito ?? []).map((d: any) => ({ ...d, jenis: 'Deposito' }))]
                    .map((s: any) => (
                      <TableRow key={`${s.jenis}-${s.account_number}`}>
                        <TableCell className="py-2.5 font-bold tabular-nums text-foreground">{s.account_number}</TableCell>
                        <TableCell className="py-2.5 text-slate-600">{s.jenis}</TableCell>
                        <TableCell className="py-2.5 text-right font-bold tabular-nums text-foreground">{rupiah(s.balance)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </>
      )}
    </div>
  );
};
