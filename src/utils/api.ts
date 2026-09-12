/**
 * Pembaca balasan API.
 *
 * Masalah yang diselesaikan berkas ini nyata dan sempat memakan waktu lama.
 * Ketika sebuah rute API belum terpasang di server yang sedang berjalan,
 * permintaannya jatuh ke penangkap SPA dan dibalas `dist/index.html` dengan
 * status 200. Pemanggil lalu menjalankan `res.json()`, yang mencoba mengurai
 * halaman HTML itu dan melempar:
 *
 *     Unexpected token '<', "<!doctype "... is not valid JSON
 *
 * Pesan itu muncul apa adanya di layar pengguna. Isinya menunjuk ke pengurai
 * JSON, padahal penyebabnya ada di server, dan sama sekali tidak menyebut rute
 * mana yang hilang atau apa yang harus dilakukan. Halaman Proyek dan Peringatan
 * Dini keduanya pernah menampilkan persis kalimat itu.
 *
 * Server kini membalas 404 JSON untuk `/api/*` yang tidak dikenal, jadi kasus
 * itu tidak terjadi lagi pada binaan terbaru. Penjaga di sini tetap dipasang
 * karena peramban bisa saja berbicara dengan server yang lebih tua — yang
 * justru merupakan keadaan saat bug ini ditemukan — dan karena perantara
 * jaringan, halaman masuk Wi-Fi, atau gerbang proksi juga membalas HTML.
 */

/** Potongan awal badan balasan, dirapikan untuk ditempel di pesan galat. */
const cuplikan = (teks: string, maks = 120): string => {
  const rapi = teks.replace(/\s+/g, ' ').trim();
  return rapi.length > maks ? rapi.slice(0, maks) + '…' : rapi;
};

/**
 * Membaca badan balasan sebagai JSON, atau melempar galat yang menjelaskan
 * keadaan sebenarnya bila yang datang bukan JSON.
 *
 * Tidak melempar karena status HTTP — pemanggil sering perlu membaca badan
 * balasan galat (`{ error: ... }`) untuk menampilkan pesannya sendiri. Yang
 * dijaga di sini hanya satu hal: apa yang dikembalikan benar-benar JSON.
 */
export async function bacaJson(res: Response): Promise<any> {
  const teks = await res.text();

  if (teks.trim() === '') {
    if (res.ok) return {};
    throw new Error(`Server membalas kosong dengan status ${res.status}.`);
  }

  try {
    return JSON.parse(teks);
  } catch {
    const sepertiHalaman = /^\s*(<!doctype|<html)/i.test(teks);
    if (sepertiHalaman) {
      throw new Error(
        'Server membalas halaman web, bukan data. Biasanya ini berarti '
        + 'endpoint yang diminta belum ada di server yang sedang berjalan — '
        + 'backend-nya perlu dibangun ulang dan dijalankan ulang.',
      );
    }
    throw new Error(
      `Balasan server tidak dapat dibaca sebagai JSON (status ${res.status}): ${cuplikan(teks)}`,
    );
  }
}

/**
 * Header penanda sesi.
 *
 * Dipisah tersendiri karena unggahan berkas memakai `FormData`, dan pada
 * permintaan seperti itu `Content-Type` tidak boleh disetel sendiri — peramban
 * perlu menuliskannya lengkap dengan pembatas bagian. Jadi ada pemanggil yang
 * hanya butuh potongan Authorization-nya saja.
 */
export function headerAuth(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * `fetch` yang selalu menyertakan token dan membaca hasilnya lewat
 * {@link bacaJson}. Mengembalikan balasan mentahnya juga supaya pemanggil tetap
 * bisa memeriksa `res.ok` dan status.
 */
export async function ambilApi(
  jalur: string,
  opsi: RequestInit = {},
): Promise<{ res: Response; json: any }> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(jalur, {
    ...opsi,
    headers: {
      ...(opsi.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opsi.headers ?? {}),
    },
  });
  return { res, json: await bacaJson(res) };
}

/**
 * Membersihkan jejak sesi di peramban saat pengguna keluar.
 *
 * Bukan hanya tokennya. `task_form_draft` menyimpan isi formulir aktivitas yang
 * belum dikirim, dan deskripsi tugas sering memuat nama nasabah. Draf itu
 * bertahan sampai dihapus, jadi pada komputer bersama isian orang sebelumnya
 * terbuka untuk orang berikutnya.
 */
export function bersihkanSesi(): void {
  const kunci = [
    'auth_token',
    'task_form_draft',
    'beis_categories',
    'beis_validators',
  ];
  for (const k of kunci) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* Peramban yang memblokir penyimpanan tidak boleh menggagalkan proses keluar. */
    }
  }
}
