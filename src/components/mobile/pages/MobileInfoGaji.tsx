import React, { useEffect, useState } from 'react';
import { BadgeCheck, ChevronDown, Wallet } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Skeleton, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

/**
 * Slip gaji pegawai.
 *
 * Hanya menampilkan slip yang sudah DISETUJUI HR di halaman Payroll web.
 * Slip berstatus draft masih bisa berubah, dan menampilkannya sebagai angka
 * final akan menimbulkan sengketa saat nilainya bergeser.
 */

const rupiah = (v: number) => `Rp ${Math.round(v || 0).toLocaleString('id-ID')}`;

const namaPeriode = (p: string) => {
  const [th, bl] = p.split('-').map(Number);
  return Number.isFinite(th) && Number.isFinite(bl)
    ? new Date(th, bl - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : p;
};

interface Slip {
  id: string;
  period: string;
  employee_name: string | null;
  role: string | null;
  base_salary: number;
  meal_allowance: number;
  incentive: number;
  deductions: number;
  macro_grade: string | null;
  approved_by: string | null;
  approved_at: string | null;
  totalPendapatan: number;
  totalPotongan: number;
  gajiBersih: number;
}

const MobileInfoGaji: React.FC = () => {
  const { currentUser } = useApp();
  const [slips, setSlips] = useState<Slip[]>([]);
  const [dipilih, setDipilih] = useState(0);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch('/api/payroll/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const json = await res.json();
        if (!batal) setSlips(Array.isArray(json?.data) ? json.data : []);
      } catch {
        if (!batal) setSlips([]);
      } finally {
        if (!batal) setMemuat(false);
      }
    })();
    return () => { batal = true; };
  }, [currentUser]);

  const slip = slips[dipilih];

  return (
    <Screen>
      <AppBar title="Info Gaji" back />

      {memuat ? (
        <Stack>
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </Stack>
      ) : !slip ? (
        <Stack>
          <Card flush>
            <EmptyState
              icon={Wallet}
              title="Belum ada slip gaji"
              description="Slip akan muncul di sini setelah HR menyetujuinya di halaman Penggajian."
            />
          </Card>
        </Stack>
      ) : (
        <Stack>
          {/* Pemilih periode — hanya muncul kalau memang ada lebih dari satu. */}
          {slips.length > 1 && (
            <label className={`relative flex items-center justify-between px-3.5 min-h-[44px] ${surface.card} ${radius.control} border ${surface.divider}`}>
              <span className={`${text.body} font-semibold ${ink.strong}`}>{namaPeriode(slip.period)}</span>
              <ChevronDown className={`w-4 h-4 ${ink.faint}`} />
              <select
                aria-label="Pilih periode"
                value={dipilih}
                onChange={e => setDipilih(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0"
              >
                {slips.map((s, i) => (
                  <option key={s.id} value={i}>{namaPeriode(s.period)}</option>
                ))}
              </select>
            </label>
          )}

          {/* --- Angka yang paling dicari, paling atas --- */}
          <Card className="flex flex-col gap-1">
            <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
              Gaji bersih diterima
            </span>
            <span className={`${text.largeTitle} ${ink.strong}`}>{rupiah(slip.gajiBersih)}</span>
            <span className={`${text.caption} ${ink.faint}`}>
              Periode {namaPeriode(slip.period)}
            </span>

            <div className={`mt-3 pt-3 border-t ${surface.divider} flex items-center gap-2`}>
              <BadgeCheck className={`w-4 h-4 shrink-0 ${tone.positive.text}`} />
              <span className={`${text.caption} ${ink.muted}`}>
                Disetujui{slip.approved_by ? ` oleh ${slip.approved_by}` : ''}
                {slip.approved_at
                  ? ` · ${new Date(slip.approved_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}
              </span>
            </div>
          </Card>

          {/* --- Rincian --- */}
          <Card flush className="overflow-hidden">
            <div className={`px-4 py-3 border-b ${surface.divider}`}>
              <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                Pendapatan
              </span>
            </div>
            <div className={`divide-y ${surface.hairline}`}>
              {[
                { label: 'Gaji pokok', nilai: slip.base_salary },
                { label: 'Tunjangan makan', nilai: slip.meal_allowance },
                {
                  label: 'Insentif KPI',
                  nilai: slip.incentive,
                  catatan: slip.macro_grade ? `Grade makro ${slip.macro_grade}` : undefined,
                },
              ].map(b => (
                <div key={b.label} className="px-4 py-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className={`block ${text.body} ${ink.base}`}>{b.label}</span>
                    {b.catatan && <span className={`block ${text.caption} ${ink.faint} mt-0.5`}>{b.catatan}</span>}
                  </span>
                  <span className={`${text.body} font-semibold ${ink.strong} tabular-nums shrink-0`}>
                    {rupiah(b.nilai)}
                  </span>
                </div>
              ))}
              <div className="px-4 py-3 flex items-center gap-3 bg-slate-50">
                <span className={`flex-1 ${text.body} font-semibold ${ink.strong}`}>Total pendapatan</span>
                <span className={`${text.headline} ${ink.strong} tabular-nums`}>{rupiah(slip.totalPendapatan)}</span>
              </div>
            </div>
          </Card>

          <Card flush className="overflow-hidden">
            <div className={`px-4 py-3 border-b ${surface.divider}`}>
              <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
                Potongan
              </span>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <span className={`flex-1 ${text.body} ${ink.base}`}>Total potongan</span>
              <span className={`${text.body} font-semibold ${tone.danger.text} tabular-nums`}>
                −{rupiah(slip.totalPotongan)}
              </span>
            </div>
          </Card>

          <p className={`${text.caption} ${ink.faint} text-center px-6`}>
            Slip ini bersifat informasi. Bila ada selisih, hubungi bagian SDM.
          </p>

          <div className="h-2" />
        </Stack>
      )}
    </Screen>
  );
};

export default MobileInfoGaji;
