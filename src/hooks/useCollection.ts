import { useCallback, useEffect, useState } from 'react';
import { ambilApi } from '../utils/api';

/**
 * Data penagihan: kredit bermasalah dan janji bayar.
 *
 * Menggantikan array kosong yang dibaca ketiga modul penagihan. Kredit
 * bermasalahnya dihitung server dari tabel `loans` hasil unggahan nominatif —
 * data yang sudah ada di sistem sejak lama tetapi tidak pernah dilihat modul
 * Collection, PTP Tracker, maupun NPL Restructuring.
 */

export interface KreditBermasalah {
  id: string;
  debtorName: string;
  aoName: string;
  branch: string;
  kol: string;
  outstandingPrincipal: number;
  interestArrears: number;
  daysOverdue: number;
  lastPaymentDate: string;
  actionStatus: string;
  actionNotes: string;
  region: string;
  tunggakanPokok: number;
  frekTunggakan: number;
  taksasi: number;
  ikatan: string;
}

export interface JanjiBayar {
  id: string;
  accountNumber: string;
  debtorName: string;
  aoName: string;
  branch: string;
  promiseDate: string;
  promisedAmount: number;
  status: 'MENUNGGU' | 'TEREALISASI' | 'INGKAR_JANJI';
  notes: string;
  contactWa: string;
  dibuatOleh: string;
  createdAt: string;
}

interface RingkasNpl {
  jumlahRekening: number;
  totalBakiDebet: number;
  totalTunggakanBunga: number;
  perKol: { kol: string; jumlah: number; baki: number }[];
  sudahDitangani: number;
}

interface RingkasPtp {
  total: number;
  menunggu: number;
  terealisasi: number;
  ingkar: number;
  nilaiMenunggu: number;
}

/** Daftar kredit bermasalah beserta pencatatan tindak lanjutnya. */
export function useKreditBermasalah() {
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [data, setData] = useState<KreditBermasalah[]>([]);
  const [ringkas, setRingkas] = useState<RingkasNpl | null>(null);
  const [pemicu, setPemicu] = useState(0);

  const muatUlang = useCallback(() => setPemicu(n => n + 1), []);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      setGalat(null);
      try {
        const { res, json } = await ambilApi('/api/collection/kredit-bermasalah');
        if (batal) return;
        if (!res.ok) throw new Error(json?.error ?? 'Gagal memuat kredit bermasalah');
        setData(json.data ?? []);
        setRingkas(json.ringkas ?? null);
      } catch (e: any) {
        if (batal) return;
        /* Tidak ada data pengganti. Daftar penagihan yang dikarang jauh lebih
           berbahaya daripada layar yang mengaku sedang gagal. */
        setGalat(e?.message ?? 'Terjadi kesalahan');
        setData([]);
        setRingkas(null);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, [pemicu]);

  const simpanTindakan = useCallback(
    async (rekening: string, actionStatus: string, actionNotes?: string) => {
      const { res, json } = await ambilApi(
        `/api/collection/kredit-bermasalah/${encodeURIComponent(rekening)}/tindakan`,
        { method: 'PUT', body: JSON.stringify({ actionStatus, actionNotes }) },
      );
      if (!res.ok) throw new Error(json?.error ?? 'Gagal menyimpan tindak lanjut');
      setPemicu(n => n + 1);
    },
    [],
  );

  return { memuat, galat, data, ringkas, muatUlang, simpanTindakan };
}

/** Janji bayar yang tercatat, beserta pembuatan dan pembaruannya. */
export function useJanjiBayar() {
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [data, setData] = useState<JanjiBayar[]>([]);
  const [ringkas, setRingkas] = useState<RingkasPtp | null>(null);
  const [pemicu, setPemicu] = useState(0);

  const muatUlang = useCallback(() => setPemicu(n => n + 1), []);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      setGalat(null);
      try {
        const { res, json } = await ambilApi('/api/collection/janji-bayar');
        if (batal) return;
        if (!res.ok) throw new Error(json?.error ?? 'Gagal memuat janji bayar');
        setData(json.data ?? []);
        setRingkas(json.ringkas ?? null);
      } catch (e: any) {
        if (batal) return;
        setGalat(e?.message ?? 'Terjadi kesalahan');
        setData([]);
        setRingkas(null);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, [pemicu]);

  /*
   * Keduanya melempar bila gagal, dan pemanggilnya wajib menangkapnya. Versi
   * sebelumnya memasang penangan kosong `() => {}`, sehingga janji bayar yang
   * diisi petugas hilang tanpa satu pun pesan galat.
   */
  const tambah = useCallback(async (isi: Partial<JanjiBayar>) => {
    const { res, json } = await ambilApi('/api/collection/janji-bayar', {
      method: 'POST',
      body: JSON.stringify(isi),
    });
    if (!res.ok) throw new Error(json?.error ?? 'Gagal menyimpan janji bayar');
    setPemicu(n => n + 1);
    return json.data as JanjiBayar;
  }, []);

  const perbarui = useCallback(async (id: string, isi: { status?: string; notes?: string }) => {
    const { res, json } = await ambilApi(`/api/collection/janji-bayar/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(isi),
    });
    if (!res.ok) throw new Error(json?.error ?? 'Gagal memperbarui janji bayar');
    setPemicu(n => n + 1);
    return json.data as JanjiBayar;
  }, []);

  return { memuat, galat, data, ringkas, muatUlang, tambah, perbarui };
}
