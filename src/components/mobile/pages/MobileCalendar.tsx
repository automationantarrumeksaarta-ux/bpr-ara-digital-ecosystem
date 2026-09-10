import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, User2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone, HIT_TARGET } from '../ui/tokens';

/**
 * Kalender tugas versi aplikasi.
 *
 * Versi web menampilkan grid bulanan penuh dengan judul tugas di dalam tiap
 * sel. Di lebar HP satu sel hanya sekitar 45px — judulnya terpotong jadi dua
 * huruf dan tidak terbaca.
 *
 * Di sini grid tetap ada tetapi hanya sebagai penanda: titik kecil menunjukkan
 * hari yang punya tugas, dan daftar lengkapnya muncul di bawah setelah satu
 * tanggal dipilih. Grid untuk menemukan, daftar untuk membaca.
 */

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** YYYY-MM-DD menurut waktu lokal, bukan UTC. */
const kunciTanggal = (d: Date) => d.toLocaleDateString('sv-SE');

const mendesak = (p?: string) => ['P1', 'P2'].includes((p ?? '').toUpperCase());

const MobileCalendar: React.FC = () => {
  const { flowTasks } = useApp() as any;
  const hariIni = new Date();

  const [bulan, setBulan] = useState(hariIni.getMonth());
  const [tahun, setTahun] = useState(hariIni.getFullYear());
  const [dipilih, setDipilih] = useState<string>(kunciTanggal(hariIni));

  /** Tugas dikelompokkan per tanggal tenggat. */
  const perTanggal = useMemo(() => {
    const peta = new Map<string, any[]>();
    for (const t of flowTasks ?? []) {
      const tgl = t.tanggalFU || t.tanggal;
      if (!tgl) continue;
      const kunci = String(tgl).slice(0, 10);
      if (!peta.has(kunci)) peta.set(kunci, []);
      peta.get(kunci)!.push(t);
    }
    return peta;
  }, [flowTasks]);

  /** Sel kalender: awal bulan digeser agar jatuh di kolom hari yang benar. */
  const sel = useMemo(() => {
    const pertama = new Date(tahun, bulan, 1);
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
    const kosongDepan = pertama.getDay();
    return [
      ...Array.from({ length: kosongDepan }, () => null),
      ...Array.from({ length: jumlahHari }, (_, i) => new Date(tahun, bulan, i + 1)),
    ];
  }, [bulan, tahun]);

  const geser = (arah: -1 | 1) => {
    const d = new Date(tahun, bulan + arah, 1);
    setBulan(d.getMonth());
    setTahun(d.getFullYear());
  };

  const tugasTerpilih = perTanggal.get(dipilih) ?? [];
  const tanggalTerpilih = new Date(`${dipilih}T00:00:00`);

  return (
    <Screen>
      <AppBar title="Kalender" back />

      <Stack className="gap-4">
        <Card className="flex flex-col gap-3">
          {/* --- Pemilih bulan --- */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => geser(-1)}
              aria-label="Bulan sebelumnya"
              className={`w-11 h-11 -ml-2 flex items-center justify-center ${ink.muted} active:opacity-50`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`${text.headline} ${ink.strong}`}>{NAMA_BULAN[bulan]} {tahun}</span>
            <button
              type="button"
              onClick={() => geser(1)}
              aria-label="Bulan berikutnya"
              className={`w-11 h-11 -mr-2 flex items-center justify-center ${ink.muted} active:opacity-50`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* --- Nama hari --- */}
          <div className="grid grid-cols-7">
            {NAMA_HARI.map(h => (
              <span key={h} className={`${text.caption} ${ink.faint} text-center font-semibold`}>{h}</span>
            ))}
          </div>

          {/* --- Grid tanggal --- */}
          <div className="grid grid-cols-7 gap-y-1">
            {sel.map((d, i) => {
              if (!d) return <span key={`k${i}`} />;
              const kunci = kunciTanggal(d);
              const tugas = perTanggal.get(kunci) ?? [];
              const iniHariIni = kunci === kunciTanggal(hariIni);
              const iniDipilih = kunci === dipilih;
              const adaMendesak = tugas.some((t: any) => mendesak(t.prioritas));

              return (
                <button
                  key={kunci}
                  type="button"
                  onClick={() => setDipilih(kunci)}
                  className="h-11 flex flex-col items-center justify-center gap-0.5"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${text.body} tabular-nums transition-colors ${
                      iniDipilih
                        ? 'bg-primary text-white font-bold'
                        : iniHariIni
                          ? `${tone.primary.bgSoft} ${tone.primary.text} font-bold`
                          : `${ink.base}`
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {/* Titik penanda: ada tugas, merah bila ada yang mendesak. */}
                  <span
                    className={`w-1 h-1 rounded-full ${
                      tugas.length === 0
                        ? 'bg-transparent'
                        : adaMendesak ? 'bg-danger' : 'bg-primary'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </Card>

        {/* --- Daftar tugas tanggal terpilih --- */}
        <div className="flex flex-col gap-2.5">
          <h2 className={`${text.headline} ${ink.strong} px-1`}>
            {tanggalTerpilih.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          {tugasTerpilih.length === 0 ? (
            <Card flush>
              <EmptyState
                icon={CalendarDays}
                title="Tidak ada tugas"
                description="Pilih tanggal lain yang bertanda titik untuk melihat tugasnya."
              />
            </Card>
          ) : (
            <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
              {tugasTerpilih.map((t: any) => (
                <div key={t.id} className="px-4 py-3.5 flex items-start gap-2.5">
                  <span
                    className={`w-1 self-stretch rounded-full shrink-0 ${
                      mendesak(t.prioritas) ? 'bg-danger' : 'bg-slate-200'
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className={`block ${text.body} font-medium ${ink.strong} leading-snug`}>
                      {t.deskripsiTugas || '(tanpa deskripsi)'}
                    </span>
                    <span className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className={`${text.caption} font-semibold px-1.5 py-0.5 ${radius.control} ${tone.neutral.bgSoft} ${ink.muted}`}>
                        {t.status}
                      </span>
                      {t.assignedTo && (
                        <span className={`${text.caption} ${ink.faint} flex items-center gap-1 min-w-0`}>
                          <User2 className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{t.assignedTo}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileCalendar;
