import React, { useMemo, useState } from 'react';
import { AlertTriangle, AlertTriangle as ExclamationTriangleIcon, BarChart3 as ChartBarIcon, Briefcase as BriefcaseIcon, Building2, CalendarRange, Coins as BanknotesIcon, FileText as DocumentTextIcon, Landmark, MapPin as MapPinIcon, Percent as PercentIcon, TrendingUp as ArrowTrendingUpIcon, UserRound, Users as UserGroupIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SurakartaHeatMap, RISK_STOPS, riskColor, type TitikPeta } from './kepatuhan/SurakartaHeatMap';
import { TITIK_KELURAHAN } from '../../data/geo/kelurahanPoints';
import { KARESIDENAN_SURAKARTA } from '../../data/geo/surakartaMap';
import {
  KECAMATAN_PER_WILAYAH,
  PERIODE_OPTIONS,
  CABANG_OPTIONS,
  TREN_PERIODE_SEBELUMNYA,
  type WilayahId,
} from '../../data/kepatuhan/heatMapData';
import { useKepatuhanHeatMap } from '../../hooks/useKepatuhanHeatMap';

// ---------------------------------------------------------------- helpers

const NAMA_WILAYAH: Record<WilayahId, string> = KARESIDENAN_SURAKARTA.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.name }),
  {} as Record<WilayahId, string>,
);

const pct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

/** "2026-06-30" -> "Jun 2026" */
const periodeSingkat = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
};

const rupiahPenuh = (v: number) =>
  `Rp ${v.toLocaleString('id-ID')}`;

/** Rp 18,7 M / Rp 1,2 T — untuk tabel yang sempit. */
const rupiahRingkas = (v: number) => {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1).replace('.', ',')} T`;
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1).replace('.', ',')} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1).replace('.', ',')} Jt`;
  return rupiahPenuh(v);
};

const KOLEK_STYLE: Record<string, string> = {
  L: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DPK: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
  KL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  M: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

// ---------------------------------------------------------------- sub-komponen

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  icon: React.ElementType;
  onChange: (value: string) => void;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, value, options, icon: Icon, onChange }) => (
  <label className="relative flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors cursor-pointer">
    <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    <span className="flex flex-col items-start leading-none min-w-0">
      <span className="text-[9px] text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[140px]">{value}</span>
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

const Legend: React.FC = () => (
  <div className="flex items-center justify-center gap-3 text-[9px] font-bold text-gray-500 mb-3 flex-wrap">
    {RISK_STOPS.map(s => (
      <span key={s.label} className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
        {s.label}
      </span>
    ))}
  </div>
);

const Panel: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, iconClass, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 flex flex-col">
    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconClass}`} />
      {title}
    </h3>
    <p className="text-[10px] text-gray-500 mt-1 mb-4">{subtitle}</p>
    {children}
  </div>
);

// ---------------------------------------------------------------- dashboard

type TabId = 'nasabah' | 'wilayah' | 'ao' | 'sektor' | 'tujuan';

const TABS: { id: TabId; label: string }[] = [
  { id: 'nasabah', label: 'Daftar Nasabah Bermasalah' },
  { id: 'wilayah', label: 'Detail per Wilayah' },
  { id: 'ao', label: 'Detail per AO' },
  { id: 'sektor', label: 'Detail per Sektor' },
  { id: 'tujuan', label: 'Detail per Tujuan' },
];

export const DashboardHeatMap: React.FC = () => {
  const { openCustomer360 } = useApp();
  const { data, sumber, memuat, catatan, diagnostik, resmi } = useKepatuhanHeatMap();

  const {
    portofolioWilayah: PORTOFOLIO_WILAYAH,
    portofolioKelurahan: PORTOFOLIO_KELURAHAN,
    portofolioAO: PORTOFOLIO_AO,
    nasabahBermasalah: NASABAH_BERMASALAH,
    rasioSektor: RASIO_SEKTOR,
    rasioTujuan: RASIO_TUJUAN,
    sektorPerWilayah: SEKTOR_PER_WILAYAH,
    tujuanPerWilayah: TUJUAN_PER_WILAYAH,
    totalPembiayaan: TOTAL_PEMBIAYAAN,
  } = data;

  const [activeTab, setActiveTab] = useState<TabId>('nasabah');
  const [periode, setPeriode] = useState<string>(PERIODE_OPTIONS[0]);
  const [cabang, setCabang] = useState<string>(CABANG_OPTIONS[0]);
  const [aoFilter, setAoFilter] = useState<string>('Semua AO');
  const [wilayahFilter, setWilayahFilter] = useState<WilayahId | null>(null);
  const [kecamatanFilter, setKecamatanFilter] = useState<string>('Semua Kecamatan');
  const [sektorDipilih, setSektorDipilih] = useState<string | null>(null);
  const [tujuanDipilih, setTujuanDipilih] = useState<string | null>(null);
  // Peta wilayah bisa dilihat per kabupaten atau per desa. Desa dijadikan
  // bawaan karena itulah tingkat yang benar-benar membedakan satu tempat
  // dengan tempat lain; per kabupaten semuanya jadi satu rata-rata.
  const [tingkatPeta, setTingkatPeta] = useState<'KABUPATEN' | 'DESA'>('DESA');

  // Kategori aktif menyesuaikan data yang datang; saat sumber berganti dari
  // contoh ke API, pilihan lama bisa saja tidak ada lagi.
  const sektorAktif = (sektorDipilih && RASIO_SEKTOR.some(s => s.sektor === sektorDipilih))
    ? sektorDipilih
    : RASIO_SEKTOR[0]?.sektor ?? '';
  const tujuanAktif = (tujuanDipilih && RASIO_TUJUAN.some(t => t.tujuan === tujuanDipilih))
    ? tujuanDipilih
    : RASIO_TUJUAN[0]?.tujuan ?? '';

  const daftarAo = useMemo(
    () => ['Semua AO', ...PORTOFOLIO_AO.map(a => a.ao).filter(a => a !== 'Lainnya')],
    [PORTOFOLIO_AO],
  );

  const daftarKecamatan = useMemo(
    () => ['Semua Kecamatan', ...(wilayahFilter ? KECAMATAN_PER_WILAYAH[wilayahFilter] : [])],
    [wilayahFilter],
  );

  /** Ganti wilayah -> reset kecamatan supaya tidak menyisakan pilihan dari wilayah lain. */
  const pilihWilayah = (id: string | null) => {
    setWilayahFilter(id as WilayahId | null);
    setKecamatanFilter('Semua Kecamatan');
  };

  // ---- data terfilter ----
  const wilayahTerfilter = useMemo(
    () => PORTOFOLIO_WILAYAH.filter(w => !wilayahFilter || w.wilayah === wilayahFilter),
    [PORTOFOLIO_WILAYAH, wilayahFilter],
  );

  const nasabahTerfilter = useMemo(
    () => NASABAH_BERMASALAH.filter(n =>
      (!wilayahFilter || n.wilayah === wilayahFilter) &&
      (aoFilter === 'Semua AO' || n.ao === aoFilter) &&
      (kecamatanFilter === 'Semua Kecamatan' || n.kecamatan === kecamatanFilter),
    ),
    [NASABAH_BERMASALAH, wilayahFilter, aoFilter, kecamatanFilter],
  );

  // ---- KPI dihitung dari data, bukan angka tetap ----
  const kpi = useMemo(() => {
    const totalNasabah = wilayahTerfilter.reduce((s, w) => s + w.totalNasabah, 0);
    const bakiDebet = wilayahTerfilter.reduce((s, w) => s + w.totalBakiDebet, 0);
    const bermasalah = wilayahTerfilter.reduce((s, w) => s + w.nasabahBermasalah, 0);
    const bakiBermasalah = wilayahTerfilter.reduce((s, w) => s + w.bakiDebetBermasalah, 0);
    const porsi = PORTOFOLIO_WILAYAH.length ? wilayahTerfilter.length / PORTOFOLIO_WILAYAH.length : 1;
    return {
      totalPembiayaan: TOTAL_PEMBIAYAAN * porsi,
      totalNasabah,
      bakiDebet,
      bermasalah,
      // Dua rasio yang berbeda, dan keduanya perlu ditampilkan.
      //
      // NPL yang dilaporkan BPR ke OJK dihitung dari NOMINAL baki debet, bukan
      // dari jumlah nasabah. Pada data Juni 2026 selisihnya besar: 19,91% (
      // nominal) vs 25,76% (jumlah nasabah). Menampilkan angka jumlah nasabah
      // dengan label "Rasio Bermasalah" membuat dashboard kepatuhan
      // bertentangan dengan Laporan Rekap Nominatif Kredit yang resmi.
      nplNominal: bakiDebet ? (bakiBermasalah / bakiDebet) * 100 : 0,
      rasioJumlah: totalNasabah ? (bermasalah / totalNasabah) * 100 : 0,
      bakiBermasalah,
    };
  }, [wilayahTerfilter, PORTOFOLIO_WILAYAH, TOTAL_PEMBIAYAAN]);

  const stats = [
    { label: 'Total Pembiayaan', value: rupiahRingkas(Math.round(kpi.totalPembiayaan)), icon: BanknotesIcon, trend: TREN_PERIODE_SEBELUMNYA.totalPembiayaan, baik: true, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Total Nasabah', value: kpi.totalNasabah.toLocaleString('id-ID'), icon: UserGroupIcon, trend: TREN_PERIODE_SEBELUMNYA.totalNasabah, baik: true, bg: 'bg-indigo-50 dark:bg-indigo-900/20', color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Baki Debet', value: rupiahRingkas(kpi.bakiDebet), icon: DocumentTextIcon, trend: TREN_PERIODE_SEBELUMNYA.bakiDebet, baik: true, bg: 'bg-cyan-50 dark:bg-cyan-900/20', color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Nasabah Bermasalah', value: kpi.bermasalah.toLocaleString('id-ID'), icon: ExclamationTriangleIcon, trend: TREN_PERIODE_SEBELUMNYA.nasabahBermasalah, baik: false, bg: 'bg-red-50 dark:bg-red-900/20', color: 'text-red-600 dark:text-red-400' },
    // NPL yang ditampilkan diambil dari Laporan Rekap Nominatif Kredit bila
    // tersedia — itulah angka yang dilaporkan ke OJK. Hasil hitungan dari
    // nominatif kredit ditaruh sebagai keterangan supaya selisihnya terlihat.
    {
      label: resmi && !wilayahFilter ? 'NPL (Rekap resmi)' : 'NPL (nominal)',
      value: pct(resmi && !wilayahFilter ? resmi.npl : kpi.nplNominal),
      icon: PercentIcon,
      trend: TREN_PERIODE_SEBELUMNYA.rasioBermasalah,
      baik: false,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      color: 'text-amber-600 dark:text-amber-400',
      catatan: resmi && !wilayahFilter
        ? `Rekap ${periodeSingkat(resmi.periode)} · RR ${pct(resmi.rr)}`
        : `${pct(kpi.rasioJumlah)} dari jumlah nasabah`,
    },
    { label: 'Baki Debet Bermasalah', value: rupiahRingkas(kpi.bakiBermasalah), icon: BanknotesIcon, trend: TREN_PERIODE_SEBELUMNYA.bakiDebetBermasalah, baik: false, bg: 'bg-rose-50 dark:bg-rose-900/20', color: 'text-rose-600 dark:text-rose-400' },
  ];

  // ---- nilai pewarna untuk ketiga peta ----
  const rasioWilayah = useMemo(() => {
    const out: Record<string, number> = {};
    for (const w of PORTOFOLIO_WILAYAH) {
      out[w.wilayah] = w.totalNasabah ? (w.nasabahBermasalah / w.totalNasabah) * 100 : 0;
    }
    return out;
  }, [PORTOFOLIO_WILAYAH]);

  /*
   * Titik desa untuk peta wilayah.
   *
   * Peta sebelumnya mewarnai satu kabupaten dengan satu warna, sehingga seluruh
   * perbedaan di dalamnya tertutup rata-rata. Pada data nyata Karanganyar saja
   * berisi lebih dari seratus desa dengan rentang NPL 0% sampai 100%.
   *
   * Desa yang koordinatnya belum ditemukan sengaja tidak digambar, bukan
   * ditaruh di tengah kabupaten: lingkaran merah di lokasi yang salah lebih
   * berbahaya daripada lingkaran yang tidak ada.
   */
  const titikDesa = useMemo<TitikPeta[]>(() => {
    const peta = new Map(
      TITIK_KELURAHAN.map(t => [`${t.kabupaten}|${t.kecamatan}|${t.kelurahan}`.toLowerCase(), t]),
    );
    const hasil: TitikPeta[] = [];
    for (const k of PORTOFOLIO_KELURAHAN) {
      const titik = peta.get(`${k.wilayah}|${k.kecamatan ?? ''}|${k.kelurahan}`.toLowerCase());
      if (!titik) continue;
      hasil.push({
        id: `${k.wilayah}-${k.kecamatan}-${k.kelurahan}`,
        x: titik.x,
        y: titik.y,
        nama: k.kelurahan,
        subJudul: `${k.kecamatan ?? '—'} · ${k.nasabahBermasalah} dari ${k.totalNasabah} nasabah bermasalah`,
        rasio: k.totalBakiDebet > 0 ? (k.bakiDebetBermasalah / k.totalBakiDebet) * 100 : 0,
        bobot: k.totalBakiDebet,
        wilayahId: k.wilayah,
      });
    }
    return hasil;
  }, [PORTOFOLIO_KELURAHAN]);

  const desaTanpaTitik = Math.max(0, PORTOFOLIO_KELURAHAN.length - titikDesa.length);

  const nilaiSektor = useMemo(
    () => (SEKTOR_PER_WILAYAH[sektorAktif] ?? {}) as Record<string, number>,
    [SEKTOR_PER_WILAYAH, sektorAktif],
  );

  const nilaiTujuan = useMemo(
    () => (TUJUAN_PER_WILAYAH[tujuanAktif] ?? {}) as Record<string, number>,
    [TUJUAN_PER_WILAYAH, tujuanAktif],
  );

  const wilayahUrut = useMemo(
    () => [...PORTOFOLIO_WILAYAH].sort((a, b) => rasioWilayah[b.wilayah] - rasioWilayah[a.wilayah]),
    [PORTOFOLIO_WILAYAH, rasioWilayah],
  );

  // ---- risk matrix: kuadran ditentukan dari median, bukan ditulis manual ----
  const kuadran = useMemo(() => {
    const rasios = PORTOFOLIO_WILAYAH.map(w => rasioWilayah[w.wilayah]).sort((a, b) => a - b);
    const nominals = PORTOFOLIO_WILAYAH.map(w => w.bakiDebetBermasalah).sort((a, b) => a - b);
    const median = (arr: number[]) => arr.length % 2
      ? arr[(arr.length - 1) / 2]
      : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
    const mr = median(rasios);
    const mn = median(nominals);

    const bucket = { prioritas: [] as string[], waspada: [] as string[], monitor: [] as string[], sehat: [] as string[] };
    for (const w of PORTOFOLIO_WILAYAH) {
      const rasioTinggi = rasioWilayah[w.wilayah] >= mr;
      const nominalTinggi = w.bakiDebetBermasalah >= mn;
      const nama = NAMA_WILAYAH[w.wilayah];
      if (rasioTinggi && nominalTinggi) bucket.prioritas.push(nama);
      else if (rasioTinggi) bucket.waspada.push(nama);
      else if (nominalTinggi) bucket.monitor.push(nama);
      else bucket.sehat.push(nama);
    }
    return bucket;
  }, [PORTOFOLIO_WILAYAH, rasioWilayah]);

  const judulFilter = wilayahFilter ? NAMA_WILAYAH[wilayahFilter] : 'Karesidenan Surakarta';

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

      {/* ---------- Judul & filter ---------- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
            Dashboard Heat Map &amp; Risiko Pembiayaan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analisis Persebaran Pembiayaan, Nasabah Bermasalah, dan Kontribusi AO — {judulFilter}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Periode" value={periode} options={PERIODE_OPTIONS} icon={CalendarRange} onChange={setPeriode} />
          <FilterSelect label="Cabang" value={cabang} options={CABANG_OPTIONS} icon={Building2} onChange={setCabang} />
          <FilterSelect label="AO" value={aoFilter} options={daftarAo} icon={UserRound} onChange={setAoFilter} />
          <FilterSelect
            label="Kabupaten"
            value={wilayahFilter ? NAMA_WILAYAH[wilayahFilter] : 'Semua Kabupaten'}
            options={['Semua Kabupaten', ...KARESIDENAN_SURAKARTA.map(s => s.name)]}
            icon={Landmark}
            onChange={(name) => {
              const found = KARESIDENAN_SURAKARTA.find(s => s.name === name);
              pilihWilayah(found ? found.id : null);
            }}
          />
          <FilterSelect label="Kecamatan" value={kecamatanFilter} options={daftarKecamatan} icon={MapPinIcon} onChange={setKecamatanFilter} />
        </div>
      </div>

      {/* ---------- Penanda sumber data ---------- */}
      {memuat ? (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 text-xs font-semibold text-slate-500">
          <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Memuat data nominatif kredit…
        </div>
      ) : sumber === 'contoh' ? (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          <span className="font-bold">Data contoh.</span>
          <span>{catatan ?? 'Belum ada data nominatif kredit yang diunggah.'}</span>
          <span className="opacity-80">
            Unggah file nominatif kredit di menu Data Center agar dashboard memakai data sebenarnya.
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-bold">Data nominatif kredit.</span>
          {diagnostik && (
            <>
              <span>{diagnostik.totalBaris.toLocaleString('id-ID')} rekening diproses.</span>
              <span>Bermasalah = kolektibilitas {diagnostik.definisiBermasalah} (NPL OJK).</span>
              {diagnostik.tanpaWilayah > 0 && (
                <span className="text-amber-700 dark:text-amber-400 font-semibold">
                  {diagnostik.tanpaWilayah.toLocaleString('id-ID')} rekening belum terpetakan ke kabupaten
                  dan tidak masuk peta.
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* ---------- Kartu ringkasan ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const naik = stat.trend >= 0;
          const bagus = naik === stat.baik;
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="truncate" title={stat.label}>{stat.label}</span>
              </div>
              <div className="text-base xl:text-lg font-black text-gray-800 dark:text-gray-100 truncate" title={stat.value}>
                {stat.value}
              </div>
              {/*
                Persentase tren berasal dari TREN_PERIODE_SEBELUMNYA — angka
                contoh yang ditulis tetap. Menampilkannya di samping data asli
                membuat angka karangan tampak seperti hasil perhitungan.
                Ditampilkan hanya saat dashboard memang sedang memakai data
                contoh; perbandingan antar periode sungguhan belum dihitung.
              */}
              {sumber === 'contoh' && (
                <div className={`text-[11px] font-bold flex items-center gap-1 min-w-0 ${bagus ? 'text-emerald-500' : 'text-red-500'}`}>
                  <ArrowTrendingUpIcon className={`w-3.5 h-3.5 shrink-0 ${naik ? '' : 'rotate-180'}`} />
                  <span className="truncate">{pct(Math.abs(stat.trend))} dari periode sebelumnya</span>
                </div>
              )}
              {'catatan' in stat && stat.catatan && (
                <div className="text-[10px] text-gray-400 truncate" title={stat.catatan}>
                  {stat.catatan}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Tiga heat map ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Panel
          title="1. Heat Map Wilayah (Rasio Nasabah Bermasalah)"
          subtitle="Sebaran tingkat risiko nasabah bermasalah di wilayah Karesidenan Surakarta"
          icon={MapPinIcon}
          iconClass="text-blue-500"
        >
          <Legend />
          <SurakartaHeatMap
            values={rasioWilayah}
            titikDesa={tingkatPeta === 'DESA' ? titikDesa : undefined}
            formatBobot={(v) => `Baki debet ${rupiahRingkas(v)}`}
            selectedId={wilayahFilter}
            onSelect={pilihWilayah}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Tingkat rincian peta"
              className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 p-0.5"
            >
              {([['KABUPATEN', 'Per kabupaten'], ['DESA', 'Per desa']] as const).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tingkatPeta === id}
                  onClick={() => setTingkatPeta(id)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                    tingkatPeta === id
                      ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {tingkatPeta === 'DESA' && titikDesa.length > 0 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {titikDesa.length} desa dipetakan
                {desaTanpaTitik > 0 && `, ${desaTanpaTitik} belum berkoordinat`}
                {' '}· besar lingkaran = baki debet
              </span>
            )}
          </div>

          {/*
            Bila tingkat desa dipilih tetapi datanya kosong, katakan sebabnya.
            Diam-diam menampilkan "0 desa dipetakan" membuat orang mengira
            fiturnya rusak, padahal yang kurang adalah kolom Kelurahan pada
            data kredit yang sudah terunggah.
          */}
          {tingkatPeta === 'DESA' && titikDesa.length === 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-900/20">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="text-[10px] leading-relaxed text-amber-800 dark:text-amber-300">
                {PORTOFOLIO_KELURAHAN.length === 0 ? (
                  <>
                    Data kredit yang tersimpan belum memuat kolom <strong>Kelurahan</strong>.
                    Kolom itu baru ikut disimpan pada pembaruan terakhir, jadi data yang diunggah
                    sebelumnya tidak memilikinya. Unggah ulang berkas Nominatif Kredit lewat menu
                    Data Center, lalu peta per desa akan terisi sendiri.
                  </>
                ) : (
                  <>
                    {PORTOFOLIO_KELURAHAN.length} desa punya data kredit, tetapi belum satu pun
                    koordinatnya dikenali. Jalankan ulang scripts/build-kelurahan-points.py untuk
                    menambahkan titik desa yang baru.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Rasio Bermasalah per Kabupaten</h4>
            {wilayahUrut.map(w => {
              const rasio = rasioWilayah[w.wilayah];
              const aktif = wilayahFilter === w.wilayah;
              return (
                <button
                  key={w.wilayah}
                  type="button"
                  onClick={() => pilihWilayah(aktif ? null : w.wilayah)}
                  className={`flex items-center justify-between text-xs w-full px-2 py-1 rounded-md transition-colors ${aktif ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: riskColor(rasio) }} />
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{NAMA_WILAYAH[w.wilayah]}</span>
                  </span>
                  <span className="font-bold" style={{ color: riskColor(rasio) }}>{pct(rasio)}</span>
                </button>
              );
            })}
            <p className="text-[10px] text-gray-400 pt-1">Klik wilayah pada peta atau daftar untuk memfilter dashboard.</p>
          </div>
        </Panel>

        <Panel
          title="2. Heat Map Sektor"
          subtitle={`Sebaran rasio nasabah bermasalah sektor ${sektorAktif} per wilayah`}
          icon={BriefcaseIcon}
          iconClass="text-indigo-500"
        >
          <Legend />
          <SurakartaHeatMap values={nilaiSektor} selectedId={wilayahFilter} onSelect={pilihWilayah} />
          <div className="mt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Sektor dengan Risiko Tertinggi</h4>
{/*
              Kolom sektor/tujuan tidak selalu ada di berkas nominatif kredit
              (berkas CBS saat ini tidak memuatnya). Lebih baik dinyatakan
              terus terang daripada menampilkan peta abu-abu tanpa keterangan.
            */}
            {RASIO_SEKTOR.length === 0 && (
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Berkas nominatif kredit yang diunggah tidak memuat kolom
                <span className="font-semibold"> Sektor Usaha</span>, sehingga peta ini belum bisa diisi.
              </p>
            )}
            {RASIO_SEKTOR.map(s => {
              const aktif = sektorAktif === s.sektor;
              return (
                <button
                  key={s.sektor}
                  type="button"
                  onClick={() => setSektorDipilih(s.sektor)}
                  className={`flex items-center justify-between text-xs w-full px-2 py-1 rounded-md transition-colors ${aktif ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px]">{s.icon}</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{s.sektor}</span>
                  </span>
                  <span className="font-bold shrink-0" style={{ color: riskColor(s.rasio) }}>{pct(s.rasio)}</span>
                </button>
              );
            })}
            <p className="text-[10px] text-gray-400 pt-1">Klik sektor untuk mewarnai ulang peta.</p>
          </div>
        </Panel>

        <Panel
          title="3. Heat Map Tujuan Pembiayaan"
          subtitle={`Sebaran rasio nasabah bermasalah tujuan ${tujuanAktif} per wilayah`}
          icon={DocumentTextIcon}
          iconClass="text-cyan-500"
        >
          <Legend />
          <SurakartaHeatMap values={nilaiTujuan} selectedId={wilayahFilter} onSelect={pilihWilayah} />
          <div className="mt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Tujuan dengan Risiko Tertinggi</h4>
{/*
              Kolom sektor/tujuan tidak selalu ada di berkas nominatif kredit
              (berkas CBS saat ini tidak memuatnya). Lebih baik dinyatakan
              terus terang daripada menampilkan peta abu-abu tanpa keterangan.
            */}
            {RASIO_TUJUAN.length === 0 && (
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Berkas nominatif kredit yang diunggah tidak memuat kolom
                <span className="font-semibold"> Tujuan Penggunaan</span>, sehingga peta ini belum bisa diisi.
              </p>
            )}
            {RASIO_TUJUAN.map(t => {
              const aktif = tujuanAktif === t.tujuan;
              return (
                <button
                  key={t.tujuan}
                  type="button"
                  onClick={() => setTujuanDipilih(t.tujuan)}
                  className={`flex items-center justify-between text-xs w-full px-2 py-1 rounded-md transition-colors ${aktif ? 'bg-cyan-50 dark:bg-cyan-900/20 ring-1 ring-cyan-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px]">{t.icon}</span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{t.tujuan}</span>
                  </span>
                  <span className="font-bold shrink-0" style={{ color: riskColor(t.rasio) }}>{pct(t.rasio)}</span>
                </button>
              );
            })}
            <p className="text-[10px] text-gray-400 pt-1">Klik tujuan untuk mewarnai ulang peta.</p>
          </div>
        </Panel>
      </div>

      {/* ---------- Tabel wilayah, ranking AO, risk matrix ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Panel
          title="Heat Map Nasabah Bermasalah per Wilayah"
          subtitle="Semakin merah warna, semakin tinggi rasio nasabah bermasalah"
          icon={MapPinIcon}
          iconClass="text-rose-500"
        >
          <SurakartaHeatMap
            values={rasioWilayah}
            selectedId={wilayahFilter}
            onSelect={pilihWilayah}
            showLabels={false}
          />

          {/* skala gradien */}
          <div className="mt-3 mb-4">
            <div
              className="h-2 w-full rounded-full"
              style={{ background: `linear-gradient(to right, ${RISK_STOPS.map(s => s.color).join(', ')})` }}
            />
            <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1">
              <span>Rendah</span><span>Sangat Tinggi</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="text-[10px] font-bold text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="pb-2">Kabupaten/Kota</th>
                  <th className="pb-2 text-center">Nasabah<br />Bermasalah</th>
                  <th className="pb-2 text-center">Rasio</th>
                  <th className="pb-2 text-right">Baki Debet<br />Bermasalah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {wilayahUrut.map(w => {
                  const rasio = rasioWilayah[w.wilayah];
                  const aktif = wilayahFilter === w.wilayah;
                  return (
                    <tr
                      key={w.wilayah}
                      onClick={() => pilihWilayah(aktif ? null : w.wilayah)}
                      className={`cursor-pointer transition-colors ${aktif ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: riskColor(rasio) }} />
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{NAMA_WILAYAH[w.wilayah]}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-bold" style={{ color: riskColor(rasio) }}>{w.nasabahBermasalah}</td>
                      <td className="py-2.5 text-center font-bold" style={{ color: riskColor(rasio) }}>{pct(rasio)}</td>
                      <td className="py-2.5 text-right font-medium">{rupiahRingkas(w.bakiDebetBermasalah)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Ranking AO (Kontribusi Nasabah Bermasalah)"
          subtitle="Diurutkan dari rasio bermasalah tertinggi"
          icon={DocumentTextIcon}
          iconClass="text-blue-500"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="text-[10px] font-bold text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="pb-2 text-center">#</th>
                  <th className="pb-2">AO</th>
                  <th className="pb-2 text-center">Total</th>
                  <th className="pb-2 text-center">Bermasalah</th>
                  <th className="pb-2">Rasio</th>
                  <th className="pb-2 text-right">Baki Debet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {PORTOFOLIO_AO
                  .map(a => ({ ...a, rasio: (a.nasabahBermasalah / a.totalNasabah) * 100 }))
                  .sort((a, b) => b.rasio - a.rasio)
                  .map((a, i) => {
                    const aktif = aoFilter === a.ao;
                    const bisaDifilter = a.ao !== 'Lainnya';
                    return (
                      <tr
                        key={a.ao}
                        onClick={() => bisaDifilter && setAoFilter(aktif ? 'Semua AO' : a.ao)}
                        className={`transition-colors ${bisaDifilter ? 'cursor-pointer' : ''} ${aktif ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                      >
                        <td className="py-3 text-center">{i + 1}</td>
                        <td className="py-3 font-semibold text-gray-800 dark:text-gray-200">{a.ao}</td>
                        <td className="py-3 text-center">{a.totalNasabah}</td>
                        <td className="py-3 text-center font-bold">{a.nasabahBermasalah}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, a.rasio * 4)}%`, backgroundColor: riskColor(a.rasio) }}
                              />
                            </div>
                            <span className="text-[10px] font-bold">{pct(a.rasio)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-medium">{rupiahRingkas(a.bakiDebetBermasalah)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Risk Matrix (Wilayah × Nominal vs Rasio)"
          subtitle="Kuadran ditentukan dari median rasio dan median nominal bermasalah"
          icon={ChartBarIcon}
          iconClass="text-blue-500"
        >
          <div className="relative w-full aspect-square max-w-[300px] mx-auto mt-6 mb-8 border-l-2 border-b-2 border-gray-300 dark:border-gray-600">
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-gray-500 whitespace-nowrap">
              Rasio Bermasalah
            </div>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 whitespace-nowrap">
              Nominal Bermasalah (Baki Debet)
            </div>
            <div className="absolute -left-2 top-0 text-[9px] text-gray-400 -translate-x-full">Tinggi</div>
            <div className="absolute -left-2 bottom-0 text-[9px] text-gray-400 -translate-x-full">Rendah</div>
            <div className="absolute left-0 -bottom-2 text-[9px] text-gray-400 translate-y-full">Rendah</div>
            <div className="absolute right-0 -bottom-2 text-[9px] text-gray-400 translate-y-full">Tinggi</div>

            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1 p-1">
              {[
                { nama: 'Waspada', isi: kuadran.waspada, cls: 'bg-orange-400/85 hover:bg-orange-500 rounded-tl-lg' },
                { nama: 'Prioritas', isi: kuadran.prioritas, cls: 'bg-rose-500/90 hover:bg-rose-600 rounded-tr-lg' },
                { nama: 'Sehat', isi: kuadran.sehat, cls: 'bg-emerald-400/85 hover:bg-emerald-500 rounded-bl-lg' },
                { nama: 'Monitor', isi: kuadran.monitor, cls: 'bg-amber-400/85 hover:bg-amber-500 rounded-br-lg' },
              ].map(q => (
                <div key={q.nama} className={`flex flex-col items-center justify-center p-2 text-center transition-colors ${q.cls}`}>
                  <span className="text-white font-black text-xs">{q.nama}</span>
                  <span className="text-white/90 font-medium text-[9px] mt-1 leading-tight">
                    {q.isi.length ? q.isi.join(', ') : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* ---------- Tabel rincian ---------- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'nasabah' && (
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="text-[10px] font-bold text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Kabupaten</th>
                  <th className="py-3 px-4">Kecamatan</th>
                  <th className="py-3 px-4">AO</th>
                  <th className="py-3 px-4">Nama Nasabah</th>
                  <th className="py-3 px-4 text-center">Kolek</th>
                  <th className="py-3 px-4 text-right">Baki Debet</th>
                  <th className="py-3 px-4 text-right">Tunggakan</th>
                  <th className="py-3 px-4 text-right">Jumlah Tagihan</th>
                  <th className="py-3 px-4 text-right">Jumlah Angsuran</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {nasabahTerfilter.map((n, i) => (
                  <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4">{NAMA_WILAYAH[n.wilayah]}</td>
                    <td className="py-3 px-4">{n.kecamatan}</td>
                    <td className="py-3 px-4">{n.ao}</td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{n.nama}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${KOLEK_STYLE[n.kolektibilitas]}`}>
                        {n.kolektibilitas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(n.bakiDebet)}</td>
                    <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(n.tunggakan)}</td>
                    <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(n.jumlahTagihan)}</td>
                    <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(n.jumlahAngsuran)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openCustomer360(n.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-colors"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
                {nasabahTerfilter.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-gray-400">
                      Tidak ada nasabah bermasalah pada filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'wilayah' && (
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="text-[10px] font-bold text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Kabupaten/Kota</th>
                  <th className="py-3 px-4 text-center">Total Nasabah</th>
                  <th className="py-3 px-4 text-right">Total Baki Debet</th>
                  <th className="py-3 px-4 text-center">Bermasalah</th>
                  <th className="py-3 px-4 text-center">Rasio</th>
                  <th className="py-3 px-4 text-right">Baki Debet Bermasalah</th>
                  <th className="py-3 px-4 text-center">Tingkat Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {wilayahUrut.map(w => {
                  const rasio = rasioWilayah[w.wilayah];
                  return (
                    <tr key={w.wilayah} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{NAMA_WILAYAH[w.wilayah]}</td>
                      <td className="py-3 px-4 text-center">{w.totalNasabah.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(w.totalBakiDebet)}</td>
                      <td className="py-3 px-4 text-center font-bold">{w.nasabahBermasalah}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: riskColor(rasio) }}>{pct(rasio)}</td>
                      <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(w.bakiDebetBermasalah)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: riskColor(rasio) }}>
                          {(RISK_STOPS.find(s => rasio < s.max) ?? RISK_STOPS[RISK_STOPS.length - 1]).label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'ao' && (
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="text-[10px] font-bold text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Account Officer</th>
                  <th className="py-3 px-4 text-center">Total Nasabah</th>
                  <th className="py-3 px-4 text-center">Nasabah Bermasalah</th>
                  <th className="py-3 px-4 text-center">Rasio</th>
                  <th className="py-3 px-4 text-right">Baki Debet Bermasalah</th>
                  <th className="py-3 px-4 text-right">Rata-rata per Nasabah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {PORTOFOLIO_AO
                  .map(a => ({ ...a, rasio: (a.nasabahBermasalah / a.totalNasabah) * 100 }))
                  .sort((a, b) => b.rasio - a.rasio)
                  .map((a, i) => (
                    <tr key={a.ao} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">{i + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{a.ao}</td>
                      <td className="py-3 px-4 text-center">{a.totalNasabah.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-center font-bold">{a.nasabahBermasalah}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: riskColor(a.rasio) }}>{pct(a.rasio)}</td>
                      <td className="py-3 px-4 text-right font-medium">{rupiahPenuh(a.bakiDebetBermasalah)}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {rupiahPenuh(Math.round(a.bakiDebetBermasalah / a.nasabahBermasalah))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'sektor' && (
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="text-[10px] font-bold text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Sektor Usaha</th>
                  <th className="py-3 px-4 text-center">Rasio Bermasalah</th>
                  <th className="py-3 px-4 text-center">Tingkat Risiko</th>
                  <th className="py-3 px-4">Wilayah Tertinggi</th>
                  <th className="py-3 px-4 text-center">Rasio di Wilayah Tsb.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
    {/*
              Kolom sektor/tujuan tidak selalu ada di berkas nominatif kredit
              (berkas CBS saat ini tidak memuatnya). Lebih baik dinyatakan
              terus terang daripada menampilkan peta abu-abu tanpa keterangan.
            */}
            {RASIO_SEKTOR.length === 0 && (
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Berkas nominatif kredit yang diunggah tidak memuat kolom
                <span className="font-semibold"> Sektor Usaha</span>, sehingga peta ini belum bisa diisi.
              </p>
            )}
            {RASIO_SEKTOR.map(s => {
                  const perWilayah = SEKTOR_PER_WILAYAH[s.sektor] ?? {};
                  const tertinggi = (Object.entries(perWilayah) as [WilayahId, number][])
                    .sort((a, b) => b[1] - a[1])[0];
                  return (
                    <tr key={s.sektor} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{s.icon} {s.sektor}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: riskColor(s.rasio) }}>{pct(s.rasio)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: riskColor(s.rasio) }}>
                          {(RISK_STOPS.find(x => s.rasio < x.max) ?? RISK_STOPS[RISK_STOPS.length - 1]).label}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tertinggi ? NAMA_WILAYAH[tertinggi[0]] : '—'}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: tertinggi ? riskColor(tertinggi[1]) : undefined }}>
                        {tertinggi ? pct(tertinggi[1]) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'tujuan' && (
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <thead className="text-[10px] font-bold text-gray-500 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Tujuan Pembiayaan</th>
                  <th className="py-3 px-4 text-center">Rasio Bermasalah</th>
                  <th className="py-3 px-4 text-center">Tingkat Risiko</th>
                  <th className="py-3 px-4">Wilayah Tertinggi</th>
                  <th className="py-3 px-4 text-center">Rasio di Wilayah Tsb.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {RASIO_TUJUAN.map(t => {
                  const perWilayah = TUJUAN_PER_WILAYAH[t.tujuan] ?? {};
                  const tertinggi = (Object.entries(perWilayah) as [WilayahId, number][])
                    .sort((a, b) => b[1] - a[1])[0];
                  return (
                    <tr key={t.tujuan} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{t.icon} {t.tujuan}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: riskColor(t.rasio) }}>{pct(t.rasio)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: riskColor(t.rasio) }}>
                          {(RISK_STOPS.find(x => t.rasio < x.max) ?? RISK_STOPS[RISK_STOPS.length - 1]).label}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tertinggi ? NAMA_WILAYAH[tertinggi[0]] : '—'}</td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: tertinggi ? riskColor(tertinggi[1]) : undefined }}>
                        {tertinggi ? pct(tertinggi[1]) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
