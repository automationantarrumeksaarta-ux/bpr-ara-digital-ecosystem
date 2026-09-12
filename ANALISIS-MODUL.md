# Analisis mendalam sepuluh modul

Ditelusuri 13 September 2026, setelah perbaikan keamanan dan penyambungan
modul penagihan. Setiap angka di bawah dibaca langsung dari basis data atau
dari kode yang berjalan.

Keadaan data saat pemeriksaan: `loans` 355 baris periode **2026-09-11**,
`macro_financials` 1 baris periode **2026-07-31**, `ews_alerts` 97,
`ao_performance` 10, `funding_breakdowns` 6, `credit_quality` 0,
`funding_growth` 0.

---

## 1. Dashboard Utama

Sumber angkanya sudah nyata — `/api/metrics` dari `macro_financials`. Tiga hal
perlu diperbaiki.

**Dua periode ditampilkan sebagai satu gambaran.** Angka makro berasal dari
31 Juli, sedangkan data kredit yang dipakai modul lain berasal dari 11
September. NPL di dashboard 19,91% (Juli), sementara NPL yang dihitung dari
`loans` hari ini 20,81%. Selisihnya hampir satu poin, dan tidak ada satu pun
keterangan periode di layar. Direksi membaca keduanya seolah keadaan yang sama.

**"10 Kredit Terbesar" sebenarnya 10 NPL terbesar.** Kueri sumbernya:

```sql
SELECT borrower_name, outstanding_amount, kolektibilitas
FROM ews_alerts ORDER BY outstanding_amount DESC LIMIT 10
```

`ews_alerts` hanya berisi 97 rekening berkolektibilitas KL, D, dan M. Jadi
tabel itu tidak pernah memuat debitur terbesar bank, hanya debitur bermasalah
terbesar — dengan judul yang menyatakan sebaliknya.

**Dua bagian permanen kosong.** Komposisi Kualitas Kredit membaca
`credit_quality` yang tidak berisi apa pun, dan grafik tren membaca `riwayat`
yang hanya punya satu titik sehingga tidak ada tren yang bisa digambar.
Hitungan pengajuan kredit tertunda membaca `creditApplications` yang memang
tidak pernah tersimpan.

**Perbaikan:** tampilkan tanggal periode pada setiap kartu; ganti sumber "10
Kredit Terbesar" ke `loans` atau ubah judulnya menjadi "10 Kredit Bermasalah
Terbesar"; sembunyikan bagian yang sumbernya kosong alih-alih menampilkan
kerangka tabel hampa.

## 2. Collection Management

Sudah tersambung ke `loans`: 97 rekening, Rp 6,3 miliar. Janji bayar dan surat
peringatan sudah tersimpan.

**Kartu saringan DPK selalu nol.** Layar menyediakan empat keranjang — DPK,
KL, D, M — tetapi endpoint hanya mengirim `WHERE collectibility IN ('KL','D','M')`.
Kartu DPK akan selamanya menunjukkan nol nasabah, dan penagih akan mengira
tidak ada satu pun rekening DPK padahal ada 36.

DPK justru golongan yang paling berguna bagi penagihan awal: belum NPL, masih
bisa diselamatkan.

**Perbaikan:** sertakan DPK pada endpoint dan beri penanda bahwa ia belum
terhitung NPL.

## 3. PTP Tracker

Sudah tersimpan di tabel `janji_bayar` dan sudah menolak kiriman yang tidak
lengkap.

**Janji bayar belum tentu menempel pada rekening.** `account_number` boleh
kosong. Janji yang dibuat dari Collection Management membawa nomor rekening,
tetapi yang dibuat langsung dari layar PTP tidak. Akibatnya janji itu tidak
bisa ditelusuri balik ke kreditnya, dan realisasinya tidak bisa dicocokkan
dengan setoran.

**Tidak ada pengingat saat jatuh tempo.** Status berpindah hanya bila ada yang
mengubahnya manual; janji yang lewat tanggal tetap berstatus MENUNGGU
selamanya.

**Perbaikan:** wajibkan pemilihan rekening dari daftar kredit bermasalah, dan
tandai otomatis janji yang sudah lewat tanggal sebagai perlu ditinjau.

## 4. NPL & Restructuring

Daftarnya sudah nyata dan tindak lanjut sudah tersimpan.

**Restrukturisasinya belum benar-benar ada.** Yang tersimpan hanya status
bernama `RESTRUKTURISASI` pada kolom tindakan. Syarat restrukturisasi yang
sesungguhnya — tenor baru, suku bunga baru, jadwal angsuran baru, jenis
restrukturisasi — tidak ada tempat penyimpanannya. Padahal itulah yang wajib
dilaporkan ke OJK dan yang menentukan kolektibilitas setelahnya.

Jadi modul ini hari ini adalah pencatat tindakan, belum modul restrukturisasi.

**Perbaikan:** tabel `restrukturisasi` berisi syarat lama dan syarat baru,
tanggal berlaku, dan penyetujunya.

## 5. Funding Dashboard

Modul ini berdiri sendiri sepenuhnya di peramban.

**Seluruh datanya di `localStorage`.** `storageService` membaca dan menulis ke
penyimpanan peramban; tidak ada satu pun panggilan ke server. Akibatnya angka
funding **berbeda di tiap komputer dan tiap peramban**. Petugas yang mengisi
di komputernya, lalu direksi membuka di komputer lain, akan melihat layar
kosong. Ganti peramban, hilang. Bersihkan data situs, hilang.

**Data awalnya kosong.** `RAW_FUNDING_DATA` dan `RAW_DAILY_MOVEMENT_DATA`
keduanya `[]`, jadi seluruh turunannya kosong.

**Sementara itu data funding yang sungguhan sudah ada di server dan tidak
dipakai.** Tabel `funding_breakdowns` memuat enam baris hasil unggahan
nominatif: Deposito 3/6/12 bulan dan Tabungan Umum/Wajib/Kejar, total Rp 24,4
miliar per 31 Juli. Modul Funding tidak pernah membacanya.

**Perbaikan:** ini yang paling mendesak dari kesepuluh modul setelah Audit Log.
Pindahkan penyimpanan ke server dan baca `funding_breakdowns` sebagai posisi
awal.

## 6. BEIS Reporting

Bagian terbaik dari kesepuluhnya. Analytics, Repository, dan Dashboard membaca
`tasks` yang nyata dari tabel `beis_tasks`, sama dengan Papan Tugas.

**Taksonomi dan daftar validator disimpan di `localStorage`.** Keduanya
konfigurasi yang seharusnya berlaku sama bagi semua orang, tetapi tersimpan
per peramban. Dua orang dapat memakai taksonomi berbeda tanpa menyadarinya,
dan daftar validator yang disusun seorang admin tidak terlihat oleh siapa pun.

**Perbaikan:** pindahkan keduanya ke server, cukup satu tabel konfigurasi.

## 7. Audit Log

**Modul paling bermasalah dari kesepuluhnya, dan paling berisiko secara
kepatuhan.**

Layarnya menampilkan lencana hijau bertuliskan **"SHA-256 Tamper-Proof
Active"**. Yang sebenarnya tersimpan:

```js
immutableHash: `HASH-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10)
deviceInfo: navigator.userAgent.includes('Mac') ? 'Mac OS / Chrome Browser' : 'Windows 11 / Edge Browser'
resultStatus: 'SUCCESS'
```

Empat kolom, empat masalah:

- **Hash-nya angka acak**, bukan hasil perhitungan apa pun. Ia tidak dapat
  membuktikan apa pun tentang keaslian baris itu, sementara layarnya menyatakan
  sebaliknya. Sebuah jejak audit yang mengaku anti-rusak padahal tidak, lebih
  berbahaya daripada tidak punya jejak audit — karena orang berhenti mencari
  bukti lain.
- **Alamat IP-nya dikarang acak.** Dalam pemeriksaan, IP adalah petunjuk siapa
  melakukan apa dari mana. Angka karangan di kolom itu adalah bukti palsu.
- **Perangkatnya ditebak** dari dua kemungkinan saja.
- **Hasilnya selalu SUCCESS.** Percobaan yang gagal — justru yang paling
  penting dalam audit — tidak pernah tercatat.

Dan semuanya hanya di memori: tidak ada tabel audit di basis data, sehingga
seluruh jejak hilang setiap kali halaman dimuat ulang.

**Perbaikan, berurutan:**
1. Hapus lencana "SHA-256 Tamper-Proof Active" sekarang juga. Klaim yang tidak
   benar lebih mendesak daripada fiturnya.
2. Hapus kolom IP dan perangkat, atau isi dari data sungguhan di sisi server.
3. Buat tabel `audit_trail` di server; catat di server, bukan di peramban.
4. Bila memang ingin anti-rusak, rantai hash sungguhan: hash baris = SHA-256
   dari isi baris + hash baris sebelumnya.

## 8. PE Audit

Halaman ini **tidak menampilkan apa pun, dan memang tidak bisa**:

```jsx
<DashboardPeAudit applications={[]} />
```

Array kosong diteruskan secara harfiah. Enam konstanta contoh diimpor di
berkas itu dan tidak satu pun dipakai. Jadi apa pun isi basis data, layarnya
tetap kosong.

**Perbaikan:** hubungkan ke sumber yang relevan bagi audit intern — temuan
audit, tindak lanjut, dan jejak perubahan — atau sembunyikan menunya sampai
ada isinya. Menu yang selalu kosong membuat orang berhenti mempercayai menu
lain.

## 9. Data Center

**Ada dua layar Data Center yang mengerjakan hal sama dengan hasil berbeda.**

| Layar | Rute | Perilaku |
| --- | --- | --- |
| Data Center Upload | `/executive/pe-bisnis-upload` | kirim ke server, tersimpan |
| CBS Data Center | `/system/data-center` | diproses di peramban, tidak tersimpan |

CBS Data Center membaca berkas dengan memecah teks XML memakai
`text.split(/<Row[^>]*>/i)` lalu menulis hasilnya ke state React lewat
`setMacroMetrics` dan `setCollectionCases`. Tidak ada yang dikirim ke server.

Dua akibatnya. Pertama, siapa pun yang mengunggah lewat layar ini akan melihat
angkanya berubah lalu hilang saat halaman dimuat ulang, tanpa penjelasan.
Kedua, sejak Collection Management dipindah membaca `loans`, panggilan
`setCollectionCases` di sana **sudah tidak dibaca siapa pun** — hasil
pembacaannya menguap seketika.

Pemecahan teks XML itu sendiri rapuh: satu perubahan format dari Core Banking
akan membuatnya salah baca tanpa galat.

**Perbaikan:** hapus CBS Data Center, arahkan menunya ke Data Center Upload
yang memakai pengurai `xlsx` di server.

## 10. HR KPI

Memakai daftar pegawai yang nyata dari `allUsers`, lalu mencocokkannya dengan
KPI karangan.

**Dua pegawai fiktif.** `INITIAL_DB` berisi "Eko Prabowo" dan "Rina Marlina"
lengkap dengan target dan realisasi. Pencocokannya berdasarkan nama, jadi
pegawai sungguhan tidak akan pernah cocok.

**Setiap pegawai lain diberi nilai disiplin karangan.** Yang tidak cocok
mendapat nilai bawaan:

```js
{ title: 'Kehadiran', target: 22, actual: 22, unit: 'Hari' }
```

Kehadiran sempurna, 22 dari 22 hari, untuk semua orang, tanpa pernah melihat
data absensi. Padahal tabel `attendances` sudah terisi dari APK. Ini penilaian
kinerja yang dikarang, dan bila ikut memengaruhi insentif, akibatnya nyata.

**Proyek fiktif.** `HrProjectDashboard` memuat `MOCK_PROJECTS` — "Migrasi Core
Banking System (Fase 1)" dengan manajer Eko Prabowo — sementara modul Proyek
yang sungguhan sudah ada beserta tabelnya.

**Pemeriksaan peran yang tidak pernah benar.** `currentUser?.role === 'DIREKSI'
|| currentUser?.role === 'ADMIN'` — kedua nama itu tidak ada dalam daftar peran
sistem, jadi `isSuperAdmin` selalu bernilai salah.

**Perbaikan:** buang `INITIAL_DB` dan `MOCK_PROJECTS`; hitung kehadiran dari
tabel `attendances`; ambil proyek dari tabel `projects`; perbaiki pemeriksaan
perannya.

---

## Urutan yang disarankan

**Mendesak — klaim yang tidak benar di layar**

1. Hapus lencana "SHA-256 Tamper-Proof Active" dan kolom IP karangan di Audit Log.
2. Buang nilai kehadiran 22/22 dan pegawai fiktif di HR KPI.
3. Perbaiki judul "10 Kredit Terbesar" di Dashboard Utama.

**Berdampak besar pada pekerjaan harian**

4. Pindahkan Funding Dashboard dari `localStorage` ke server.
5. Sertakan DPK pada Collection Management.
6. Hapus CBS Data Center, satukan ke Data Center Upload.
7. Tampilkan tanggal periode pada Dashboard Utama.

**Menyusul**

8. Tabel `audit_trail` di server dengan rantai hash yang sungguhan.
9. Tabel `restrukturisasi` dengan syarat lama dan baru.
10. Kaitkan janji bayar ke nomor rekening, dan tandai yang lewat tanggal.
11. Pindahkan taksonomi dan validator BEIS ke server.
12. Isi atau sembunyikan PE Audit.
