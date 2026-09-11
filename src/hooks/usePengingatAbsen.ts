import { useEffect } from 'react';
import { isNativeApp } from '../utils/platform';

/**
 * Pengingat absen pukul 08:00 lewat notifikasi lokal.
 *
 * Notifikasi LOKAL, bukan push dari server. Bedanya penting:
 *
 * - Notifikasi lokal dijadwalkan ke alarm sistem Android. Ia tetap berbunyi
 *   walau aplikasi sedang tertutup, tanpa perlu Firebase, tanpa kunci server,
 *   dan tanpa biaya. Inilah yang tepat untuk pengingat berjadwal tetap.
 * - Push dari server (FCM) baru diperlukan bila server yang ingin memulai
 *   pesan, misalnya "berkas Anda disetujui". Itu menuntut proyek Firebase dan
 *   berkas google-services.json yang harus disiapkan pemilik aplikasi.
 *
 * Karena notifikasi ini sudah terjadwal di perangkat, ia tidak bisa menanyakan
 * ke server apakah pegawai sudah absen. Jadi pendekatannya dibalik: jadwal
 * dipasang tiap hari, lalu DIBATALKAN untuk hari itu begitu aplikasi melihat
 * absen masuk sudah tercatat. Hasilnya sama dari sisi pengguna, tanpa perlu
 * proses latar belakang yang menguras baterai.
 */

/** Id tetap; memakai id yang sama membuat penjadwalan ulang menimpa, bukan menumpuk. */
const ID_PENGINGAT_MASUK = 8001;
const ID_PENGINGAT_PULANG = 8002;

type Plugin = typeof import('@capacitor/local-notifications')['LocalNotifications'];

/** Dimuat saat dibutuhkan supaya versi web tidak ikut menanggung bobotnya. */
async function ambilPlugin(): Promise<Plugin | null> {
  if (!isNativeApp()) return null;
  try {
    const mod = await import('@capacitor/local-notifications');
    return mod.LocalNotifications;
  } catch {
    return null;
  }
}

const keJamMenit = (jam: string): { jam: number; menit: number } => {
  const m = jam.match(/^(\d{1,2}):(\d{2})$/);
  return m ? { jam: Number(m[1]), menit: Number(m[2]) } : { jam: 8, menit: 0 };
};

export interface OpsiPengingat {
  /** "HH:MM" jam masuk kantor. */
  jamMasuk: string;
  /** "HH:MM" jam pulang kantor. */
  jamPulang: string;
  /** Sudah absen masuk hari ini; pengingat masuk dibatalkan. */
  sudahMasuk: boolean;
  /** Sudah absen pulang hari ini; pengingat pulang dibatalkan. */
  sudahPulang: boolean;
  /** Matikan seluruh pengingat, mis. saat pengguna keluar. */
  aktif?: boolean;
}

export function usePengingatAbsen({
  jamMasuk, jamPulang, sudahMasuk, sudahPulang, aktif = true,
}: OpsiPengingat) {
  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      const LocalNotifications = await ambilPlugin();
      if (!LocalNotifications || dibatalkan) return;

      try {
        // Android 13 ke atas menuntut izin notifikasi secara eksplisit.
        const izin = await LocalNotifications.checkPermissions();
        if (izin.display !== 'granted') {
          const minta = await LocalNotifications.requestPermissions();
          if (minta.display !== 'granted') return;
        }
        if (dibatalkan) return;

        if (!aktif) {
          await LocalNotifications.cancel({
            notifications: [{ id: ID_PENGINGAT_MASUK }, { id: ID_PENGINGAT_PULANG }],
          });
          return;
        }

        const masuk = keJamMenit(jamMasuk);
        const pulang = keJamMenit(jamPulang);

        /*
         * `on` dengan hour/minute berarti "setiap hari pada jam itu", dan
         * `allowWhileIdle` membuatnya tetap berbunyi walau perangkat sedang
         * menghemat daya. Tanpa itu, Doze bisa menunda pengingat sampai jauh
         * lewat jam masuk sehingga kehilangan gunanya.
         */
        const jadwal: any[] = [];

        if (!sudahMasuk) {
          jadwal.push({
            id: ID_PENGINGAT_MASUK,
            title: 'Belum absen masuk',
            body: `Jam kerja mulai pukul ${jamMasuk}. Buka aplikasi untuk absen.`,
            schedule: { on: { hour: masuk.jam, minute: masuk.menit }, allowWhileIdle: true },
            smallIcon: 'ic_stat_icon_config_sample',
          });
        }
        if (!sudahPulang) {
          jadwal.push({
            id: ID_PENGINGAT_PULANG,
            title: 'Jangan lupa absen pulang',
            body: `Jam kerja berakhir pukul ${jamPulang}.`,
            schedule: { on: { hour: pulang.jam, minute: pulang.menit }, allowWhileIdle: true },
            smallIcon: 'ic_stat_icon_config_sample',
          });
        }

        // Yang sudah tercatat hari ini dibatalkan supaya tidak mengingatkan
        // pekerjaan yang sudah selesai.
        const dibatalkanIds = [
          ...(sudahMasuk ? [{ id: ID_PENGINGAT_MASUK }] : []),
          ...(sudahPulang ? [{ id: ID_PENGINGAT_PULANG }] : []),
        ];
        if (dibatalkanIds.length) {
          await LocalNotifications.cancel({ notifications: dibatalkanIds });
        }
        if (jadwal.length && !dibatalkan) {
          await LocalNotifications.schedule({ notifications: jadwal });
        }
      } catch (e) {
        // Gagal menjadwalkan tidak boleh menjatuhkan layar mana pun.
        console.warn('Pengingat absen tidak dapat dijadwalkan:', e);
      }
    })();

    return () => { dibatalkan = true; };
  }, [jamMasuk, jamPulang, sudahMasuk, sudahPulang, aktif]);
}
