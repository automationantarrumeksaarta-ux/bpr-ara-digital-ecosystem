import React, { useMemo, useState } from 'react';
import { FileText, Phone, Search, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone, HIT_TARGET, type ToneName } from '../ui/tokens';

/**
 * Permohonan kredit versi aplikasi.
 *
 * Versi web menampilkan pipeline mendatar tujuh tahap berikut tabel rinci —
 * bentuk yang membutuhkan lebar. Di HP, AO memakainya untuk satu hal:
 * mengecek permohonan yang ia ajukan sudah sampai tahap mana.
 *
 * Jadi tahap dijadikan penyaring, dan tiap permohonan tampil sebagai baris
 * dengan nama, plafon, dan posisi tahapnya.
 */

const TAHAP: { id: string; label: string; nada: ToneName }[] = [
  { id: 'SUBMITTED', label: 'Input AO', nada: 'neutral' },
  { id: 'VERIFICATION', label: 'Verifikasi', nada: 'warning' },
  { id: 'SURVEY', label: 'Survey', nada: 'primary' },
  { id: 'ANALYSIS', label: 'Analisa', nada: 'primary' },
  { id: 'CREDIT_COMMITTEE', label: 'Komite', nada: 'primary' },
  { id: 'APPROVED', label: 'Disetujui', nada: 'positive' },
  { id: 'DISBURSED', label: 'Cair', nada: 'positive' },
  { id: 'REJECTED', label: 'Ditolak', nada: 'danger' },
];

const infoTahap = (id: string) =>
  TAHAP.find(t => t.id === id) ?? { id, label: id, nada: 'neutral' as ToneName };

const rupiahRingkas = (v: number): string => {
  if (!v) return 'Rp 0';
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2).replace('.', ',')} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)} Jt`;
  return `Rp ${v.toLocaleString('id-ID')}`;
};

const MobileLoanOrigination: React.FC = () => {
  const { creditApplications, currentUser } = useApp() as any;
  const [tahapDipilih, setTahapDipilih] = useState<string>('SEMUA');
  const [cari, setCari] = useState('');
  const [hanyaSaya, setHanyaSaya] = useState(true);

  const namaSaya = (currentUser?.name ?? '').trim().toLowerCase();

  const milikSaya = (a: any) =>
    (a.aoName ?? a.createdBy ?? '').toString().trim().toLowerCase() === namaSaya;

  const semua = creditApplications ?? [];

  const jumlahPerTahap = useMemo(() => {
    const n: Record<string, number> = {};
    for (const a of semua) {
      if (hanyaSaya && namaSaya && !milikSaya(a)) continue;
      const s = a.stage ?? a.status ?? 'SUBMITTED';
      n[s] = (n[s] ?? 0) + 1;
    }
    return n;
  }, [semua, hanyaSaya, namaSaya]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return semua
      .filter((a: any) => {
        if (hanyaSaya && namaSaya && !milikSaya(a)) return false;
        const s = a.stage ?? a.status ?? 'SUBMITTED';
        if (tahapDipilih !== 'SEMUA' && s !== tahapDipilih) return false;
        if (!q) return true;
        return [a.customerName, a.applicationNumber, a.cif]
          .some(v => (v ?? '').toString().toLowerCase().includes(q));
      })
      .sort((a: any, b: any) =>
        (b.createdAt ?? b.submittedAt ?? '').localeCompare(a.createdAt ?? a.submittedAt ?? ''));
  }, [semua, tahapDipilih, cari, hanyaSaya, namaSaya]);

  const tahapAda = TAHAP.filter(t => (jumlahPerTahap[t.id] ?? 0) > 0);
  const totalTerlihat = Object.values(jumlahPerTahap).reduce<number>((s, v) => s + Number(v), 0);

  return (
    <Screen>
      <AppBar title="Loan Origination" back />

      <Stack className="gap-4">
        <label className={`flex items-center gap-2.5 px-3.5 ${HIT_TARGET} ${surface.card} ${radius.control} border ${surface.divider}`}>
          <Search className={`w-4 h-4 shrink-0 ${ink.faint}`} />
          <input
            value={cari}
            onChange={e => setCari(e.target.value)}
            placeholder="Cari nama nasabah atau nomor permohonan"
            className={`flex-1 min-w-0 bg-transparent outline-none ${text.body} ${ink.strong} placeholder:text-slate-400`}
          />
          {cari && (
            <button type="button" onClick={() => setCari('')} aria-label="Hapus pencarian" className="p-1 -mr-1">
              <X className={`w-4 h-4 ${ink.faint}`} />
            </button>
          )}
        </label>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5">
          <button
            type="button"
            onClick={() => setTahapDipilih('SEMUA')}
            className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold border transition-colors ${
              tahapDipilih === 'SEMUA'
                ? 'bg-primary text-white border-transparent'
                : `${surface.card} ${ink.base} ${surface.divider}`
            }`}
          >
            Semua · {totalTerlihat}
          </button>
          {tahapAda.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTahapDipilih(t.id)}
              className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold border transition-colors ${
                tahapDipilih === t.id
                  ? 'bg-primary text-white border-transparent'
                  : `${surface.card} ${ink.base} ${surface.divider}`
              }`}
            >
              {t.label} · {jumlahPerTahap[t.id]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHanyaSaya(v => !v)}
            className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold border transition-colors ${
              hanyaSaya
                ? 'bg-primary text-white border-transparent'
                : `${surface.card} ${ink.base} ${surface.divider}`
            }`}
          >
            Permohonan saya
          </button>
        </div>

        {daftar.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={FileText}
              title={cari ? 'Tidak ada yang cocok' : 'Belum ada permohonan'}
              description={
                cari
                  ? 'Coba kata kunci lain, atau hapus pencarian.'
                  : hanyaSaya
                    ? 'Belum ada permohonan atas nama Anda. Matikan penyaring "Permohonan saya" untuk melihat semuanya.'
                    : 'Permohonan kredit baru akan muncul di sini.'
              }
            />
          </Card>
        ) : (
          <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
            {daftar.map((a: any) => {
              const tahap = infoTahap(a.stage ?? a.status ?? 'SUBMITTED');
              return (
                <div key={a.id} className="px-4 py-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className={`block ${text.body} font-semibold ${ink.strong} truncate`}>
                        {a.customerName ?? '(tanpa nama)'}
                      </span>
                      <span className={`block ${text.caption} ${ink.faint} mt-0.5 truncate`}>
                        {a.applicationNumber ?? a.cif ?? '-'}
                      </span>
                    </span>
                    <span className={`${text.headline} ${ink.strong} tabular-nums shrink-0`}>
                      {rupiahRingkas(a.requestedPlafon ?? a.plafon ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${text.caption} font-semibold px-1.5 py-0.5 ${radius.control} ${tone[tahap.nada].bgSoft} ${tone[tahap.nada].text}`}>
                      {tahap.label}
                    </span>
                    {a.requestedTenorMonths && (
                      <span className={`${text.caption} ${ink.faint}`}>{a.requestedTenorMonths} bln</span>
                    )}
                    {a.phone && (
                      <a
                        href={`tel:${a.phone}`}
                        className={`${text.caption} ${tone.primary.text} font-semibold flex items-center gap-1`}
                      >
                        <Phone className="w-3 h-3" />
                        Telepon
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileLoanOrigination;
