import React, { useState } from 'react';
import { MapPinOff } from 'lucide-react';
import { ink, radius, text } from './tokens';

/**
 * Peta kecil berbasis ubin OpenStreetMap.
 *
 * Menggantikan "peta" versi sebelumnya yang digambar dari beberapa garis
 * diagonal SVG acak — jelas terlihat palsu dan tidak memberi tahu apa pun
 * tentang posisi pengguna. Kalau ubin gagal dimuat, komponen turun ke tampilan
 * koordinat apa adanya, bukan pura-pura menampilkan peta.
 */

const UKURAN_UBIN = 256;

/**
 * Sumber ubin peta.
 *
 * Bawaannya OpenStreetMap: bebas dipakai, tanpa kunci, dan lisensinya jelas
 * untuk aplikasi internal. Tampilannya memang ramai karena dibuat sebagai peta
 * rujukan serbaguna, bukan latar belakang.
 *
 * Penyedia yang tampilannya lebih tenang dan modern — MapTiler, Stadia,
 * Thunderforest — semuanya menuntut kunci API. CARTO pun sejak beberapa waktu
 * lalu menolak permintaan tanpa kunci dan mengembalikan ubin bertuliskan
 * "API KEY REQUIRED", jadi tidak bisa dipakai begitu saja.
 *
 * Karena itu alamat ubin dibuat dapat diatur dari server lewat
 * /api/attendances/kantor. Bila kunci sudah dimiliki, cukup isi PETA_UBIN_URL
 * di .env pada VPS lalu restart — peta langsung berganti tanpa membangun ulang
 * APK. Lihat ABSENSI.md.
 *
 * Penanda `{z}`, `{x}`, `{y}` diganti nomor ubin; `{r}` diganti "@2x" bila
 * penyedianya menyediakan ubin kerapatan ganda.
 */
export const UBIN_BAWAAN = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ATRIBUSI_BAWAAN = '© OpenStreetMap';

/** Konversi lon/lat ke koordinat ubin Web Mercator (pecahan). */
const keUbin = (lat: number, lng: number, z: number) => {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};

/**
 * Meter per piksel pada suatu lintang dan tingkat perbesaran.
 *
 * Dipakai menggambar lingkaran radius dengan ukuran yang benar-benar sesuai
 * jaraknya di lapangan, bukan lingkaran berukuran tebakan.
 */
const meterPerPiksel = (lat: number, zoom: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

const susunUrl = (pola: string, z: number, x: number, y: number) =>
  pola
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{r}', '@2x');

interface MiniMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  /** tinggi peta dalam piksel */
  height?: number;
  /** Titik kantor yang ditampilkan beserta lingkaran radiusnya. */
  kantor?: { lat: number; lng: number; nama: string };
  /** Radius absen dalam meter; digambar sebagai lingkaran di sekitar kantor. */
  radiusMeter?: number;
  /** Pola alamat ubin; lihat UBIN_BAWAAN. */
  ubinUrl?: string;
  /** Teks atribusi penyedia peta; wajib ditampilkan. */
  atribusi?: string;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  lat,
  lng,
  zoom = 16,
  height = 176,
  kantor,
  radiusMeter,
  ubinUrl = UBIN_BAWAAN,
  atribusi = ATRIBUSI_BAWAAN,
  className = '',
}) => {
  const [gagal, setGagal] = useState(0);
  /*
   * Bila sumber ubin yang dipilih tidak dapat dihubungi, turun ke OpenStreetMap
   * sebelum menyerah. Peta yang tampilannya biasa masih jauh lebih berguna
   * daripada kotak abu-abu, apalagi di layar yang dipakai untuk memastikan
   * posisi sebelum absen.
   */
  const [pakaiCadangan, setPakaiCadangan] = useState(false);

  const { x, y } = keUbin(lat, lng, zoom);
  const ubinX = Math.floor(x);
  const ubinY = Math.floor(y);
  // Geseran agar titik pengguna benar-benar berada di tengah bingkai.
  const offsetX = (x - ubinX) * UKURAN_UBIN;
  const offsetY = (y - ubinY) * UKURAN_UBIN;

  const ubin: { key: string; url: string; dx: number; dy: number }[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tx = ubinX + dx;
      const ty = ubinY + dy;
      ubin.push({
        key: `${tx}-${ty}`,
        url: susunUrl(pakaiCadangan ? UBIN_BAWAAN : ubinUrl, zoom, tx, ty),
        dx,
        dy,
      });
    }
  }

  if (gagal >= 3) {
    return (
      <div
        className={`${radius.card} bg-slate-100 flex flex-col items-center justify-center gap-1.5 ${className}`}
        style={{ height }}
      >
        <MapPinOff className={`w-5 h-5 ${ink.faint}`} strokeWidth={1.5} />
        <span className={`${text.caption} ${ink.muted}`}>Peta tidak dapat dimuat</span>
        <span className={`${text.caption} ${ink.faint} tabular-nums`}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${radius.card} overflow-hidden bg-slate-100 ${className}`}
      /* Tinggi hanya dipaksa bila pemanggilnya tidak mengaturnya sendiri —
         layar absen memakai peta memenuhi ruang lewat className. */
      style={height > 0 ? { height } : undefined}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: 0, height: 0 }}>
          {ubin.map(t => (
            <img
              key={t.key}
              src={t.url}
              alt=""
              aria-hidden
              loading="lazy"
              onError={() => {
                if (!pakaiCadangan) { setPakaiCadangan(true); setGagal(0); return; }
                setGagal(n => n + 1);
              }}
              className="absolute max-w-none"
              /*
               * Titik asal pembungkus ini berada tepat di tengah bingkai, dan
               * di tengah bingkai itulah posisi pengguna harus jatuh. Maka
               * sudut kiri-atas sebuah ubin berjarak (dx*256 - offsetX) piksel
               * dari titik itu.
               *
               * Versi sebelumnya mengurangi setengah ubin lagi di kedua sumbu.
               * Pada zoom 16 di lintang Karanganyar, satu piksel ≈ 2,4 meter,
               * sehingga 128 piksel ≈ 300 meter — peta bergeser sekitar 400
               * meter secara diagonal dari penanda posisi. Itulah sebabnya
               * petanya terasa tidak akurat.
               */
              style={{
                width: UKURAN_UBIN,
                height: UKURAN_UBIN,
                left: t.dx * UKURAN_UBIN - offsetX,
                top: t.dy * UKURAN_UBIN - offsetY,
              }}
            />
          ))}
        </div>
      </div>

      {/* Kantor dan radius absennya, digambar relatif terhadap posisi pengguna. */}
      {kantor && (() => {
        const k = keUbin(kantor.lat, kantor.lng, zoom);
        const dx = (k.x - x) * UKURAN_UBIN;
        const dy = (k.y - y) * UKURAN_UBIN;
        const r = radiusMeter ? radiusMeter / meterPerPiksel(kantor.lat, zoom) : 0;
        return (
          <div
            className="absolute top-1/2 left-1/2"
            style={{ transform: `translate(${dx}px, ${dy}px)` }}
          >
            {r > 0 && (
              <span
                aria-hidden
                className="block absolute rounded-full border-2 border-primary/70 bg-primary/15"
                style={{ width: r * 2, height: r * 2, left: -r, top: -r }}
              />
            )}
            <span
              className="block absolute w-3 h-3 rounded-full bg-white ring-2 ring-primary shadow"
              style={{ left: -6, top: -6 }}
              title={kantor.nama}
            />
          </div>
        );
      })()}

      {/* Penanda posisi */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="block w-4 h-4 rounded-full bg-primary ring-[3px] ring-white shadow-md" />
      </div>

      {/* Atribusi wajib untuk ubin OpenStreetMap */}
      {/* Atribusi penyedia peta; wajib menurut lisensinya. */}
      <span className="absolute bottom-0 right-0 bg-white/80 px-1.5 py-0.5 text-[9px] text-slate-600">
        {pakaiCadangan ? ATRIBUSI_BAWAAN : atribusi}
      </span>
    </div>
  );
};
