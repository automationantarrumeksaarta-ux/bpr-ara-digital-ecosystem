import React from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Section, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

/**
 * Ringkasan keuangan versi aplikasi.
 *
 * Bukan ExecutiveDashboard yang dipersempit. Dashboard web menyusun informasi
 * untuk layar lebar: empat kartu sejajar, dua grafik berdampingan, tabel
 * sepuluh kolom. Di layar HP susunan itu jadi satu kolom panjang dengan tabel
 * yang harus digeser ke samping.
 *
 * Di sini isinya sama tetapi disusun ulang untuk dibaca sambil berdiri:
 * dua angka terpenting lebih dulu, komposisi kredit sebagai batang bertumpuk
 * (lebih terbaca daripada donat kecil), lalu rincian sebagai daftar.
 */

const rupiahRingkas = (v: number): string => {
  if (!v) return 'Rp 0';
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(2).replace('.', ',')} T`;
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2).replace('.', ',')} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1).replace('.', ',')} Jt`;
  return `Rp ${v.toLocaleString('id-ID')}`;
};

const pct = (v: number) => `${v.toFixed(2).replace('.', ',')}%`;

/** Warna kolektibilitas — sama dengan yang dipakai dashboard web. */
const WARNA_KOLEK: Record<string, { nama: string; warna: string }> = {
  L: { nama: 'Lancar', warna: '#22c55e' },
  DPK: { nama: 'Dalam Perhatian', warna: '#eab308' },
  KL: { nama: 'Kurang Lancar', warna: '#f97316' },
  D: { nama: 'Diragukan', warna: '#ef4444' },
  M: { nama: 'Macet', warna: '#991b1b' },
};

/** Batas NPL sehat menurut pengawasan OJK. */
const BATAS_NPL_SEHAT = 5;

const MobileDashboard: React.FC = () => {
  const { macroMetrics } = useApp() as any;

  const osKredit = macroMetrics.outstandingKredit || 0;
  const tabungan = macroMetrics.totalTabungan || 0;
  const deposito = macroMetrics.totalDeposito || 0;
  const dpk = tabungan + deposito;
  const laba = macroMetrics.labaTahunBerjalan || 0;
  const aset = macroMetrics.totalAset || 0;
  const npl = macroMetrics.npl || 0;
  const rr = macroMetrics.rr || 0;

  const kualitas: any[] = macroMetrics.kualitasKredit ?? [];
  const periodeKualitas: string | null = macroMetrics.periodeKualitas ?? null;
  const adaData = osKredit > 0 || dpk > 0 || kualitas.length > 0;

  const nplSehat = npl > 0 && npl <= BATAS_NPL_SEHAT;

  return (
    <Screen>
      <AppBar title="Ringkasan Keuangan" back />

      {!adaData ? (
        <Stack>
          <Card flush>
            <EmptyState
              icon={Landmark}
              title="Belum ada data laporan"
              description="Unggah Neraca dan Laporan Rekap Nominatif Kredit lewat menu Data Center di versi web."
            />
          </Card>
        </Stack>
      ) : (
        <Stack>
          {/* --- Dua angka terpenting, satu per satu, bukan empat kartu sempit --- */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className={`w-10 h-10 ${radius.control} ${tone.primary.bgSoft} flex items-center justify-center shrink-0`}>
                <Landmark className={`w-5 h-5 ${tone.primary.text}`} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className={`block ${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                  Outstanding Kredit
                </span>
                <span className={`block ${text.largeTitle} ${ink.strong} mt-0.5`}>{rupiahRingkas(osKredit)}</span>
              </span>
            </div>

            <div className={`border-t ${surface.divider}`} />

            <div className="flex items-start gap-3">
              <span className={`w-10 h-10 ${radius.control} bg-slate-100 flex items-center justify-center shrink-0`}>
                <Wallet className={`w-5 h-5 ${ink.base}`} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block ${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                  Dana Pihak Ketiga
                </span>
                <span className={`block ${text.largeTitle} ${ink.strong} mt-0.5`}>{rupiahRingkas(dpk)}</span>
                <span className={`block ${text.caption} ${ink.faint} mt-1`}>
                  Tabungan {rupiahRingkas(tabungan)} · Deposito {rupiahRingkas(deposito)}
                </span>
              </span>
            </div>
          </Card>

          {/* --- Kualitas kredit: batang bertumpuk, bukan donat kecil --- */}
          <Section
            title="Kualitas Kredit"
            action={
              periodeKualitas ? (
                <span className={`${text.caption} ${ink.faint}`}>
                  {new Date(`${periodeKualitas}T00:00:00`).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </span>
              ) : undefined
            }
          >
            <Card className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between">
                <span className="flex items-baseline gap-2">
                  <span className={`${text.largeTitle} ${nplSehat ? tone.positive.text : tone.danger.text}`}>
                    {pct(npl)}
                  </span>
                  <span className={`${text.footnote} ${ink.muted}`}>NPL</span>
                </span>
                <span className={`${text.footnote} ${ink.muted}`}>RR {pct(rr)}</span>
              </div>

              {/*
                Batas 5% ditandai eksplisit. Angka NPL tanpa acuan tidak
                memberi tahu pembaca apakah 19,91% itu wajar atau gawat.
              */}
              <p className={`${text.caption} ${nplSehat ? tone.positive.text : tone.danger.text} -mt-2`}>
                {nplSehat
                  ? `Di bawah batas sehat OJK (${BATAS_NPL_SEHAT}%)`
                  : `Di atas batas sehat OJK (${BATAS_NPL_SEHAT}%)`}
              </p>

              {kualitas.length > 0 && (
                <>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                    {kualitas.map(k => (
                      <span
                        key={k.kolektibilitas}
                        style={{
                          width: `${k.persen}%`,
                          backgroundColor: WARNA_KOLEK[k.kolektibilitas]?.warna ?? '#94a3b8',
                        }}
                        title={`${WARNA_KOLEK[k.kolektibilitas]?.nama ?? k.kolektibilitas} ${k.persen}%`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    {kualitas.map(k => (
                      <div key={k.kolektibilitas} className="flex items-center gap-2.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: WARNA_KOLEK[k.kolektibilitas]?.warna ?? '#94a3b8' }}
                        />
                        <span className={`flex-1 min-w-0 ${text.body} ${ink.base} truncate`}>
                          {WARNA_KOLEK[k.kolektibilitas]?.nama ?? k.kolektibilitas}
                        </span>
                        <span className={`${text.caption} ${ink.faint} tabular-nums shrink-0`}>
                          {k.jmlRekening} rek
                        </span>
                        <span className={`${text.body} font-semibold ${ink.strong} tabular-nums shrink-0 w-14 text-right`}>
                          {pct(k.persen)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </Section>

          {/* --- Angka pendukung --- */}
          <Section title="Lainnya">
            <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
              {[
                { label: 'Laba tahun berjalan', nilai: rupiahRingkas(laba), icon: laba >= 0 ? ArrowUpRight : ArrowDownRight, positif: laba >= 0 },
                { label: 'Total aset', nilai: rupiahRingkas(aset), icon: PiggyBank, positif: true },
              ].map(b => (
                <div key={b.label} className="px-4 py-3.5 flex items-center gap-3">
                  <b.icon className={`w-[18px] h-[18px] shrink-0 ${b.positif ? tone.positive.text : tone.danger.text}`} />
                  <span className={`flex-1 ${text.body} ${ink.base}`}>{b.label}</span>
                  <span className={`${text.headline} ${ink.strong} tabular-nums`}>{b.nilai}</span>
                </div>
              ))}
            </Card>
          </Section>

          {npl > BATAS_NPL_SEHAT && (
            <div className={`${radius.control} ${tone.danger.bgSoft} px-3.5 py-3 flex items-start gap-2.5`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-px ${tone.danger.text}`} />
              <p className={`${text.footnote} ${tone.danger.text}`}>
                NPL {pct(npl)} berada di atas batas pengawasan. Prioritaskan penagihan pada
                kolektibilitas Macet dan Diragukan.
              </p>
            </div>
          )}

          <div className="h-2" />
        </Stack>
      )}
    </Screen>
  );
};

export default MobileDashboard;
