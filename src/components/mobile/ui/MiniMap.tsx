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

/** Konversi lon/lat ke koordinat ubin Web Mercator (pecahan). */
const keUbin = (lat: number, lng: number, z: number) => {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};

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
  className?: string;
}

/**
 * Meter per piksel pada suatu lintang dan tingkat perbesaran.
 *
 * Dipakai untuk menggambar lingkaran radius dengan ukuran yang benar-benar
 * sesuai jaraknya di lapangan, bukan lingkaran berukuran tebakan.
 */
const meterPerPiksel = (lat: number, zoom: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

export const MiniMap: React.FC<MiniMapProps> = ({
  lat,
  lng,
  zoom = 16,
  height = 176,
  kantor,
  radiusMeter,
  className = '',
}) => {
  const [gagal, setGagal] = useState(0);

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
        url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
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
      style={{ height }}
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
              onError={() => setGagal(n => n + 1)}
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
      <span className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-white/80 text-[9px] text-slate-600">
        © OpenStreetMap
      </span>
    </div>
  );
};
