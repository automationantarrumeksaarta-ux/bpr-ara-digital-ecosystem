import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Fingerprint, LogIn, LogOut } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useMobileAttendance, formatJam } from '../../../hooks/useMobileAttendance';
import { useMobileMenu } from '../../../hooks/useMobileMenu';
import { Avatar, Badge, Card, Screen, Section, Skeleton, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

/** Sapaan mengikuti jam perangkat, bukan selalu "Selamat Pagi". */
const sapaan = (jam: number) => {
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 18) return 'Selamat sore';
  return 'Selamat malam';
};

const MobileHome: React.FC = () => {
  const { currentUser, notifications } = useApp();
  const navigate = useNavigate();
  const { rekap, hariIni, memuat } = useMobileAttendance();
  const { items: menu } = useMobileMenu(8);

  const nama = currentUser?.name || 'Pengguna';
  const belumDibaca = notifications?.filter(n => !n.read).length ?? 0;
  const now = new Date();

  const sudahMasuk = !!hariIni?.clock_in_time;
  const sudahPulang = !!hariIni?.clock_out_time;

  return (
    <Screen>
      {/* Kepala halaman menyatu dengan konten — tanpa AppBar terpisah, karena
          beranda tidak butuh judul yang mengulang nama tab di bawah. */}
      <div
        className={`${surface.card} px-4 pb-5 border-b ${surface.divider}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div className="flex items-center gap-3">
          <Avatar name={nama} size={44} />
          <div className="flex-1 min-w-0">
            <p className={`${text.body} font-semibold ${ink.strong} truncate`}>{nama}</p>
            <p className={`${text.caption} ${ink.muted} truncate`}>
              {currentUser?.unit ? `${currentUser.unit} · ` : ''}BPR ARA
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mobile/notifications')}
            aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'}
            className={`relative w-11 h-11 -mr-2 flex items-center justify-center ${ink.base} active:opacity-50`}
          >
            <Bell className="w-[22px] h-[22px]" strokeWidth={1.8} />
            {belumDibaca > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger ring-2 ring-white" />
            )}
          </button>
        </div>

        <div className="mt-4">
          <h1 className={`${text.largeTitle} ${ink.strong}`}>{sapaan(now.getHours())},</h1>
          <p className={`${text.body} ${ink.muted} mt-0.5`}>
            {currentUser?.role ? `${currentUser.role}` : 'Semoga hari Anda lancar.'}
          </p>
        </div>
      </div>

      <Stack>
        {/* --- Status absen hari ini: informasi paling mendesak, jadi paling atas --- */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold`}>
              Absen hari ini
            </span>
            <span className={`${text.caption} ${ink.faint}`}>
              {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <div className="flex items-stretch gap-3">
            <div className="flex-1 flex items-center gap-2.5">
              <span className={`w-8 h-8 ${radius.pill} ${tone.positive.bgSoft} flex items-center justify-center`}>
                <LogIn className={`w-4 h-4 ${tone.positive.text}`} />
              </span>
              <span>
                <span className={`block ${text.caption} ${ink.muted}`}>Masuk</span>
                <span className={`block ${text.headline} ${sudahMasuk ? ink.strong : ink.faint} tabular-nums`}>
                  {formatJam(hariIni?.clock_in_time)}
                </span>
              </span>
            </div>
            <div className={`w-px ${surface.divider} border-l`} />
            <div className="flex-1 flex items-center gap-2.5">
              <span className={`w-8 h-8 ${radius.pill} ${tone.neutral.bgSoft} flex items-center justify-center`}>
                <LogOut className={`w-4 h-4 ${ink.muted}`} />
              </span>
              <span>
                <span className={`block ${text.caption} ${ink.muted}`}>Pulang</span>
                <span className={`block ${text.headline} ${sudahPulang ? ink.strong : ink.faint} tabular-nums`}>
                  {formatJam(hariIni?.clock_out_time)}
                </span>
              </span>
            </div>
          </div>

          {!sudahPulang && (
            <Link
              to="/mobile/live-attendance"
              className={`${radius.control} ${
                sudahMasuk ? `${tone.neutral.bgSoft} ${ink.base}` : 'bg-primary text-white'
              } min-h-[44px] flex items-center justify-center gap-2 ${text.body} font-semibold active:scale-[0.98] transition-transform`}
            >
              <Fingerprint className="w-[18px] h-[18px]" />
              {sudahMasuk ? 'Absen pulang' : 'Absen masuk sekarang'}
            </Link>
          )}
        </Card>

        {/* --- Rekap bulan berjalan --- */}
        <Section
          title="Rekap bulan ini"
          action={
            <Link to="/mobile/attendance" className={`${text.footnote} font-semibold ${tone.primary.text}`}>
              Selengkapnya
            </Link>
          }
        >
          <Card flush className="overflow-hidden">
            {memuat ? (
              <div className="p-4 grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : (
              <div className={`grid grid-cols-3 divide-x ${surface.hairline}`}>
                <div className="px-3 py-3.5">
                  <span className={`${text.caption} ${ink.muted}`}>Hadir</span>
                  <span className="flex items-baseline gap-1 mt-1">
                    <span className={`${text.stat} ${ink.strong}`}>{rekap.hadir}</span>
                    <span className={`${text.caption} ${ink.faint}`}>/ {rekap.hariKerja}</span>
                  </span>
                </div>
                <div className="px-3 py-3.5">
                  <span className={`${text.caption} ${ink.muted}`}>Terlambat</span>
                  <span className="flex items-baseline mt-1">
                    <span className={`${text.stat} ${rekap.terlambat > 0 ? tone.warning.text : ink.strong}`}>
                      {rekap.terlambat}
                    </span>
                  </span>
                </div>
                <div className="px-3 py-3.5">
                  <span className={`${text.caption} ${ink.muted}`}>Izin &amp; Cuti</span>
                  <span className="flex items-baseline mt-1">
                    <span className={`${text.stat} ${ink.strong}`}>{rekap.izin + rekap.cuti}</span>
                  </span>
                </div>
              </div>
            )}
          </Card>
        </Section>

        {/* --- Menu modul --- */}
        <Section title="Menu">
          <Card flush className="p-2">
            <div className="grid grid-cols-4">
              {menu.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-2 px-1 py-3 ${radius.control} active:bg-slate-50 transition-colors`}
                >
                  {/*
                    Ikon monokrom dengan satu latar netral. Versi sebelumnya
                    memberi warna berbeda pada tiap menu (biru, indigo, emerald,
                    teal, ungu, oranye, hijau) — pelangi itu tidak menyampaikan
                    informasi apa pun dan justru menghapus hierarki.
                  */}
                  <span
                    className={`w-11 h-11 ${radius.control} ${tone.neutral.bgSoft} flex items-center justify-center`}
                  >
                    <item.icon className={`w-5 h-5 ${ink.base}`} strokeWidth={1.8} />
                  </span>
                  <span
                    className={`${text.caption} text-center font-medium ${ink.base} leading-tight whitespace-pre-line`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </Section>

        {/* --- Notifikasi terbaru --- */}
        {notifications && notifications.length > 0 && (
          <Section
            title="Terbaru"
            action={
              <Link to="/mobile/notifications" className={`${text.footnote} font-semibold ${tone.primary.text}`}>
                Semua
              </Link>
            }
          >
            <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
              {notifications.slice(0, 3).map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate('/mobile/notifications')}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left active:bg-slate-50"
                >
                  <span
                    className={`w-1.5 h-1.5 ${radius.pill} mt-1.5 shrink-0 ${
                      n.read ? 'bg-transparent' : 'bg-primary'
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className={`block ${text.body} font-medium ${ink.strong} truncate`}>{n.title}</span>
                    <span className={`block ${text.caption} ${ink.muted} truncate mt-0.5`}>{n.message}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${ink.faint}`} />
                </button>
              ))}
            </Card>
          </Section>
        )}

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileHome;
