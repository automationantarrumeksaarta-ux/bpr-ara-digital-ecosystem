# BPR ARA Digital Ecosystem

Sistem operasional internal PT BPR Antar Rumeksa Arta. Bukan produk yang dijual,
bukan halaman pemasaran. Setiap layar dipakai pegawai bank untuk menyelesaikan
satu pekerjaan.

> Dokumen ini disusun dari kode yang sudah berjalan, bukan dari wawancara.
> Pemiliknya belum sempat mengoreksi. Bagian yang belum pasti ditandai TANYA.

## Pengguna

Pegawai BPR di Karesidenan Surakarta. Bukan pengguna umum, bukan nasabah.

| Peran | Yang dikerjakan di pipeline kredit |
|---|---|
| Account Officer | Menerima berkas, input pengajuan, mendampingi nasabah |
| Surveyor | Kunjungan lapangan, foto agunan, laporan on-the-spot |
| Analis Kredit | Analisis 5C, arus kas, DSCR, usulan plafon |
| Appraisal | Taksasi agunan, rasio LTV |
| Komite Kredit | Putusan pembiayaan sesuai limit kewenangan |
| Admin Legal | Verifikasi dokumen, akad, pengikatan agunan |
| Operasional | Pencairan dana, pemantauan baki debet |

Ciri yang menentukan desain:

- **Bukan pengguna teknologi.** Antarmuka yang "pintar" tapi asing justru bikin
  ragu. Yang dibutuhkan keterbacaan dan kepastian.
- **Layar kantor, siang hari, monitor 1366–1920px.** Bukan gelap, bukan mobile.
  (Aktivitas lapangan dan absensi punya aplikasi Android sendiri.)
- **Uang orang lain.** Salah baca angka berakibat nyata. Angka harus mudah
  dibandingkan dan tidak boleh ambigu.
- **Bahasa Indonesia.** Istilah teknis perbankan (plafon, baki debet, kolektibilitas,
  DSCR, LTV, SLIK, agunan) dipakai apa adanya karena itu bahasa kerja mereka.

## Pipeline Kredit

Tujuh tahap berurutan, satu berkas berjalan dari kiri ke kanan:

1. **Loan Origination** — input pengajuan, verifikasi berkas, cek SLIK
2. **Field Survey** — kunjungan lapangan oleh surveyor
3. **Credit Analysis** — kelayakan finansial, 5C, DSCR
4. **Collateral Appraisal** — taksasi agunan, LTV
5. **Committee Approval** — putusan komite sesuai kewenangan
6. **Legal & Documents** — verifikasi dokumen dan akad
7. **Disbursement** — pencairan dan pemantauan portofolio

Nilai `CreditAppStage` di basis data (`DRAFT`, `SUBMITTED`, `VERIFICATION`,
`SLIK`, `SURVEY`, `ANALYSIS`, `LEGAL_REVIEW`, `CREDIT_COMMITTEE`, `APPROVED`,
`DISBURSED`, `REJECTED`) lebih rinci daripada tujuh tahap di atas. Tujuh tahap
itu adalah pengelompokan untuk manusia; sebelas status itu kebenaran sistem.
Keduanya harus tetap ada, jangan disatukan.

## Kebenaran produk yang tidak boleh dikarang

- **NPL = KL + D + M**, dihitung dari nominal baki debet, bukan jumlah rekening.
  Standar OJK. Sehat bila ≤ 5%.
- **RR** dihitung dari persentase kredit lancar.
- Kewenangan memutus kredit terikat limit per jabatan. Layar tidak boleh
  menyiratkan seseorang bisa memutus di luar limitnya.
- Angka yang belum ada datanya ditulis apa adanya sebagai kosong. Dilarang
  menampilkan angka contoh, tren rekaan, atau persentase hasil kali-kira.
  Pernah terjadi di dasbor eksekutif dan menyesatkan.

## Kondisi nyata saat ini

`INITIAL_CREDIT_APPLICATIONS` adalah array kosong dan tidak ada pengajuan yang
tersimpan. **Jadi keadaan normal ketujuh halaman pipeline hari ini adalah
kosong.** Empty state bukan kasus pinggiran di sini — itu tampilan yang paling
sering dilihat pegawai. Halaman kosong yang tidak menjelaskan apa-apa adalah
cacat utama produk ini, bukan detail.

## Kanal

- **Web** — seluruh modul, termasuk pipeline kredit. Fokus dokumen ini.
- **Android (Capacitor)** — hanya aktivitas lapangan, absensi, tugas, dan gaji.
  Punya bahasa desainnya sendiri (`src/components/mobile/ui/`). Jangan campur.

## TANYA

- Apakah simulasi ponsel di halaman Field Survey memang alat peraga, atau
  peninggalan sebelum APK ada?
- Apakah pegawai memakai layar 1366px? Menentukan titik henti tabel.
- Berapa banyak pengajuan aktif pada hari sibuk? Menentukan tabel vs kartu.
