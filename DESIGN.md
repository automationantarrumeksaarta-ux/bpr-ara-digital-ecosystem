# Sistem desain — konsol web BPR ARA

Mode **Operate**: desain melayani pekerjaan. Keberhasilan diukur dari pegawai
menyelesaikan tugas tanpa ragu, bukan dari layar yang mengesankan.

Dokumen ini merekam dunia visual yang **sudah ada** di `src/index.css` dan
`src/components/ui/`, lalu menetapkan aturan yang selama ini tidak tertulis
sehingga tiap halaman menafsirkannya sendiri-sendiri.

---

## Token warna

Sumber tunggal: blok `@theme` di `src/index.css`. Selalu pakai nama token,
jangan angka slate/blue/emerald mentah.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `background` | `#F7F9FC` | Latar halaman |
| `surface` | `#FFFFFF` | Permukaan kartu, tabel, panel |
| `surface-muted` | `#F8FAFC` | Kepala tabel, panel sekunder, kolom antrean |
| `border` | `#E5EAF1` | Semua garis pemisah dan tepi kartu |
| `foreground` | `#172033` | Teks utama |
| `muted` | `#94A3B8` | Label, teks sekunder, placeholder |
| `primary` | `#0756B8` | Aksi utama, tahap berjalan, seleksi |
| `primary-light` | `#EAF3FF` | Latar terpilih, latar lencana primer |
| `primary-navy` | `#062E67` | Sidebar |
| `success` | `#10B981` | Lunas, disetujui, lancar |
| `warning` | `#F59E0B` | Menunggu, SLA mepet, kolektibilitas 2 |
| `danger` | `#EF4444` | Ditolak, macet, SLA terlampaui |

### Dua jebakan yang wajib diingat

1. **`emerald-*` bukan hijau.** Seluruh skala `--color-emerald-50…950` ditimpa
   menjadi biru di `index.css` (peninggalan pergantian warna merek). Jadi
   `bg-emerald-50 text-emerald-700` di layar tampil **biru**. Untuk hijau
   sungguhan pakai `success`. Setiap `emerald-*` yang ditemukan harus diputuskan:
   maksudnya "warna merek" (jadikan `primary`) atau "positif" (jadikan `success`).

2. **`dark:` mati total.** Baris 5 `index.css` mengalihkan varian `dark` ke kelas
   `.dark-disabled` yang tidak pernah dipasang. Ratusan kelas `dark:bg-slate-900`
   di seluruh kode tidak berpengaruh apa pun. Jangan tulis kelas `dark:` baru;
   hapus yang ditemui saat menyunting berkas.

### Aturan warna

Satu aksen: `primary`. Dipakai hanya untuk aksi utama, tahap yang sedang
berjalan, dan baris terpilih. Bukan untuk hiasan.

`success` / `warning` / `danger` hanya menyatakan **status**, tidak pernah
membedakan kategori. Tujuh halaman pipeline sebelumnya masing-masing memilih
aksennya sendiri (ungu, kuning, biru, emerald) tanpa arti — itu kebisingan, dan
sudah dihapus.

---

## Tipografi

Satu keluarga huruf, skala tetap dalam rem (bukan fluid — pengguna memakai DPI
yang sama sepanjang hari).

| Peran | Ukuran | Bobot |
|---|---|---|
| Judul halaman | `text-xl` (20px) | `font-bold` |
| Judul panel | `text-sm` (14px) | `font-bold` |
| Isi | `text-xs` (12px) | `font-medium` |
| Label kolom / kelompok | `text-[11px]` | `font-bold uppercase tracking-wide` |
| Angka sorotan | `text-2xl` (24px) | `font-bold` |

**Angka wajib `tabular-nums`.** Rupiah, persentase, rasio, tanggal, nomor
rekening. Tanpa ini lebar digit berubah-ubah dan kolom angka bergoyang tiap kali
data disegarkan. Ini bank; kolom angka harus rata.

Rangkaian huruf berjarak lebar (`tracking-wide`) hanya untuk label kecil huruf
besar. Judul memakai `tracking-tight`.

---

## Bentuk dan kedalaman

- Radius kartu **`rounded-2xl` (16px)**. Kontrol kecil `rounded-xl` (12px).
  Lencana dan pil `rounded-full`. Tidak ada radius lain.
- **Kedalaman dinyatakan sekali.** Kartu memakai `border border-border` dengan
  `shadow-sm`. Jangan pernah menumpuk bayangan lebar di atas garis 1px.
- **Kartu tidak bersarang.** Panel di dalam panel dibedakan dengan
  `surface-muted` dan garis, bukan kartu baru di dalam kartu.
- Tidak ada `border-left` berwarna setebal lebih dari 1px sebagai penanda status.
  Status dinyatakan lewat lencana.

---

## Tata letak

Semua halaman modul memakai `PageContainer` (`max-w-7xl`, `space-y-5`).

Urutan baku halaman tahap pipeline:

```
1. Rel tahap (chrome tipis, bukan kartu besar)
2. Judul halaman + tindakan utama
3. Angka ringkas          (bila tahap ini punya angka)
4. Saringan               (bila daftarnya panjang)
5. Isi: tabel, atau antrean + meja kerja
```

**Antrean + meja kerja** (`StageWorkbench`) dipakai tahap yang mengerjakan satu
berkas dalam satu waktu: Analisis, Komite, Legal. Kiri antrean sempit, kanan
meja kerja lebar. Sebelumnya tiga halaman menyalin kerangka ini kata per kata
dengan aksen berbeda-beda; sekarang satu komponen.

**Tabel** dipakai bila daftarnya bisa panjang: Origination, Agunan, Pencairan.
Batasnya kira-kira dua belas baris — di bawah itu orang masih menelusuri, di
atas itu orang mencari satu baris, dan mencari butuh kolom yang rata. Angka
rata kanan.

Perilaku responsif bersifat struktural: kolom runtuh, tabel menggulir di dalam
wadahnya sendiri. Bukan tipografi yang mengecil. Badan halaman tidak pernah
menggulir ke samping.

---

## Keadaan komponen

Setiap panel yang memuat data wajib punya **tiga** keadaan, dan yang kosong ada
**dua** ragam:

| Keadaan | Yang ditampilkan |
|---|---|
| Memuat | Kerangka (skeleton) setinggi hasil akhirnya, bukan pemutar di tengah |
| Kosong, memang belum ada | Menjelaskan apa yang akan muncul di sini dan tindakan untuk memulai |
| Kosong karena saringan | Menyebut saringannya dan menawarkan menghapusnya |
| Ada isi | — |

Ini bukan detail. Karena belum ada pengajuan tersimpan, **kosong adalah keadaan
yang paling sering dilihat pegawai.**

Setiap kontrol punya: normal, hover, fokus, aktif, nonaktif, memuat. Cincin
fokus terlihat dan diwarnai dari `ring`, tidak pernah `outline: none` tanpa
pengganti.

---

## Gerak

150–250ms untuk transisi. Gerak menyatakan perubahan keadaan, bukan hiasan.
Tidak ada koreografi saat halaman dimuat — pegawai masuk untuk bekerja, bukan
menonton.

---

## Bahasa

Bahasa Indonesia. Judul dan label memakai kalimat biasa, bukan istilah Inggris
yang ditempel.

Yang dihapus dan tidak boleh kembali:

- **Eyebrow / kicker** di atas judul. "CREDIT RISK ASSESSMENT ENGINE",
  "CREDIT COMMITTEE APPROVAL ENGINE", "LOAN DISBURSEMENT & PORTFOLIO ENGINE",
  "LEGALITY & NOTARIAL DOCUMENTATION". Judulnya sanggup berdiri sendiri.
- **Penomoran bagian** ("C. Modul Analisis & Valuation Agunan Kredit") bila
  urutannya tidak membawa informasi.
- `alert()` sebagai umpan balik.

Tombol menyebut tindakannya ("Cairkan Dana", bukan "Submit"). Pesan galat
menyebut masalah **dan** jalan keluarnya.

Nama tahap disimpan dalam bahasa Inggris di dalam kode (`PipelineStageName`
dipakai tujuh berkas sebagai tipe), tetapi **ditampilkan** dalam bahasa
Indonesia. Antarmuka berbahasa Indonesia, tipe tetap stabil.

---

## Yang tidak dipakai di sini

- Kartu seragam berisi ikon + judul + teks sebagai struktur halaman.
- Teks bergradien, kaca buram sebagai hiasan, bayangan tanpa offset.
- Monospace sebagai kostum "teknis". Angka memakai `tabular-nums`, bukan
  keluarga huruf mesin ketik.
- Modal untuk tugas yang tidak butuh interupsi.
- Emoji atau glif Unicode sebagai pengganti ikon. Ikon dari `lucide-react`,
  satu ketebalan garis.
