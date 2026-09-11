import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { isPathAllowed } from '../../utils/access';
import { TAHAP_PIPELINE, type PipelineStageName } from './pipeline';
import { cn } from '../../lib/utils';

/**
 * Rel tahap kredit.
 *
 * Menggantikan CreditPipelineHeader yang sebelumnya berupa kartu setinggi
 * ~150px di puncak ketujuh halaman — ruang sebesar itu untuk penunjuk arah yang
 * isinya sama di semua halaman. Di sini ia jadi chrome tipis: tetap menjawab
 * "saya di mana" dalam sekali lihat, tanpa mendorong pekerjaan sesungguhnya ke
 * bawah lipatan.
 *
 * Tahap yang boleh diakses peran ini bisa diklik untuk berpindah. Sebelumnya
 * penunjuk ini hanya gambar, dan satu-satunya jalan antar tahap adalah menu
 * samping. Hak akses diambil dari src/utils/access.ts — aturan yang sama persis
 * dengan penyaring menu, bukan salinan.
 */

interface Props {
  currentStage: PipelineStageName;
}

export const PipelineRail: React.FC<Props> = ({ currentStage }) => {
  const navigate = useNavigate();
  const { currentUser, rolePermissions } = useApp() as any;
  const indeksSekarang = TAHAP_PIPELINE.findIndex(t => t.kunci === currentStage);

  return (
    <nav aria-label="Tahap pipeline kredit" className="rounded-2xl border border-border bg-surface shadow-sm px-3 py-2.5">
      <ol className="flex items-stretch gap-1 overflow-x-auto scrollbar-hide">
        {TAHAP_PIPELINE.map((tahap, i) => {
          const selesai = i < indeksSekarang;
          const sekarang = i === indeksSekarang;
          const bolehBuka = isPathAllowed(tahap.rute, currentUser?.role, rolePermissions);

          const isi = (
            <>
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors',
                  sekarang && 'border-primary bg-primary text-white',
                  selesai && 'border-primary/30 bg-primary-light text-primary',
                  !sekarang && !selesai && 'border-border bg-surface text-muted',
                )}
              >
                {selesai ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px] font-bold transition-colors',
                  sekarang ? 'text-primary' : selesai ? 'text-foreground' : 'text-muted',
                )}
              >
                <span className="hidden lg:inline">{tahap.label}</span>
                <span className="lg:hidden">{tahap.pendek}</span>
              </span>
            </>
          );

          return (
            <li key={tahap.kunci} className="flex min-w-0 flex-1 items-center gap-1">
              {bolehBuka && !sekarang ? (
                <button
                  type="button"
                  onClick={() => navigate(tahap.rute)}
                  title={`Buka tahap ${tahap.label}`}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isi}
                </button>
              ) : (
                <span
                  aria-current={sekarang ? 'step' : undefined}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5',
                    sekarang && 'bg-primary-light',
                    !bolehBuka && !sekarang && 'opacity-55',
                  )}
                >
                  {isi}
                </span>
              )}

              {i < TAHAP_PIPELINE.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'hidden h-px w-3 shrink-0 sm:block',
                    i < indeksSekarang ? 'bg-primary/40' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
