import React, { useState } from 'react';
import { AlertCircle, Building2, Check, Clock, LogIn, LogOut, MapPin, RefreshCw } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useMobileAttendance, formatJam } from '../../../hooks/useMobileAttendance';
import { useKantorAbsen } from '../../../hooks/useKantorAbsen';
import { AppBar, Card, Screen, Stack } from '../ui/primitives';
import { MiniMap } from '../ui/MiniMap';
import { ink, radius, surface, text, tone } from '../ui/tokens';

type Aksi = 'masuk' | 'pulang';

const MobileLiveAttendance: React.FC = () => {
  const { currentUser } = useApp();
  const { posisi, alamat, memuat: memuatLokasi, error: errorLokasi, minta } = useGeolocation();
  const { hariIni, muatUlang } = useMobileAttendance();
  const { radiusMeter, akurasiMaksMeter, terdekat } = useKantorAbsen(posisi);

  const [mengirim, setMengirim] = useState<Aksi | null>(null);
  const [pesan, setPesan] = useState<{ tipe: 'ok' | 'gagal'; teks: string } | null>(null);

  const sudahMasuk = !!hariIni?.clock_in_time;
  const sudahPulang = !!hariIni?.clock_out_time;

  /*
   * Tombol dikunci bila jelas-jelas di luar radius atau sinyalnya masih kasar.
   *
   * Ini hanya penjagaan di layar supaya pegawai tidak menekan tombol lalu
   * ditolak tanpa tahu sebabnya. Keputusan sesungguhnya tetap di server.
   * Selama daftar kantor belum termuat, tombol dibiarkan hidup — memblokir
   * absen karena jaringan lambat berarti menghukum orang atas masalah yang
   * bukan miliknya.
   */
  const sinyalKasar = !!posisi && posisi.akurasi > akurasiMaksMeter;
  const diLuarRadius = !!terdekat && !terdekat.diDalamRadius;
  const lokasiSiap = !!posisi && !sinyalKasar && !diLuarRadius;

  const kirim = async (aksi: Aksi) => {
    if (!currentUser?.id || !posisi) return;
    setMengirim(aksi);
    setPesan(null);
    try {
      const res = await fetch(`/api/attendances/clock-${aksi === 'masuk' ? 'in' : 'out'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          lat: posisi.lat,
          lng: posisi.lng,
          akurasi: posisi.akurasi,
          location: alamat ?? `${posisi.lat.toFixed(5)}, ${posisi.lng.toFixed(5)}`,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setPesan({ tipe: 'ok', teks: data.message ?? `Absen ${aksi} berhasil dicatat.` });
        muatUlang();
      } else {
        setPesan({ tipe: 'gagal', teks: data?.error ?? 'Gagal mencatat absen.' });
      }
    } catch {
      setPesan({ tipe: 'gagal', teks: 'Tidak dapat terhubung ke server.' });
    }
    setMengirim(null);
  };

  const now = new Date();

  return (
    <Screen>
      <AppBar title="Absen" back />

      <Stack>
        {pesan && (
          <div
            className={`${radius.control} px-3.5 py-3 flex items-start gap-2.5 ${
              pesan.tipe === 'ok' ? tone.positive.bgSoft : tone.danger.bgSoft
            }`}
          >
            {pesan.tipe === 'ok'
              ? <Check className={`w-4 h-4 shrink-0 mt-px ${tone.positive.text}`} />
              : <AlertCircle className={`w-4 h-4 shrink-0 mt-px ${tone.danger.text}`} />}
            <p className={`${text.footnote} ${pesan.tipe === 'ok' ? tone.positive.text : tone.danger.text}`}>
              {pesan.teks}
            </p>
          </div>
        )}

        {/* --- Jam tercatat hari ini --- */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
              Hari ini
            </span>
            <span className={`${text.caption} ${ink.faint}`}>
              {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-stretch gap-3">
            <div className="flex-1 flex items-center gap-2.5">
              <span className={`w-9 h-9 ${radius.pill} ${tone.positive.bgSoft} flex items-center justify-center`}>
                <LogIn className={`w-[18px] h-[18px] ${tone.positive.text}`} />
              </span>
              <span>
                <span className={`block ${text.caption} ${ink.muted}`}>Masuk</span>
                <span className={`block ${text.title} ${sudahMasuk ? ink.strong : ink.faint} tabular-nums`}>
                  {formatJam(hariIni?.clock_in_time)}
                </span>
              </span>
            </div>
            <div className={`w-px border-l ${surface.divider}`} />
            <div className="flex-1 flex items-center gap-2.5">
              <span className={`w-9 h-9 ${radius.pill} ${tone.neutral.bgSoft} flex items-center justify-center`}>
                <LogOut className={`w-[18px] h-[18px] ${ink.muted}`} />
              </span>
              <span>
                <span className={`block ${text.caption} ${ink.muted}`}>Pulang</span>
                <span className={`block ${text.title} ${sudahPulang ? ink.strong : ink.faint} tabular-nums`}>
                  {formatJam(hariIni?.clock_out_time)}
                </span>
              </span>
            </div>
          </div>
        </Card>

        {/* --- Lokasi --- */}
        <Card flush className="overflow-hidden">
          <div className="px-4 py-3 flex items-start gap-2.5">
            <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${ink.muted}`} />
            <div className="flex-1 min-w-0">
              <span className={`block ${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                Lokasi Anda
              </span>
              {memuatLokasi ? (
                <span className={`block ${text.body} ${ink.faint} mt-1`}>Mencari lokasi…</span>
              ) : errorLokasi ? (
                <span className={`block ${text.footnote} ${tone.danger.text} mt-1`}>{errorLokasi}</span>
              ) : posisi ? (
                <>
                  <span className={`block ${text.body} ${ink.strong} mt-1 leading-snug`}>
                    {alamat ?? 'Alamat tidak dikenali'}
                  </span>
                  <span className={`block ${text.caption} ${ink.faint} mt-1 tabular-nums`}>
                    {posisi.lat.toFixed(5)}, {posisi.lng.toFixed(5)} · akurasi ±{posisi.akurasi} m
                  </span>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={minta}
              aria-label="Perbarui lokasi"
              className={`w-9 h-9 -mr-1 -mt-1 flex items-center justify-center ${ink.muted} active:opacity-50`}
            >
              <RefreshCw className={`w-4 h-4 ${memuatLokasi ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Kantor terdekat dan jaraknya — alasan tombol hidup atau mati. */}
          {terdekat && (
            <div className={`px-4 py-3 border-t ${surface.divider} flex items-start gap-2.5`}>
              <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${terdekat.diDalamRadius ? tone.positive.text : tone.danger.text}`} />
              <div className="flex-1 min-w-0">
                <span className={`block ${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                  Kantor terdekat
                </span>
                <span className={`block ${text.body} ${ink.strong} mt-1`}>{terdekat.kantor.nama}</span>
                <span
                  className={`block ${text.caption} mt-1 tabular-nums ${
                    terdekat.diDalamRadius ? tone.positive.text : tone.danger.text
                  }`}
                >
                  {Math.round(terdekat.jarak).toLocaleString('id-ID')} meter
                  {terdekat.diDalamRadius
                    ? ` · di dalam radius ${radiusMeter} m`
                    : ` · di luar radius ${radiusMeter} m`}
                </span>
              </div>
            </div>
          )}

          {posisi && (
            <MiniMap
              lat={posisi.lat}
              lng={posisi.lng}
              kantor={terdekat?.kantor}
              radiusMeter={radiusMeter}
              className="mx-3 mb-3"
            />
          )}
        </Card>

        {/* --- Tombol aksi --- */}
        {sudahPulang ? (
          <Card className="flex items-center gap-2.5">
            <Check className={`w-4 h-4 shrink-0 ${tone.positive.text}`} />
            <p className={`${text.body} ${ink.base}`}>Absen hari ini sudah lengkap. Terima kasih.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/*
              Satu tombol saja, sesuai tahap berikutnya yang memang bisa
              dilakukan. Menampilkan dua tombol yang salah satunya selalu
              mati (seperti desain sebelumnya) hanya menambah keraguan.
            */}
            {(() => {
              const aksi: Aksi = sudahMasuk ? 'pulang' : 'masuk';
              const Ikon = sudahMasuk ? LogOut : LogIn;
              return (
                <button
                  type="button"
                  disabled={!lokasiSiap || mengirim !== null}
                  onClick={() => kirim(aksi)}
                  className={`min-h-[52px] ${radius.control} flex items-center justify-center gap-2 ${text.headline} text-white transition-transform active:scale-[0.98] disabled:active:scale-100 disabled:bg-slate-300 ${
                    sudahMasuk ? 'bg-primary' : 'bg-success'
                  }`}
                >
                  <Ikon className="w-5 h-5" />
                  {mengirim ? 'Mengirim…' : `Absen ${aksi}`}
                </button>
              );
            })()}

            {!lokasiSiap && !memuatLokasi && (
              <p className={`${text.caption} ${ink.faint} text-center px-4`}>
                {sinyalKasar
                  ? `Sinyal GPS masih meleset sampai ${Math.round(posisi!.akurasi)} meter. Coba berdiri di tempat terbuka sebentar.`
                  : diLuarRadius
                    ? `Absen hanya bisa dilakukan dalam radius ${radiusMeter} meter dari kantor.`
                    : 'Lokasi diperlukan sebelum absen dapat dikirim.'}
              </p>
            )}
            {sudahMasuk && (
              <p className={`${text.caption} ${ink.faint} text-center flex items-center justify-center gap-1`}>
                <Clock className="w-3 h-3" />
                Anda sudah absen masuk pukul {formatJam(hariIni?.clock_in_time)}
              </p>
            )}
          </div>
        )}

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileLiveAttendance;
