/**
 * Deteksi apakah aplikasi sedang berjalan sebagai APK (Capacitor), bukan di
 * browser.
 *
 * Dipakai untuk menentukan tampilan awal: APK ditujukan untuk aktivitas
 * lapangan dan absensi, sehingga selalu masuk ke rute /mobile. Web tetap
 * masuk ke modul kerja seperti biasa.
 */

/**
 * Diperiksa saat dipanggil, bukan sekali saat modul dimuat: jembatan Capacitor
 * disuntikkan WebView lewat skrip terpisah, jadi pemeriksaan sekali-di-awal
 * bisa berjalan sebelum window.Capacitor terisi dan salah menyimpulkan
 * "bukan native".
 */
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
};

/** Tampilan awal APK. */
export const RUTE_AWAL_MOBILE = '/mobile/home';
