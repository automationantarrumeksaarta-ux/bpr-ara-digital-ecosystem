import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { text, ink, surface, radius, tone, HIT_TARGET, type ToneName } from './tokens';

/* ------------------------------------------------------------------ AppBar */

interface AppBarProps {
  title: string;
  /** tampilkan tombol kembali; layar yang jadi tab utama tidak perlu */
  back?: boolean;
  action?: React.ReactNode;
}

export const AppBar: React.FC<AppBarProps> = ({ title, back = false, action }) => {
  const navigate = useNavigate();
  return (
    <header
      className={`sticky top-0 z-30 ${surface.card}/85 backdrop-blur-xl border-b ${surface.divider}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-12 px-1 flex items-center gap-1">
        {back ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className={`w-11 h-11 flex items-center justify-center ${ink.base} active:opacity-50 transition-opacity`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-3" />
        )}
        <h1 className={`${text.title} ${ink.strong} flex-1 ${back ? 'text-center pr-11' : 'px-2'}`}>
          {title}
        </h1>
        {action ?? (back ? null : <div className="w-3" />)}
      </div>
    </header>
  );
};

/* ------------------------------------------------------------------ Screen */

export const Screen: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`min-h-full ${surface.page} ${className}`}>{children}</div>
);

/** Jarak antar blok konten dibuat seragam di semua layar. */
export const Stack: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`px-4 py-4 flex flex-col gap-6 ${className}`}>{children}</div>;

/* ------------------------------------------------------------------ Section */

export const Section: React.FC<{
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <section className="flex flex-col gap-2.5">
    {(title || action) && (
      <div className="flex items-baseline justify-between px-1">
        {title && <h2 className={`${text.headline} ${ink.strong}`}>{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

/* ------------------------------------------------------------------ Card */

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** kartu tanpa padding, untuk daftar yang mengatur padding sendiri */
  flush?: boolean;
}> = ({ children, className = '', flush = false }) => (
  <div
    className={`${surface.card} ${radius.card} border ${surface.divider} ${flush ? '' : 'p-4'} ${className}`}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ ListRow */

interface ListRowProps {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
  /** sembunyikan chevron untuk baris yang bukan navigasi */
  chevron?: boolean;
  danger?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  icon: Icon,
  title,
  subtitle,
  value,
  onClick,
  chevron = true,
  danger = false,
}) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`w-full ${HIT_TARGET} px-4 py-3 flex items-center gap-3 text-left transition-colors ${
        onClick ? 'active:bg-slate-50' : ''
      }`}
    >
      {Icon && (
        // Ikon monokrom. Sebelumnya tiap baris punya warna sendiri sehingga
        // mata tidak tahu mana yang penting.
        <Icon className={`w-[18px] h-[18px] shrink-0 ${danger ? tone.danger.text : ink.muted}`} />
      )}
      <span className="flex-1 min-w-0">
        <span className={`block ${text.body} font-medium truncate ${danger ? tone.danger.text : ink.strong}`}>
          {title}
        </span>
        {subtitle && <span className={`block ${text.caption} ${ink.faint} truncate mt-0.5`}>{subtitle}</span>}
      </span>
      {value && <span className={`${text.footnote} ${ink.muted} shrink-0`}>{value}</span>}
      {onClick && chevron && <ChevronRight className={`w-4 h-4 shrink-0 ${ink.faint}`} />}
    </Tag>
  );
};

/** Kumpulan ListRow dalam satu kartu, dengan garis pemisah otomatis. */
export const ListGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
    {children}
  </Card>
);

/* ------------------------------------------------------------------ Avatar */

/** Inisial dari nama, maksimal dua huruf. */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

export const Avatar: React.FC<{ name: string; size?: number; src?: string }> = ({
  name,
  size = 44,
  src,
}) => (
  <div
    className={`${radius.pill} shrink-0 overflow-hidden flex items-center justify-center bg-primary text-white font-semibold select-none`}
    style={{ width: size, height: size, fontSize: size * 0.36 }}
  >
    {src ? (
      <img src={src} alt={name} className="w-full h-full object-cover" />
    ) : (
      // Inisial, bukan ilustrasi orang generik. Avatar placeholder yang sama
      // untuk semua orang adalah salah satu penanda paling jelas UI template.
      initials(name)
    )}
  </div>
);

/* ------------------------------------------------------------------ Badge */

export const Badge: React.FC<{ children: React.ReactNode; toneName?: ToneName }> = ({
  children,
  toneName = 'neutral',
}) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 ${radius.control} ${tone[toneName].bgSoft} ${tone[toneName].text} text-[10px] font-semibold uppercase tracking-wide`}
  >
    {children}
  </span>
);

/* ------------------------------------------------------------------ StatTile */

export const StatTile: React.FC<{
  label: string;
  value: number | string;
  suffix?: string;
  toneName?: ToneName;
  /** sorot tile yang nilainya perlu perhatian */
  emphasize?: boolean;
}> = ({ label, value, suffix, toneName = 'neutral', emphasize = false }) => (
  <div className="px-3 py-3.5 flex flex-col gap-1">
    <span className={`${text.caption} ${ink.muted} truncate`} title={label}>
      {label}
    </span>
    <span className="flex items-baseline gap-1">
      <span className={`${text.stat} ${emphasize ? tone[toneName].text : ink.strong}`}>{value}</span>
      {suffix && <span className={`${text.caption} ${ink.faint}`}>{suffix}</span>}
    </span>
  </div>
);

/* ------------------------------------------------------------------ EmptyState */

export const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description?: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="py-12 px-6 flex flex-col items-center text-center gap-2">
    <Icon className={`w-8 h-8 ${ink.faint}`} strokeWidth={1.5} />
    <p className={`${text.body} font-medium ${ink.base}`}>{title}</p>
    {description && <p className={`${text.caption} ${ink.faint} max-w-[240px]`}>{description}</p>}
  </div>
);

/* ------------------------------------------------------------------ Skeleton */

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 ${radius.control} ${className}`} />
);
