/**
 * Mengecilkan gambar di sisi peramban menjadi data URL.
 *
 * Dipakai untuk foto profil, dan sengaja TIDAK memakai unggah berkas biasa.
 *
 * Alasannya ada di dalam APK. Capacitor mengambil alih `window.fetch` dan
 * meneruskan permintaan lewat lapisan HTTP native. Isi permintaan dibaca dengan
 * `new TextDecoder().decode(...)` — byte gambar diperlakukan sebagai teks
 * UTF-8. Setiap berkas biner rusak di titik itu, jadi unggah multipart dari
 * dalam APK tidak akan pernah berhasil selama CapacitorHttp menyala.
 *
 * Masalah kedua: endpoint unggah mengembalikan alamat relatif seperti
 * `/uploads/foto.jpg`. Di web itu benar, tetapi di APK halaman disajikan dari
 * `http://localhost` sehingga alamat itu menunjuk ke server lokal Capacitor,
 * bukan ke server BPR. Fotonya tidak akan pernah tampil sekalipun unggahnya
 * berhasil.
 *
 * Data URL menyelesaikan keduanya sekaligus: dikirim sebagai JSON biasa lewat
 * endpoint profil yang sudah ada, dan gambarnya menempel pada datanya sendiri
 * sehingga tidak bergantung pada alamat mana pun.
 */

/** Batas wajar untuk foto profil; di atas ini ditolak. */
export const BATAS_DATA_URL = 300 * 1024;

export interface OpsiKecilkan {
  /** Sisi terpanjang setelah dikecilkan. */
  maksPiksel?: number;
  /** Mutu JPEG 0–1. */
  mutu?: number;
  /**
   * Potong menjadi bujur sangkar dari bagian tengah. Benar untuk foto profil
   * yang selalu tampil di dalam lingkaran, tetapi SALAH untuk foto dokumen —
   * memotong KTP menjadi bujur sangkar akan membuang nomor induknya.
   */
  potongPersegi?: boolean;
  /** Batas ukuran hasil; dokumen perlu lebih besar daripada foto profil. */
  batasByte?: number;
}

/**
 * Mengubah berkas gambar menjadi data URL JPEG yang sudah dikecilkan dan
 * dipotong menjadi bujur sangkar dari bagian tengahnya.
 *
 * Foto profil selalu ditampilkan di dalam lingkaran, jadi memotong di tengah
 * sejak awal lebih jujur daripada memampatkan gambar lalu memotongnya lewat
 * CSS — yang tersimpan sama dengan yang terlihat.
 */
export function kecilkanGambar(
  berkas: File,
  { maksPiksel = 256, mutu = 0.78, potongPersegi = true, batasByte = BATAS_DATA_URL }: OpsiKecilkan = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!berkas.type.startsWith('image/')) {
      reject(new Error('Berkas yang dipilih bukan gambar.'));
      return;
    }

    const pembaca = new FileReader();
    pembaca.onerror = () => reject(new Error('Gagal membaca berkas.'));
    pembaca.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => reject(new Error('Gambar tidak dapat dibuka. Coba foto lain.'));
      gambar.onload = () => {
        try {
          // Wilayah sumber: seluruh gambar, atau bujur sangkar di tengahnya.
          const sisi = Math.min(gambar.width, gambar.height);
          const sx = potongPersegi ? (gambar.width - sisi) / 2 : 0;
          const sy = potongPersegi ? (gambar.height - sisi) / 2 : 0;
          const sw = potongPersegi ? sisi : gambar.width;
          const sh = potongPersegi ? sisi : gambar.height;

          const skala = Math.min(1, maksPiksel / Math.max(sw, sh));
          const lebar = Math.max(1, Math.round(sw * skala));
          const tinggi = Math.max(1, Math.round(sh * skala));

          const kanvas = document.createElement('canvas');
          kanvas.width = lebar;
          kanvas.height = tinggi;
          const ctx = kanvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Peramban tidak mendukung pengolahan gambar.'));
            return;
          }
          ctx.drawImage(gambar, sx, sy, sw, sh, 0, 0, lebar, tinggi);

          let hasil = kanvas.toDataURL('image/jpeg', mutu);

          // Foto dari kamera ponsel bisa tetap besar walau sudah dikecilkan.
          // Turunkan mutunya bertahap daripada menolak mentah-mentah.
          let mutuTurun = mutu;
          while (hasil.length > batasByte && mutuTurun > 0.4) {
            mutuTurun -= 0.12;
            hasil = kanvas.toDataURL('image/jpeg', mutuTurun);
          }

          if (hasil.length > batasByte) {
            reject(new Error('Foto terlalu besar untuk disimpan. Pilih foto lain.'));
            return;
          }
          resolve(hasil);
        } catch (e: any) {
          reject(new Error(e?.message ?? 'Gagal mengolah gambar.'));
        }
      };
      gambar.src = String(pembaca.result);
    };
    pembaca.readAsDataURL(berkas);
  });
}
