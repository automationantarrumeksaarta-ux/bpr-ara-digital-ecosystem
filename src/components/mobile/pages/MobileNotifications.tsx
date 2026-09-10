import React, { useMemo, useState } from 'react';
import { BellOff, CheckCheck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

type Saring = 'semua' | 'belum';

/** "2 jam lalu" dari timestamp, tanpa menambah dependensi tanggal. */
const waktuRelatif = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const detik = Math.floor((Date.now() - t) / 1000);
  if (detik < 60) return 'Baru saja';
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari === 1) return 'Kemarin';
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

/** Prioritas menentukan warna; modul saja tidak cukup untuk menyampaikan urgensi. */
const warnaPrioritas = (prioritas?: string) => {
  const p = (prioritas ?? '').toUpperCase();
  if (p === 'HIGH' || p === 'URGENT' || p === 'TINGGI') return tone.danger;
  if (p === 'MEDIUM' || p === 'SEDANG') return tone.warning;
  return tone.primary;
};

const MobileNotifications: React.FC = () => {
  const { notifications, markNotificationAsRead } = useApp();
  const [saring, setSaring] = useState<Saring>('semua');

  const belumDibaca = useMemo(
    () => (notifications ?? []).filter(n => !n.read).length,
    [notifications],
  );

  const daftar = useMemo(() => {
    const semua = [...(notifications ?? [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return saring === 'belum' ? semua.filter(n => !n.read) : semua;
  }, [notifications, saring]);

  return (
    <Screen>
      <AppBar
        title="Notifikasi"
        action={
          belumDibaca > 0 ? (
            <button
              type="button"
              onClick={() => (notifications ?? []).filter(n => !n.read).forEach(n => markNotificationAsRead(n.id))}
              className={`h-11 px-3 flex items-center gap-1.5 ${text.footnote} font-semibold ${tone.primary.text} active:opacity-50`}
            >
              <CheckCheck className="w-4 h-4" />
              Tandai dibaca
            </button>
          ) : undefined
        }
      />

      <Stack className="gap-4">
        {/* Penyaring hanya muncul kalau memang ada yang belum dibaca. */}
        {belumDibaca > 0 && (
          <div className={`flex gap-1 p-1 ${surface.card} ${radius.control} border ${surface.divider}`}>
            {([
              { id: 'semua' as const, label: `Semua (${notifications?.length ?? 0})` },
              { id: 'belum' as const, label: `Belum dibaca (${belumDibaca})` },
            ]).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSaring(t.id)}
                className={`flex-1 min-h-[36px] ${radius.control} ${text.footnote} font-semibold transition-colors ${
                  saring === t.id
                    ? 'bg-primary text-white'
                    : `${ink.muted} active:bg-slate-100`
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {daftar.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={BellOff}
              title={saring === 'belum' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
              description={
                saring === 'belum'
                  ? 'Tidak ada notifikasi yang menunggu perhatian Anda.'
                  : 'Notifikasi tugas, persetujuan, dan pengumuman akan muncul di sini.'
              }
            />
          </Card>
        ) : (
          <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
            {daftar.map(n => {
              const warna = warnaPrioritas(n.priority);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && markNotificationAsRead(n.id)}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors active:bg-slate-50 ${
                    n.read ? '' : 'bg-primary-light/50'
                  }`}
                >
                  {/*
                    Penanda belum dibaca berupa titik kecil. Versi sebelumnya
                    memberi setiap notifikasi lingkaran ikon berwarna 40px —
                    enam lingkaran berbeda warna berjajar tanpa arti apa pun.
                  */}
                  <span
                    className={`w-2 h-2 ${radius.pill} mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : warna.bg}`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={`flex-1 min-w-0 ${text.body} truncate ${
                          n.read ? `font-medium ${ink.base}` : `font-semibold ${ink.strong}`
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className={`${text.caption} ${ink.faint} shrink-0`}>
                        {waktuRelatif(n.timestamp)}
                      </span>
                    </span>
                    <span className={`block ${text.footnote} ${ink.muted} mt-1 leading-snug line-clamp-2`}>
                      {n.message}
                    </span>
                    {n.module && (
                      <span className={`inline-block mt-1.5 ${text.caption} ${ink.faint}`}>{n.module}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </Card>
        )}

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileNotifications;
