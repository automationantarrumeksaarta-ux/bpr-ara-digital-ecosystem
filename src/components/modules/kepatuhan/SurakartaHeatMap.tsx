import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Locate } from 'lucide-react';
import { KARESIDENAN_SURAKARTA, SURAKARTA_VIEWBOX } from '../../../data/geo/surakartaMap';

/** Ambang risiko (dalam persen) — dipakai bersama oleh peta, legenda, dan tabel. */
export const RISK_STOPS = [
  { max: 10, label: 'Rendah', color: '#4ade80' },
  { max: 13, label: 'Sedang', color: '#fbbf24' },
  { max: 16, label: 'Tinggi', color: '#f97316' },
  { max: Infinity, label: 'Sangat Tinggi', color: '#ef4444' },
] as const;

export const riskColor = (value: number | undefined): string => {
  if (value === undefined || Number.isNaN(value)) return '#e2e8f0';
  return (RISK_STOPS.find(s => value < s.max) ?? RISK_STOPS[RISK_STOPS.length - 1]).color;
};

export const riskLabel = (value: number | undefined): string => {
  if (value === undefined || Number.isNaN(value)) return 'Tanpa data';
  return (RISK_STOPS.find(s => value < s.max) ?? RISK_STOPS[RISK_STOPS.length - 1]).label;
};

interface SurakartaHeatMapProps {
  /** id wilayah (BOYOLALI, SRAGEN, …) -> nilai yang diwarnai */
  values: Record<string, number>;
  /** wilayah yang sedang difilter; null = semua */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** format nilai untuk tooltip, mis. rasio atau rupiah */
  formatValue?: (value: number) => string;
  /** tampilkan nama wilayah di atas peta */
  showLabels?: boolean;
  className?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const defaultFormat = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

export const SurakartaHeatMap: React.FC<SurakartaHeatMapProps> = ({
  values,
  selectedId = null,
  onSelect,
  formatValue = defaultFormat,
  showLabels = true,
  className = '',
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const clampPan = useCallback((x: number, y: number, z: number) => {
    // batasi geseran supaya peta tidak bisa ditarik keluar bingkai
    const limit = ((z - 1) / z) * 500;
    return { x: Math.max(-limit, Math.min(limit, x)), y: Math.max(-limit, Math.min(limit, y)) };
  }, []);

  const applyZoom = useCallback((next: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    setZoom(z);
    setPan(p => clampPan(p.x, p.y, z));
  }, [clampPan]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom === 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const drag = dragRef.current;
    if (!drag || !rect) return;
    // konversi geseran piksel -> satuan viewBox, dibagi zoom agar terasa 1:1
    const scale = 1000 / rect.width / zoom;
    setPan(clampPan(
      drag.panX - (e.clientX - drag.x) * scale,
      drag.panY - (e.clientY - drag.y) * scale,
      zoom,
    ));
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current = null;
    if ((e.currentTarget as Element).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    }
  };

  const viewBox = useMemo(() => {
    const size = 1000 / zoom;
    const origin = (1000 - size) / 2;
    return `${origin + pan.x} ${origin + pan.y} ${size} ${size}`;
  }, [zoom, pan]);

  const hoveredShape = hovered ? KARESIDENAN_SURAKARTA.find(s => s.id === hovered) : null;
  const labelScale = 1 / Math.sqrt(zoom); // label tidak ikut membesar berlebihan saat di-zoom

  return (
    <div
      ref={wrapRef}
      className={`relative w-full aspect-[4/3] bg-slate-50 dark:bg-gray-800/40 rounded-xl overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox={viewBox}
        className={`w-full h-full ${zoom > 1 ? (dragRef.current ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={(e) => { endDrag(e); setHovered(null); }}
        role="img"
        aria-label="Peta Karesidenan Surakarta"
      >
        <g strokeLinejoin="round">
          {KARESIDENAN_SURAKARTA.map(shape => {
            const value = values[shape.id];
            const isSelected = selectedId === shape.id;
            const isDimmed = selectedId !== null && !isSelected;
            return (
              <path
                key={shape.id}
                d={shape.d}
                fill={riskColor(value)}
                stroke="#ffffff"
                strokeWidth={(isSelected ? 4 : 1.6) / zoom}
                className="cursor-pointer transition-[opacity,filter] duration-200"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  filter: hovered === shape.id ? 'brightness(1.12)' : undefined,
                }}
                onMouseEnter={() => setHovered(shape.id)}
                onClick={() => onSelect?.(isSelected ? null : shape.id)}
              >
                <title>{`${shape.fullName}${value !== undefined ? ` — ${formatValue(value)}` : ''}`}</title>
              </path>
            );
          })}
        </g>

        {showLabels && (
          <g pointerEvents="none">
            {KARESIDENAN_SURAKARTA.map(shape => (
              <text
                key={shape.id}
                x={shape.labelX}
                y={shape.labelY}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={(shape.id === 'SURAKARTA' ? 22 : 30) * labelScale}
                fontWeight={700}
                style={{
                  paintOrder: 'stroke',
                  stroke: 'rgba(15,23,42,0.55)',
                  strokeWidth: 3 * labelScale,
                  opacity: selectedId !== null && selectedId !== shape.id ? 0.45 : 1,
                }}
              >
                {shape.name}
              </text>
            ))}
          </g>
        )}
      </svg>

      {/* Tooltip mengikuti kursor */}
      {hoveredShape && (
        <div
          className="pointer-events-none absolute z-20 px-2.5 py-1.5 rounded-lg bg-slate-900/95 text-white text-[10px] font-semibold shadow-lg whitespace-nowrap"
          style={{
            left: Math.min(cursor.x + 12, (wrapRef.current?.clientWidth ?? 0) - 130),
            top: Math.max(cursor.y - 40, 4),
          }}
        >
          <div>{hoveredShape.fullName}</div>
          {values[hoveredShape.id] !== undefined && (
            <div className="font-black text-[11px]" style={{ color: riskColor(values[hoveredShape.id]) }}>
              {formatValue(values[hoveredShape.id])} · {riskLabel(values[hoveredShape.id])}
            </div>
          )}
        </div>
      )}

      {/* Kontrol zoom */}
      <div className="absolute bottom-3 left-3 flex flex-col bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm overflow-hidden">
        <button
          type="button"
          onClick={() => applyZoom(zoom + 0.75)}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Perbesar peta"
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyZoom(zoom - 0.75)}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Perkecil peta"
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={resetView}
        aria-label="Kembalikan tampilan peta"
        title="Kembalikan tampilan"
        className="absolute top-3 right-3 bg-white/95 dark:bg-gray-800/95 p-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Locate className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {selectedId && (
        <button
          type="button"
          onClick={() => onSelect?.(null)}
          className="absolute top-3 left-3 px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow hover:bg-blue-700 transition-colors"
        >
          Reset filter wilayah ✕
        </button>
      )}
    </div>
  );
};
