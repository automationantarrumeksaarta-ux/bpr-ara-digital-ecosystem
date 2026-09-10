import { useEffect, useState } from 'react';
import {
  PORTOFOLIO_WILAYAH,
  PORTOFOLIO_AO,
  NASABAH_BERMASALAH,
  RASIO_SEKTOR,
  RASIO_TUJUAN,
  SEKTOR_PER_WILAYAH,
  TUJUAN_PER_WILAYAH,
  TOTAL_PEMBIAYAAN,
  type PortofolioWilayah,
  type PortofolioAO,
  type NasabahBermasalah,
  type WilayahId,
} from '../data/kepatuhan/heatMapData';

export interface HeatMapDataset {
  portofolioWilayah: PortofolioWilayah[];
  portofolioAO: PortofolioAO[];
  nasabahBermasalah: NasabahBermasalah[];
  rasioSektor: { sektor: string; rasio: number; icon: string }[];
  rasioTujuan: { tujuan: string; rasio: number; icon: string }[];
  sektorPerWilayah: Record<string, Partial<Record<WilayahId, number>>>;
  tujuanPerWilayah: Record<string, Partial<Record<WilayahId, number>>>;
  totalPembiayaan: number;
}

export interface Diagnostik {
  totalBaris: number;
  tanpaWilayah: number;
  definisiBermasalah: string;
}

export interface HasilHeatMap {
  data: HeatMapDataset;
  /** 'api' = dari data nominatif yang diunggah; 'contoh' = data contoh bawaan. */
  sumber: 'api' | 'contoh';
  memuat: boolean;
  /** Alasan jatuh ke data contoh (belum ada upload / gagal ambil). */
  catatan: string | null;
  diagnostik: Diagnostik | null;
}

const IKON_SEKTOR: Record<string, string> = {
  Perdagangan: '🛒', Pertanian: '🌾', Jasa: '🔧', 'Industri Pengolahan': '🏭',
  Konstruksi: '🏗️', 'Transportasi & Pergudangan': '🚚', Lainnya: '📦',
};

const IKON_TUJUAN: Record<string, string> = {
  'Modal Kerja': '💰', Investasi: '📈', 'Konsumsi Produktif': '🛍️',
  'Pembelian Aset': '🏠', Refinancing: '🔄', Lainnya: '📦',
};

const DATA_CONTOH: HeatMapDataset = {
  portofolioWilayah: PORTOFOLIO_WILAYAH,
  portofolioAO: PORTOFOLIO_AO,
  nasabahBermasalah: NASABAH_BERMASALAH,
  rasioSektor: RASIO_SEKTOR,
  rasioTujuan: RASIO_TUJUAN,
  sektorPerWilayah: SEKTOR_PER_WILAYAH,
  tujuanPerWilayah: TUJUAN_PER_WILAYAH,
  totalPembiayaan: TOTAL_PEMBIAYAAN,
};

/**
 * Ambil agregat heat map dari data nominatif kredit yang sudah diunggah.
 * Selama belum ada unggahan (atau bila endpoint gagal), dashboard tetap
 * tampil memakai data contoh — dengan penanda jelas di UI.
 */
export function useKepatuhanHeatMap(): HasilHeatMap {
  const [hasil, setHasil] = useState<HasilHeatMap>({
    data: DATA_CONTOH,
    sumber: 'contoh',
    memuat: true,
    catatan: null,
    diagnostik: null,
  });

  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      try {
        const res = await fetch('/api/kepatuhan/heatmap', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (dibatalkan) return;

        if (!json?.tersedia) {
          setHasil({
            data: DATA_CONTOH,
            sumber: 'contoh',
            memuat: false,
            catatan: json?.alasan ?? 'Belum ada data nominatif kredit yang diunggah.',
            diagnostik: null,
          });
          return;
        }

        setHasil({
          sumber: 'api',
          memuat: false,
          catatan: null,
          diagnostik: json.diagnostik ?? null,
          data: {
            portofolioWilayah: json.portofolioWilayah ?? [],
            portofolioAO: json.portofolioAO ?? [],
            nasabahBermasalah: json.nasabahBermasalah ?? [],
            rasioSektor: (json.rasioSektor ?? []).map((s: any) => ({
              sektor: s.kategori,
              rasio: s.rasio ?? 0,
              icon: IKON_SEKTOR[s.kategori] ?? '📦',
            })),
            rasioTujuan: (json.rasioTujuan ?? []).map((t: any) => ({
              tujuan: t.kategori,
              rasio: t.rasio ?? 0,
              icon: IKON_TUJUAN[t.kategori] ?? '📦',
            })),
            sektorPerWilayah: json.sektorPerWilayah ?? {},
            tujuanPerWilayah: json.tujuanPerWilayah ?? {},
            totalPembiayaan: json.ringkas?.totalPembiayaan ?? 0,
          },
        });
      } catch (err: any) {
        if (dibatalkan) return;
        setHasil({
          data: DATA_CONTOH,
          sumber: 'contoh',
          memuat: false,
          catatan: `Gagal mengambil data dari server (${err?.message ?? 'kesalahan tidak diketahui'}). Menampilkan data contoh.`,
          diagnostik: null,
        });
      }
    })();

    return () => { dibatalkan = true; };
  }, []);

  return hasil;
}
