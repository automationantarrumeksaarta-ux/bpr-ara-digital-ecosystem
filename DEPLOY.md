# Menerapkan perubahan ke server

## Perintahnya

```bash
cd /root/bpr-ara-digital-ecosystem
git pull
npm install
npm run build          # berhenti di sini bila ada yang gagal — jangan lanjut
pm2 restart bpr-ara-app --update-env
```

Lalu **selalu** periksa hasilnya:

```bash
curl -s localhost:3535/api/health
```

Balasannya memuat `binaan.dibangunPada`. Bila waktunya bukan beberapa saat yang
lalu, berarti yang berjalan bukan kode yang baru saja ditarik, dan penerapannya
belum berhasil betapa pun mulusnya perintah di atas terlihat.

## Kenapa pemeriksaan itu wajib

Pernah terjadi backend di server tertinggal berhari-hari tanpa satu pun tanda di
layar. Modul Proyek, CRM, dan Peringatan Dini gagal dibuka dengan pesan
`Unexpected token '<', "<!doctype "... is not valid JSON`, sementara semua
halaman lain tampak mutakhir.

Tiga hal bertemu dan saling menutupi:

1. **Skrip build dulu berbunyi `vite build && esbuild ...`.** Ketika `vite build`
   gagal, esbuild tidak pernah dijalankan, sehingga `dist/server.cjs` yang lama
   tetap di tempatnya.
2. **Server berjalan dalam mode pengembangan.** Pada mode ini frontend disajikan
   Vite langsung dari kode sumber, disusun ulang setiap permintaan. Jadi tampilan
   ikut berubah begitu `git pull` selesai, tanpa perlu build maupun restart.
   Backend tidak begitu: rutenya didaftarkan sekali saat proses menyala, dari
   bundel `dist/server.cjs`.
3. **Rute API yang belum terpasang dulu dibalas halaman SPA** dengan status 200,
   sehingga galatnya muncul sebagai kesalahan pengurai JSON di peramban, bukan
   sebagai rute yang tidak ditemukan.

Akibatnya `pm2 restart` dijalankan lebih dari seratus kali dan setiap kali
berhasil — yang dijalankan ulang memang bundel yang sama.

Ketiganya sudah ditutup:

- `npm run build` kini menghapus `dist/server.cjs` lebih dulu. Setelah build,
  bundelnya pasti baru, atau tidak ada sama sekali. Tidak pernah basi. Bila
  `vite build` gagal, `pm2 restart` akan gagal nyaring karena berkasnya hilang,
  bukan diam-diam menjalankan kode lama.
- `npm run build:server` dan `npm run build:web` dapat dijalankan terpisah. Bila
  `vite build` gagal karena kehabisan memori — penyebab paling lazim di VPS kecil
  untuk bundel sebesar ini — `npm run build:server` tetap dapat memperbarui
  backend sendirian.
- `/api/health` melaporkan daftar rute yang terpasang, berkas yang dijalankan,
  kapan berkas itu dibangun, dan modenya. Log saat menyala mencetak hal yang
  sama, jadi `pm2 logs bpr-ara-app` juga menjawabnya.
- Rute `/api/*` yang tidak dikenal dibalas 404 JSON yang menyebutkan jalurnya.

## Mode produksi

Saat ini pm2 menjalankan `node dist/server.cjs` tanpa `NODE_ENV`, sehingga server
menyala dalam mode pengembangan. Dua akibatnya:

- Kode sumber dapat dibaca siapa pun yang membuka alamat server.
- Frontend dan backend bisa berbeda versi, persis seperti kejadian di atas.

Beralih ke mode produksi:

```bash
pm2 delete bpr-ara-app
cd /root/bpr-ara-digital-ecosystem
pm2 start npm --name bpr-ara-app -- start
pm2 save
```

`npm start` sudah menyetel `NODE_ENV=production`. Setelah itu frontend dilayani
dari `dist/`, jadi tampilan dan backend tidak bisa lagi berbeda versi: keduanya
ikut berubah hanya setelah build dan restart yang berhasil.

## Data

Beberapa modul menghitung seluruh angkanya dari berkas yang diunggah, dan tidak
menampilkan apa pun sebelum berkasnya ada:

| Modul | Sumber |
| --- | --- |
| PE Kepatuhan (heat map) | Nominatif Kredit |
| Peringatan Dini (EWS) | Nominatif Kredit |
| CRM Nasabah | Nominatif Kredit, Tabungan, Deposito |

Unggah lewat menu Data Center. Agar peta sebaran terisi sampai tingkat desa dan
bukan hanya per kabupaten, berkas Nominatif Kredit harus memuat kolom kelurahan.
