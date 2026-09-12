# Audit modul — keterhubungan data dan risiko kebocoran

Ditelusuri 12 September 2026. Setiap temuan diperiksa dengan menjalankan kode
atau membaca isi basis data, bukan disimpulkan dari nama berkas.

Dokumen ini sengaja disimpan di dalam repo, bukan diterbitkan sebagai halaman.

---

## 1. Jalur data yang keluar dari bank

Setelah penjagaan akses dipasang, tidak ada lagi endpoint yang terbuka tanpa
login. Yang tersisa adalah jalur yang memang mengirim data ke luar atas
permintaan aplikasi sendiri.

### 1.1 Asisten AI mengirim data ke Google — saat ini putus karena salah nama field

`AiAssistantDrawer` menyusun `systemContext` berisi nama pengguna, metrik bank,
dan `sampleCustomers` — CIF, nama nasabah, dan kolektibilitasnya — lalu
mengirimnya ke `/api/ai/chat`, yang meneruskannya ke Google Gemini.

Yang menahannya hanya kebetulan: klien mengirim field bernama `context`,
sedangkan server membaca `contextData`. Nilainya selalu `undefined`, jadi yang
sampai ke Google adalah `{}`. Dua akibat sekaligus:

- Asisten AI menjawab tanpa konteks apa pun, sehingga jawabannya umum.
- Begitu ada yang "memperbaiki" nama field itu, nama dan CIF nasabah mulai
  mengalir ke pihak ketiga tanpa ada yang menyadari perubahannya.

Teks pertanyaan pengguna sendiri (`prompt`) memang benar-benar dikirim ke
Google. Bila seorang analis mengetik nama nasabah di sana, nama itu keluar.

**Perlu diputuskan:** apakah asisten AI boleh menerima data nasabah sama
sekali. Bila tidak, buang `sampleCustomers` dari `systemContext` dan beri
peringatan di layar bahwa pertanyaan dikirim ke layanan luar.

### 1.2 Pelapor galat bawaan AI Studio

`index.html` memasang `window.onerror` dan `unhandledrejection` yang mengirim
pesan galat beserta jejak tumpukan ke `http://localhost:3738`. Ini sisa
peralatan AI Studio. Di peramban pengguna alamat itu tidak ada, jadi
permintaannya gagal diam-diam — tetapi isinya tetap disiapkan dan dikirim, dan
jejak tumpukan dapat memuat potongan data yang sedang diproses.

**Perbaikan:** hapus dari `index.html`.

### 1.3 Sinkronisasi Google Calendar

`generateGoogleCalendarUrl()` menyusun tautan Google Calendar berisi deskripsi
tugas, nomor tugas BEIS, nama PIC, dan arahan atasan. Deskripsi tugas sering
memuat nama nasabah. Tautan itu dibuka di Google, jadi isinya keluar.

Selain itu `gcal_access_token` dan `gcal_user_email` disimpan di
`localStorage` oleh `DashboardManajemenTugas`. Token pihak ketiga di
penyimpanan peramban bertahan pada komputer bersama.

**Perbaikan:** bersihkan nama nasabah dari deskripsi sebelum dikirim, atau
kirim hanya nomor tugas dan tanggalnya.

### 1.4 Pengingat lewat WhatsApp

`sendWaReminder()` di dashboard Janji Bayar membuka WhatsApp dengan nama
nasabah, tanggal janji, dan nominalnya. Ini memang gunanya, tetapi berarti data
nasabah berpindah ke aplikasi pribadi petugas. Perlu disebut dalam kebijakan
internal, bukan diperbaiki di kode.

### 1.5 Draf formulir di peramban

`task_form_draft` menyimpan isi formulir aktivitas di `localStorage`, termasuk
deskripsi tugas yang bisa memuat nama nasabah. Draf bertahan sampai dihapus,
juga di komputer bersama.

**Perbaikan:** hapus draf setelah tugas tersimpan, dan saat pengguna keluar.

### 1.6 Server masih berjalan mode pengembangan

Selama `NODE_ENV` belum `production`, Vite menyajikan kode sumber aplikasi
kepada siapa pun yang membuka alamat server. Langkahnya ada di `DEPLOY.md`.

---

## 2. Keterhubungan data antar modul

Basis data hari ini berisi: `loans` 355 baris, `ews_alerts` 97, `ao_performance`
10, `funding_breakdowns` 6, `users` 2, `notifications` 2, `macro_financials` 1,
`beis_tasks` 1, `role_permissions` 1. Sisanya kosong.

### 2.1 Modul yang benar-benar terhubung

| Modul | Sumber | Keterangan |
| --- | --- | --- |
| CRM Nasabah | `loans`, `savings`, `deposits` | dirangkum per nama |
| Peringatan Dini (EWS) | `loans` | dihitung ulang tiap dibuka |
| PE Kepatuhan / Heat Map | `loans` | per kabupaten dan kelurahan |
| Dashboard eksekutif | `/api/metrics` | dari `macro_financials` |
| Papan Tugas | `beis_tasks` | web dan APK satu sumber |
| Marketing Activities | `activities` | ditulis APK, dibaca web |
| Proyek | `projects`, `project_reports` | |
| Absensi | `attendances` | hanya ada di APK |
| Notifikasi | `notifications` | |
| Pengguna dan izin | `users`, `role_permissions`, `task_routes` | |

### 2.2 Modul yang tidak tersimpan ke mana pun

Seluruh state berikut hidup hanya di memori React. Muat ulang halaman, isinya
hilang. Tidak ada tabelnya di basis data, dan tidak ada endpoint yang menulisnya.

| Modul | State | Akibat |
| --- | --- | --- |
| Pipeline Kredit 7 tahap | `creditApplications` | pengajuan hilang saat refresh |
| Fasilitas kredit | `loanFacilities` | tidak pernah terisi |
| Collection & Recovery | `collectionCases` | kosong, tidak terhubung ke `loans` |
| PTP Tracker | `ptpRecords` | kosong, penyimpanan tidak berfungsi |
| NPL & Restrukturisasi | `restructurings` | kosong |
| Audit Log | `auditTrail` | jejak audit tidak pernah tersimpan |
| HR KPI | `employeeScores` | kosong |
| Target Bunga | `targetBungaData` | kosong |
| Pencapaian Bisnis | `pencapaianBisnisData` | kosong |
| Analisis Agunan | `agunanData` | kosong |
| Customer 360 lama | `customers` | digantikan CRM |

Kabar baiknya, seluruh konstanta contohnya berisi array kosong — jadi layarnya
kosong, bukan menampilkan angka karangan.

### 2.3 Yang paling merugikan: Collection buta terhadap data yang sudah ada

`loans` memuat 355 rekening lengkap dengan kolektibilitas, tunggakan pokok dan
bunga, frekuensi tunggakan, nama AO, dan jatuh tempo — persis yang dibutuhkan
Collection & Recovery, PTP Tracker, dan NPL Restructuring. Ketiga modul itu
justru membaca array kosong.

Jadi data kredit bermasalah senilai Rp 6,3 miliar sudah ada di sistem, tetapi
modul penagihan tidak melihatnya sama sekali.

### 2.4 Penangan yang tidak melakukan apa-apa

`PtpTrackerView` dan `NplRestructuringView` memasang `onAddJanji={() => {}}` dan
`onUpdateJanji={() => {}}`. Petugas dapat mengisi formulir, menekan simpan,
melihatnya tampil sesaat — lalu hilang tanpa pesan galat. Keduanya juga
menuliskan `currentUser` secara tetap sebagai `Admin` / `Master Admin`, jadi
siapa pun yang membukanya tercatat sebagai admin.

### 2.5 Slip gaji: disetujui tetapi tidak tersimpan

`PayrollView` menyimpan persetujuan di `payrollStatus`, sebuah state React.
`POST /api/payroll/slips` sudah ada di server dan tidak pernah dipanggil, dan
tabel `payroll_slips` kosong. Sementara itu APK memanggil `GET /api/payroll/me`
untuk menampilkan slip.

Akibatnya rantainya putus di tengah: HR menyetujui slip, halaman dimuat ulang,
persetujuannya hilang, dan pegawai tidak pernah melihat slipnya di APK.

### 2.6 Pengajuan kredit mengarang isian yang kosong

`createCreditApplication()` mengisi sendiri field yang tidak diisi pemohon:

```
cif: 'CIF-00892'
customerName: 'Pemohon Kredit'
phone: '08123456789'
requestedPlafon: 150000000
requestedTenorMonths: 36
```

Pengajuan yang tidak lengkap menjadi berkas dengan CIF dan nomor telepon
karangan yang tampak sah. Karena CIF-nya sama untuk semua, dua pengajuan
berbeda akan tampak milik nasabah yang sama.

### 2.7 Dua sumber EWS yang berbeda

Ada dua: tabel `ews_alerts` (97 baris, ditulis saat unggah nominatif, dibaca
`GET /api/ews`) dan perhitungan langsung dari `loans` (`GET /api/ews/alerts`,
dipakai halaman Peringatan Dini). Keduanya memakai aturan berbeda dan dapat
memberi angka berbeda untuk rekening yang sama.

Lencana merah di bilah atas membaca `ewsAlerts` dari AppContext, yang isinya
array kosong — jadi hitungannya selalu nol berapa pun peringatan sebenarnya.

---

## 3. Urutan perbaikan yang disarankan

**Mendesak**

1. Hentikan pelapor galat di `index.html`.
2. Putuskan kebijakan asisten AI; minimal buang `sampleCustomers`.
3. Jalankan server dengan `NODE_ENV=production`.

**Berdampak besar pada pekerjaan harian**

4. Sambungkan Collection, PTP, dan NPL ke tabel `loans`, lengkap dengan tabel
   penyimpanan untuk janji bayar dan restrukturisasi.
5. Sambungkan persetujuan slip gaji ke `POST /api/payroll/slips`.
6. Buat tabel dan endpoint untuk pipeline kredit, atau nyatakan di layar bahwa
   modul itu belum menyimpan apa pun.
7. Hapus nilai karangan di `createCreditApplication()`; tolak pengajuan yang
   tidak lengkap.

**Kebersihan**

8. Satukan dua sumber EWS, dan sambungkan lencana merah ke sumber yang benar.
9. Hapus `currentUser` yang dipatok di PtpTrackerView dan NplRestructuringView.
10. Bersihkan draf formulir saat pengguna keluar.
