import { useCallback, useEffect, useState } from 'react';

/**
 * Peringatan dini risiko kredit, dihitung server dari tabel `loans`.
 *
 * Sebelumnya halaman EWS membaca berkas .xls langsung di peramban, menafsirkan
 * kolom rupiah "Tungakan" seolah satuan hari, lalu membuat peringatan dengan
 * nomor nasabah karangan. Sekarang seluruh aturan dijalankan di server terhadap
 * data yang sudah terunggah, jadi angkanya sama dengan yang dilihat modul lain.
 */

export type TingkatEws = 'RED' | 'YELLOW';

export type KategoriEws =
  | 'PERILAKU_BAYAR' | 'TUNGGAKAN' | 'JATUH_TEMPO'
  | 'AGUNAN' | 'PENGIKATAN' | 'KONSENTRASI';

export interface PeringatanEws {
  id: string;
  kode: string;
  kategori: KategoriEws;
  tingkat: TingkatEws;
  judul: string;
  keterangan: string;
  acuan: string;
  nama: string;
  petugas: string | null;
  wilayah: string | null;
  kelurahan: string | null;
  kolektibilitas: string | null;
  bakiDebet: number;
  nilai: number;
  tindakLanjut: { status: string; catatan: string | null; diperbaruiPada: string } | null;
}

export interface RingkasEws {
  total: number;
  merah: number;
  kuning: number;
  belumDitangani: number;
  sudahDitangani: number;
  nilaiTerdampak: number;
}

interface HasilEws {
  memuat: boolean;
  tersedia: boolean;
  alasan: string | null;
  galat: string | null;
  peringatan: PeringatanEws[];
  ringkas: RingkasEws;
  diagnostik: Record<string, any> | null;
  muatUlang: () => void;
  simpanTindakLanjut: (id: string, status: string, catatan?: string) => Promise<void>;
}

const RINGKAS_KOSONG: RingkasEws = {
  total: 0, merah: 0, kuning: 0, belumDitangani: 0, sudahDitangani: 0, nilaiTerdampak: 0,
};

export const LABEL_KATEGORI: Record<KategoriEws, string> = {
  PERILAKU_BAYAR: 'Perilaku bayar',
  TUNGGAKAN: 'Tunggakan',
  JATUH_TEMPO: 'Jatuh tempo',
  AGUNAN: 'Agunan',
  PENGIKATAN: 'Pengikatan',
  KONSENTRASI: 'Konsentrasi',
};

export const LABEL_TINDAK_LANJUT: Record<string, string> = {
  TERBUKA: 'Belum ditangani',
  DITINDAKLANJUTI: 'Sedang ditangani',
  SELESAI: 'Selesai',
  DIABAIKAN: 'Diabaikan',
};

export function useEwsAlerts(): HasilEws {
  const [memuat, setMemuat] = useState(true);
  const [tersedia, setTersedia] = useState(false);
  const [alasan, setAlasan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [peringatan, setPeringatan] = useState<PeringatanEws[]>([]);
  const [ringkas, setRingkas] = useState<RingkasEws>(RINGKAS_KOSONG);
  const [diagnostik, setDiagnostik] = useState<Record<string, any> | null>(null);
  const [pemicu, setPemicu] = useState(0);

  const muatUlang = useCallback(() => setPemicu(n => n + 1), []);

  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      setMemuat(true);
      setGalat(null);
      try {
        const res = await fetch('/api/ews/alerts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const json = await res.json();
        if (dibatalkan) return;

        if (!res.ok) throw new Error(json?.error ?? 'Gagal memuat peringatan');

        setTersedia(!!json.tersedia);
        setAlasan(json.alasan ?? null);
        setPeringatan(json.peringatan ?? []);
        setRingkas(json.ringkas ?? RINGKAS_KOSONG);
        setDiagnostik(json.diagnostik ?? null);
      } catch (e: any) {
        if (dibatalkan) return;
        // Tidak ada data contoh sebagai pengganti. Peringatan risiko yang
        // dikarang lebih berbahaya daripada layar yang mengaku sedang gagal.
        setGalat(e?.message ?? 'Terjadi kesalahan');
        setTersedia(false);
        setPeringatan([]);
        setRingkas(RINGKAS_KOSONG);
      } finally {
        if (!dibatalkan) setMemuat(false);
      }
    })();

    return () => { dibatalkan = true; };
  }, [pemicu]);

  const simpanTindakLanjut = useCallback(async (id: string, status: string, catatan?: string) => {
    const res = await fetch(`/api/ews/alerts/${encodeURIComponent(id)}/tindak-lanjut`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ status, catatan }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error ?? 'Gagal menyimpan tindak lanjut');
    }
    setPemicu(n => n + 1);
  }, []);

  return { memuat, tersedia, alasan, galat, peringatan, ringkas, diagnostik, muatUlang, simpanTindakLanjut };
}
