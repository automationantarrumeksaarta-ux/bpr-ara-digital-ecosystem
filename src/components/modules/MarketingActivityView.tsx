import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Download, MapPin, RefreshCw, Search, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../ui/PageContainer';
import { DeretAngka } from '../credit/StageShell';
import { Kosong, KosongKarenaSaringan, Panel } from '../credit/StageParts';
import { tanggalPendek } from '../credit/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { alamatBerkas } from '../../utils/api';

/**
 * Rekap Aktivitas Lapangan.
 *
 * Halaman ini sebelumnya hanya kerangka: `const [activities] = useState([])`
 * yang tidak pernah diisi apa pun, sehingga isinya selalu kosong berapa pun
 * kunjungan yang sudah dicatat pegawai.
 *
 * Sekarang membaca tabel `activities` — yaitu yang dicatat lewat menu Aktivitas
 * di aplikasi lapangan, lengkap dengan foto, titik lokasi, dan keterangannya.
 *
 * Cakupan ditentukan server, bukan layar ini:
 * - Setiap orang selalu boleh melihat aktivitasnya sendiri.
 * - Atasan boleh melihat aktivitas bawahannya, berjenjang.
 * - Hanya peran tertentu yang boleh membaca seluruh karyawan; bila tidak
 *   berwenang, pilihan itu tidak ditampilkan.
 */

type Lingkup = 'saya' | 'tim' | 'semua';

interface Aktivitas {
  id: string;
  user_id: string;
  user_name: string | null;
  date: string;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  location: string | null;
  description: string | null;
  created_at: string;
}

const awalBulan = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const hariIni = () => new Date().toISOString().slice(0, 10);

export const MarketingActivityView: React.FC = () => {
  const { currentUser } = useApp() as any;

  const [lingkup, setLingkup] = useState<Lingkup>('saya');
  const [dari, setDari] = useState(awalBulan());
  const [sampai, setSampai] = useState(hariIni());
  const [cari, setCari] = useState('');
  const [data, setData] = useState<Aktivitas[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [bolehSemua, setBolehSemua] = useState(false);
  const [lihatFoto, setLihatFoto] = useState<Aktivitas | null>(null);
  const [pemicu, setPemicu] = useState(0);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      setGalat(null);
      try {
        const q = new URLSearchParams({ lingkup, dari, sampai });
        const res = await fetch(`/api/activities?${q}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const json = await res.json();
        if (batal) return;
        if (!res.ok) throw new Error(json?.error ?? 'Gagal memuat aktivitas');
        setData(json.data ?? []);
        setBolehSemua(!!json.bolehLihatSemua);
      } catch (e: any) {
        if (!batal) { setGalat(e?.message ?? 'Terjadi kesalahan'); setData([]); }
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, [lingkup, dari, sampai, pemicu]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return data;
    return data.filter(a =>
      (a.user_name ?? '').toLowerCase().includes(q) ||
      (a.location ?? '').toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q));
  }, [data, cari]);

  const pegawaiUnik = new Set(daftar.map(a => a.user_id)).size;
  const hariUnik = new Set(daftar.map(a => a.date)).size;
  const berfoto = daftar.filter(a => !!a.photo_url).length;

  /**
   * Unduh sebagai CSV.
   *
   * Foto sengaja TIDAK ikut — isinya data URL sepanjang puluhan ribu karakter
   * per baris, yang akan membuat berkasnya membengkak dan tidak terbaca di
   * Excel. Yang ikut adalah kolom yang memang dipakai merekap.
   */
  const unduh = () => {
    const kepala = ['Tanggal', 'Pegawai', 'Lokasi', 'Lintang', 'Bujur', 'Keterangan', 'Dicatat pada'];
    const baris = daftar.map(a => [
      a.date, a.user_name ?? '', a.location ?? '',
      a.lat ?? '', a.lng ?? '', a.description ?? '', a.created_at,
    ]);
    const csv = [kepala, ...baris]
      .map(r => r.map(sel => {
        const t = String(sel ?? '');
        // Tanda kutip digandakan; sel yang memuat pemisah dibungkus kutip.
        return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
      }).join(';'))
      .join('\r\n');

    // BOM supaya Excel membaca huruf beraksen dengan benar.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aktivitas-lapangan-${dari}-sd-${sampai}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isian =
    'rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground ' +
    'outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <PageContainer>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Rekap Aktivitas Lapangan</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Kunjungan yang dicatat pegawai lewat menu Aktivitas di aplikasi, lengkap dengan foto dan
            titik lokasinya.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setPemicu(n => n + 1)}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${memuat ? 'animate-spin' : ''}`} /> Muat ulang
          </Button>
          <Button onClick={unduh} disabled={daftar.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Unduh CSV
          </Button>
        </div>
      </header>

      <DeretAngka
        angka={[
          { label: 'Aktivitas', nilai: daftar.length.toLocaleString('id-ID'), konteks: `${dari} s.d. ${sampai}` },
          { label: 'Pegawai', nilai: pegawaiUnik.toLocaleString('id-ID'), konteks: 'Yang mencatat kunjungan' },
          { label: 'Hari aktif', nilai: hariUnik.toLocaleString('id-ID'), konteks: 'Hari dengan catatan' },
          {
            label: 'Berfoto',
            nilai: berfoto.toLocaleString('id-ID'),
            konteks: daftar.length ? `${Math.round((berfoto / daftar.length) * 100)}% dari seluruh catatan` : 'Belum ada catatan',
          },
        ]}
      />

      <Panel
        judul="Daftar aktivitas"
        hitungan={daftar.length}
        padat
        alat={
          <>
            <select
              value={lingkup} onChange={e => setLingkup(e.target.value as Lingkup)}
              aria-label="Cakupan data" className={`${isian} cursor-pointer`}
            >
              <option value="saya">Aktivitas saya</option>
              <option value="tim">Saya dan bawahan</option>
              {/* Pilihan seluruh karyawan hanya muncul bila memang berwenang. */}
              {bolehSemua && <option value="semua">Seluruh karyawan</option>}
            </select>
            <input type="date" value={dari} onChange={e => setDari(e.target.value)}
              aria-label="Tanggal mulai" className={isian} />
            <input type="date" value={sampai} onChange={e => setSampai(e.target.value)}
              aria-label="Tanggal akhir" className={isian} />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search" value={cari} onChange={e => setCari(e.target.value)}
                placeholder="Cari pegawai, lokasi, keterangan"
                aria-label="Cari aktivitas"
                className={`${isian} w-52 pl-9`}
              />
            </div>
          </>
        }
      >
        {memuat ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-muted" />)}
          </div>
        ) : galat ? (
          <Kosong
            icon={Users}
            judul="Aktivitas tidak dapat dimuat"
            keterangan={galat}
            aksi={<Button onClick={() => setPemicu(n => n + 1)}>Coba lagi</Button>}
          />
        ) : daftar.length === 0 ? (
          cari ? (
            <KosongKarenaSaringan onReset={() => setCari('')} />
          ) : (
            <Kosong
              icon={Camera}
              judul="Belum ada aktivitas tercatat"
              keterangan={
                lingkup === 'saya'
                  ? 'Catat kunjungan lewat menu Aktivitas di aplikasi. Foto dan titik lokasinya akan muncul di sini.'
                  : 'Belum ada catatan kunjungan pada rentang tanggal ini.'
              }
            />
          )
        ) : (
          <Table wrapperClassName="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Pegawai</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daftar.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="py-2.5">
                    {a.photo_url ? (
                      <button
                        type="button"
                        onClick={() => setLihatFoto(a)}
                        className="block h-11 w-11 overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <img src={alamatBerkas(a.photo_url)} alt="Foto kunjungan" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted">
                        <Camera className="h-4 w-4 text-muted" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 font-bold text-foreground">
                    {a.user_name ?? '—'}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="block max-w-[16rem] truncate text-slate-600">{a.location ?? '—'}</span>
                    {a.lat != null && a.lng != null && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`}
                        target="_blank" rel="noreferrer"
                        className="mt-0.5 flex items-center gap-1 text-[10px] tabular-nums text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        {Number(a.lat).toFixed(5)}, {Number(a.lng).toFixed(5)}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="block max-w-[22rem] text-slate-600">{a.description ?? '—'}</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums text-slate-600">
                    {tanggalPendek(a.date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Modal
        isOpen={lihatFoto !== null}
        onClose={() => setLihatFoto(null)}
        title={lihatFoto?.user_name ?? 'Foto kunjungan'}
        description={lihatFoto ? `${tanggalPendek(lihatFoto.date)} · ${lihatFoto.location ?? 'lokasi tidak tercatat'}` : undefined}
      >
        {lihatFoto?.photo_url && (
          <div className="space-y-3">
            <img src={alamatBerkas(lihatFoto.photo_url)} alt="Foto kunjungan" className="w-full rounded-xl" />
            {lihatFoto.description && (
              <p className="text-xs leading-relaxed text-foreground">{lihatFoto.description}</p>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};
