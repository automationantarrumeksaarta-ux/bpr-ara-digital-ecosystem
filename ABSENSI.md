# Pengaturan Absensi

Nilai-nilai berikut dibaca dari environment saat server menyala. Ubah di `.env`
pada VPS, lalu `pm2 restart bpr-ara-app`. Tidak perlu membangun ulang APK —
aplikasi mengambil semuanya dari server.

| Variabel | Bawaan | Arti |
|---|---|---|
| `RADIUS_ABSEN_METER` | `50` | Jarak maksimum dari kantor terdekat agar absen diterima |
| `AKURASI_MAKS_METER` | `100` | Pembacaan GPS dengan ketidakpastian di atas ini ditolak |
| `JAM_MASUK_BATAS` | `08:00` | Lewat jam ini ditandai Terlambat |
| `JAM_PULANG` | `17:00` | Jam kerja berakhir |
| `TZ_KANTOR` | `Asia/Jakarta` | Zona waktu untuk tanggal dan jam absensi |
| `PETA_UBIN_URL` | kosong | Alamat ubin peta; kosong berarti memakai OpenStreetMap |
| `PETA_ATRIBUSI` | kosong | Teks atribusi penyedia peta |

Titik kantor tidak lewat environment karena jumlahnya lebih dari satu. Ubah di
`backend/kantor.ts`, lalu restart.

---

## Bila pegawai di kantor tetapi tertolak "di luar radius"

Layar absen menampilkan tiga angka yang diperlukan untuk menelusurinya:

1. **Jarak terbaca** ke kantor terdekat, dalam meter.
2. **Akurasi GPS**, ditulis sebagai `±sekian m`.
3. **Koordinat** ponsel saat itu.

Bandingkan koordinat itu dengan titik kantor di `backend/kantor.ts`.

**Bila koordinatnya jauh berbeda**, titik kantornyalah yang meleset, bukan
ponselnya. Berdiri di depan pintu kantor, baca koordinat di layar absen, lalu
pakai angka itu sebagai titik kantor yang baru.

**Bila koordinatnya sudah dekat tetapi jaraknya tetap besar**, yang terjadi
adalah ketidakpastian GPS di dalam gedung. Naikkan `RADIUS_ABSEN_METER` secara
bertahap, misalnya 75 lalu 100, sambil memperhatikan jarak yang tertulis.

## Bagaimana jarak dihitung

Ketidakpastian GPS ikut diperhitungkan. Angka `akurasi` yang dilaporkan ponsel
berarti "posisi sebenarnya ada di suatu titik dalam lingkaran seradius sekian
meter". Di dalam gedung, ponsel lazim melaporkan 20–60 meter.

Yang dibandingkan dengan radius adalah **jarak terdekat yang masih mungkin**,
yaitu jarak terbaca dikurangi ketidakpastiannya:

```
diterima bila  (jarak terbaca − akurasi)  ≤  RADIUS_ABSEN_METER
```

Dengan bawaan radius 50 meter dan batas akurasi 100 meter, jarak terbaca paling
jauh yang masih diterima adalah 150 meter. Pembacaan dengan ketidakpastian di
atas 100 meter ditolak lebih dulu dengan pesan berbeda, karena pada titik itu
posisinya memang belum diketahui — bukan soal jauh atau dekat.

Kelonggaran ini tidak berdiri sendiri. Setiap absen tetap menuntut swafoto, dan
aplikasi menolak dibuka bila mendeteksi lokasi tiruan.

---

## Mengganti tampilan peta

Bawaannya OpenStreetMap. Bebas dipakai, tanpa kunci, lisensinya jelas — tetapi
tampilannya memang ramai karena dibuat sebagai peta rujukan serbaguna, bukan
sebagai latar belakang.

Penyedia yang tampilannya lebih tenang dan modern semuanya menuntut kunci API.
CARTO pun sekarang menolak permintaan tanpa kunci dan mengirim ubin bertuliskan
"API KEY REQUIRED", jadi tidak bisa dipakai begitu saja.

Peta diambil dari alamat yang diatur server, jadi menggantinya **tidak menuntut
pembangunan ulang APK**. Cukup isi dua baris di `.env` pada VPS lalu restart.

### MapTiler (gratis sampai 100 ribu ubin per bulan)

Daftar di maptiler.com, ambil kuncinya, lalu:

```
PETA_UBIN_URL=https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}{r}.png?key=KUNCI_ANDA
PETA_ATRIBUSI=© MapTiler © OpenStreetMap
```

### Stadia Maps (gratis untuk pemakaian ringan)

Daftar di stadiamaps.com, daftarkan domain VPS, lalu:

```
PETA_UBIN_URL=https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=KUNCI_ANDA
PETA_ATRIBUSI=© Stadia Maps © OpenStreetMap
```

Penanda `{z}`, `{x}`, `{y}` diganti nomor ubin secara otomatis. `{r}` diganti
`@2x` untuk meminta ubin kerapatan ganda agar tidak buram di layar ponsel;
hapus penanda itu bila penyedianya tidak menyediakannya.

Bila alamat yang diisi tidak dapat dihubungi, peta otomatis turun ke
OpenStreetMap, bukan menjadi kotak kosong.
