import React, { useState } from 'react';
import {
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  CalendarX2, FileText, Clock, ClipboardList,
} from 'lucide-react';
import { useMobileAttendance, formatJam, keMenit } from '../../../hooks/useMobileAttendance';
import {
  AppBar, Card, EmptyState, ListGroup, ListRow, Screen, Section, Skeleton, Stack,
} from '../ui/primitives';
import { ink, radius, surface, text, tone, HIT_TARGET, type ToneName } from '../ui/tokens';

/** Batas jam masuk sebelum dihitung terlambat (menit sejak tengah malam). */
const BATAS_TERLAMBAT_MENIT = 8 * 60 + 15;

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MobileAttendanceData: React.FC = () => {
  const now = new Date();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth() + 1);

  const { records, rekap, memuat, error } = useMobileAttendance(tahun, bulan);

  const bulanDepanTersedia =
    tahun < now.getFullYear() || (tahun === now.getFullYear() && bulan < now.getMonth() + 1);

  const geser = (arah: -1 | 1) => {
    const d = new Date(tahun, bulan - 1 + arah, 1);
    setTahun(d.getFullYear());
    setBulan(d.getMonth() + 1);
  };

  // Hanya nilai yang bukan nol yang diberi warna. Kalau semuanya berwarna,
  // tidak ada yang menonjol — itulah kenapa grid 9 kotak sebelumnya terasa ramai.
  const statistik: { label: string; value: number; toneName: ToneName }[] = [
    { label: 'Hadir', value: rekap.hadir, toneName: 'positive' },
    { label: 'Alpa', value: rekap.alpa, toneName: 'danger' },
    { label: 'Sakit', value: rekap.sakit, toneName: 'danger' },
    { label: 'Izin', value: rekap.izin, toneName: 'primary' },
    { label: 'Cuti', value: rekap.cuti, toneName: 'primary' },
    { label: 'Lembur', value: rekap.lembur, toneName: 'primary' },
    { label: 'Terlambat', value: rekap.terlambat, toneName: 'warning' },
    { label: 'Pulang cepat', value: rekap.pulangCepat, toneName: 'warning' },
    // "Tanpa absen pulang" terpotong pada kolom selebar sepertiga layar.
    { label: 'Tanpa pulang', value: rekap.tidakAbsenPulang, toneName: 'warning' },
  ];

  return (
    <Screen>
      <AppBar title="Data Absen" back />

      <Stack>
        {/* --- Pemilih bulan: sebelumnya hanya tombol mati bertuliskan "Bulan Ini" --- */}
        <div className={`flex items-center ${surface.card} ${radius.control} border ${surface.divider}`}>
          <button
            type="button"
            onClick={() => geser(-1)}
            aria-label="Bulan sebelumnya"
            className={`w-11 ${HIT_TARGET} flex items-center justify-center ${ink.muted} active:opacity-50`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <label className={`relative flex-1 ${HIT_TARGET} flex items-center justify-center gap-1.5 cursor-pointer`}>
            <CalendarDays className={`w-4 h-4 ${ink.muted}`} />
            <span className={`${text.body} font-semibold ${ink.strong}`}>
              {BULAN[bulan - 1]} {tahun}
            </span>
            <ChevronDown className={`w-4 h-4 ${ink.faint}`} />
            <select
              aria-label="Pilih bulan"
              value={`${tahun}-${bulan}`}
              onChange={(e) => {
                const [t, b] = e.target.value.split('-').map(Number);
                setTahun(t);
                setBulan(b);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {Array.from({ length: 18 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const t = d.getFullYear();
                const b = d.getMonth() + 1;
                return (
                  <option key={`${t}-${b}`} value={`${t}-${b}`}>
                    {BULAN[b - 1]} {t}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            type="button"
            onClick={() => geser(1)}
            disabled={!bulanDepanTersedia}
            aria-label="Bulan berikutnya"
            className={`w-11 ${HIT_TARGET} flex items-center justify-center ${ink.muted} active:opacity-50 disabled:opacity-25`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <Card className={`${tone.danger.bgSoft} border-0`}>
            <p className={`${text.footnote} ${tone.danger.text}`}>{error}</p>
          </Card>
        )}

        {/* --- Ringkasan --- */}
        <Section title="Ringkasan">
          {memuat ? (
            <Card flush className="p-3 grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-16" />)}
            </Card>
          ) : (
            <Card flush className="overflow-hidden">
              <div className={`grid grid-cols-3 divide-x divide-y ${surface.hairline}`}>
                {statistik.map(s => (
                  <div key={s.label} className="px-3 py-3.5 min-w-0">
                    <span className={`block ${text.caption} ${ink.muted} truncate`} title={s.label}>
                      {s.label}
                    </span>
                    <span
                      className={`block ${text.stat} mt-1 ${s.value > 0 ? tone[s.toneName].text : ink.faint}`}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        {/* --- Riwayat harian: isi nyata, bukan sekadar angka ringkasan --- */}
        <Section title="Riwayat">
          {memuat ? (
            <Card flush className="p-4 flex flex-col gap-3">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}
            </Card>
          ) : records.length === 0 ? (
            <Card flush>
              <EmptyState
                icon={CalendarX2}
                title="Belum ada catatan absensi"
                description={`Tidak ada data absen pada ${BULAN[bulan - 1]} ${tahun}.`}
              />
            </Card>
          ) : (
            <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
              {[...records]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(r => {
                  const tgl = new Date(`${r.date}T00:00:00`);
                  // Perbandingan menit, bukan string: "08.45" > "08:15" bernilai
                  // false secara leksikal karena '.' < ':'.
                  const menitMasuk = keMenit(r.clock_in_time);
                  const terlambat = menitMasuk !== null && menitMasuk > BATAS_TERLAMBAT_MENIT;
                  return (
                    <div key={r.id ?? r.date} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 shrink-0 text-center">
                        <span className={`block ${text.headline} ${ink.strong} tabular-nums`}>
                          {tgl.getDate()}
                        </span>
                        <span className={`block ${text.caption} ${ink.faint}`}>
                          {tgl.toLocaleDateString('id-ID', { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/*
                          Hari izin/cuti/sakit tidak punya jam absen. Menampilkan
                          "--:-- – --:--" membuatnya terlihat seperti data hilang,
                          padahal statusnya justru informasi yang dicari.
                        */}
                        {r.clock_in_time ? (
                          <span className={`block ${text.body} ${ink.base} tabular-nums`}>
                            {formatJam(r.clock_in_time)} – {formatJam(r.clock_out_time)}
                          </span>
                        ) : (
                          <span className={`block ${text.body} ${ink.base}`}>
                            {r.status ?? 'Tanpa catatan'}
                          </span>
                        )}
                        {r.clock_in_location && (
                          <span className={`block ${text.caption} ${ink.faint} truncate mt-0.5`}>
                            {r.clock_in_location}
                          </span>
                        )}
                      </div>
                      {terlambat && (
                        <span className={`${text.caption} font-semibold ${tone.warning.text} shrink-0`}>
                          Terlambat
                        </span>
                      )}
                    </div>
                  );
                })}
            </Card>
          )}
        </Section>

        <Section title="Pengajuan">
          <ListGroup>
            <ListRow icon={ClipboardList} title="Pembatalan cuti / izin" subtitle="Ajukan pembatalan" onClick={() => {}} />
            <ListRow icon={FileText} title="Data izin" subtitle="Riwayat pengajuan izin" onClick={() => {}} />
            <ListRow icon={Clock} title="Data lembur" subtitle="Riwayat lembur Anda" onClick={() => {}} />
          </ListGroup>
        </Section>

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileAttendanceData;
