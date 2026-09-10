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
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  lat,
  lng,
  zoom = 16,
  height = 176,
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
              style={{
                width: UKURAN_UBIN,
                height: UKURAN_UBIN,
                left: t.dx * UKURAN_UBIN - offsetX - UKURAN_UBIN / 2,
                top: t.dy * UKURAN_UBIN - offsetY - UKURAN_UBIN / 2,
              }}
            />
          ))}
        </div>
      </div>

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
