package com.bprara.app;

import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pemeriksaan keutuhan perangkat untuk absensi.
 *
 * Dipakai menjawab satu pertanyaan: apakah ponsel ini sedang disiapkan untuk
 * memalsukan kehadiran.
 *
 * Dua hal yang diperiksa, dan keduanya berbeda:
 *
 * 1. modePengembang — Opsi Pengembang menyala. Ini SYARAT untuk memasang lokasi
 *    palsu, tetapi bukan buktinya. Banyak orang menyalakannya untuk alasan yang
 *    tidak ada hubungannya dengan absen.
 *
 * 2. lokasiPalsu — ada aplikasi yang ditetapkan sebagai penyedia lokasi tiruan,
 *    atau pembacaan lokasi terakhir memang ditandai tiruan oleh sistem. Inilah
 *    bukti yang sesungguhnya, dan ini yang paling layak dipakai memblokir.
 *
 * Seluruh pemeriksaan GAGAL-TERBUKA: bila terjadi galat apa pun, hasilnya
 * dianggap aman. Aplikasi absensi yang menolak terbuka karena pemeriksaannya
 * sendiri bermasalah jauh lebih merugikan daripada satu ponsel yang lolos.
 */
@CapacitorPlugin(name = "KeamananPerangkat")
public class KeamananPerangkat extends Plugin {

    @PluginMethod
    public void periksa(PluginCall call) {
        JSObject hasil = new JSObject();
        hasil.put("modePengembang", modePengembangAktif());
        hasil.put("lokasiPalsu", lokasiPalsuAktif());
        hasil.put("didukung", true);
        call.resolve(hasil);
    }

    /** Opsi Pengembang menyala di Pengaturan. */
    private boolean modePengembangAktif() {
        try {
            return Settings.Global.getInt(
                    getContext().getContentResolver(),
                    Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                    0) != 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lokasi tiruan sedang dipakai.
     *
     * Sejak Android 6 tidak ada lagi saklar global "izinkan lokasi palsu"; yang
     * ada adalah aplikasi yang dipilih sebagai penyedia lokasi tiruan. Cara
     * paling dapat diandalkan adalah menanyai pembacaan lokasi terakhir apakah
     * ia berasal dari penyedia tiruan.
     */
    private boolean lokasiPalsuAktif() {
        try {
            LocationManager lm = (LocationManager) getContext()
                    .getSystemService(android.content.Context.LOCATION_SERVICE);
            if (lm == null) {
                return false;
            }

            for (String penyedia : new String[]{
                    LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER}) {
                Location lokasi;
                try {
                    lokasi = lm.getLastKnownLocation(penyedia);
                } catch (SecurityException se) {
                    // Izin lokasi belum diberikan. Bukan indikasi kecurangan.
                    continue;
                }
                if (lokasi == null) {
                    continue;
                }
                boolean tiruan = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        ? lokasi.isMock()
                        : lokasi.isFromMockProvider();
                if (tiruan) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
