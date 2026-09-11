/**
 * Rantai atasan–bawahan, satu sumber kebenaran.
 *
 * Atasan ditetapkan lewat menu Super Admin, kolom "Lapor / Arahkan Task Ke
 * (Atasan Langsung)", dan tersimpan di tabel `task_routes` sebagai pasangan
 * pegawai -> atasan. Di frontend nilainya hadir sebagai `taskRoutes` dari
 * AppContext.
 *
 * CATATAN PENTING soal sumber data. Di dalam kode ada JUGA medan `approverId`
 * pada tipe pengguna, dan `src/utils/approvalQueue.ts` menelusuri rantai atasan
 * memakai medan itu. Tetapi tabel `users` tidak pernah menyimpan approverId —
 * yang terisi hanyalah task_routes. Karena itu penelusuran berbasis approverId
 * praktis selalu berhenti di langkah pertama. Berkas ini memakai taskRoutes,
 * yaitu data yang benar-benar diisi lewat antarmuka admin.
 *
 * Aturan yang berlaku di Task Board:
 *
 *   Papan tugas saya berisi tugas SAYA SENDIRI ditambah tugas SELURUH bawahan
 *   saya, berjenjang ke bawah. Tugas rekan sejajar dan tugas atasan tidak
 *   termasuk.
 */

export type PetaAtasan = Record<string, string>;

export interface PenggunaHirarki {
  id: string;
  name?: string;
}

/**
 * Seluruh bawahan seseorang, berjenjang ke bawah.
 *
 * Penelusuran mencatat yang sudah dikunjungi supaya rantai yang tidak sengaja
 * melingkar — A melapor ke B, B melapor ke A — tidak membuat perulangan tak
 * berujung dan membekukan layar.
 */
export function semuaBawahan(taskRoutes: PetaAtasan, atasanId: string): Set<string> {
  const hasil = new Set<string>();
  if (!atasanId) return hasil;

  // pegawai -> atasan, dibalik menjadi atasan -> daftar pegawai.
  const anak = new Map<string, string[]>();
  for (const [pegawai, atasan] of Object.entries(taskRoutes ?? {})) {
    if (!atasan) continue;
    const daftar = anak.get(atasan) ?? [];
    daftar.push(pegawai);
    anak.set(atasan, daftar);
  }

  const antre = [...(anak.get(atasanId) ?? [])];
  while (antre.length) {
    const id = antre.pop()!;
    if (hasil.has(id) || id === atasanId) continue;
    hasil.add(id);
    antre.push(...(anak.get(id) ?? []));
  }
  return hasil;
}

/** Apakah `atasanId` berada di atas `pegawaiId` dalam rantai, berjenjang. */
export function adalahAtasanDari(
  taskRoutes: PetaAtasan, atasanId: string, pegawaiId: string,
): boolean {
  let kini: string | undefined = pegawaiId;
  const dikunjungi = new Set<string>();
  while (kini) {
    if (dikunjungi.has(kini)) return false;
    dikunjungi.add(kini);
    const atasan: string | undefined = taskRoutes?.[kini];
    if (!atasan) return false;
    if (atasan === atasanId) return true;
    kini = atasan;
  }
  return false;
}

/** Apakah seseorang memegang bawahan. Dipakai menandai peran atasan. */
export const punyaBawahan = (taskRoutes: PetaAtasan, id: string): boolean =>
  Object.values(taskRoutes ?? {}).some(a => a === id);

/* ------------------------------------------------------------------ tugas */

interface TugasRingkas {
  pic?: string;
  assignedTo?: string;
  createdBy?: string;
  validator?: string;
  escalatedTo?: string;
}

/**
 * Nama-nama yang dianggap pemilik sebuah tugas.
 *
 * Tugas menyimpan ORANG sebagai teks nama (`pic`, `assignedTo`), bukan id,
 * sehingga pencocokan terpaksa lewat nama. Dibuat toleran terhadap perbedaan
 * huruf besar-kecil dan spasi berlebih, karena nama diketik manual di beberapa
 * tempat.
 */
const namaPemilik = (t: TugasRingkas): string[] =>
  [t.pic, t.assignedTo, t.createdBy]
    .filter(Boolean)
    .map(n => String(n).trim().toLowerCase());

/**
 * Apakah tugas ini pantas tampil di papan tugas `penggunaId`.
 *
 * Tampil bila salah satu benar:
 * - tugasnya miliknya sendiri;
 * - tugasnya milik salah satu bawahannya, berjenjang;
 * - dirinya ditunjuk sebagai validator, atau tugasnya dieskalasikan kepadanya
 *   (supaya tugas yang menunggu keputusannya tidak hilang dari pandangan).
 */
export function tugasTerlihatOleh(
  tugas: TugasRingkas,
  penggunaId: string,
  namaPengguna: string | undefined,
  taskRoutes: PetaAtasan,
  semuaPengguna: PenggunaHirarki[],
): boolean {
  if (!penggunaId) return false;

  const pemilik = namaPemilik(tugas);
  const saya = (namaPengguna ?? '').trim().toLowerCase();

  if (saya && pemilik.includes(saya)) return true;
  if (tugas.escalatedTo === penggunaId) return true;

  if (tugas.validator && saya) {
    const ditunjuk = tugas.validator
      .split(',')
      .some(v => v.trim().toLowerCase() === saya);
    if (ditunjuk) return true;
  }

  const bawahan = semuaBawahan(taskRoutes, penggunaId);
  if (bawahan.size === 0) return false;

  // Ubah id bawahan menjadi nama, karena tugas menyimpan nama.
  for (const id of bawahan) {
    const nama = semuaPengguna.find(u => u.id === id)?.name?.trim().toLowerCase();
    if (nama && pemilik.includes(nama)) return true;
  }
  return false;
}

/** Menyaring daftar tugas menjadi yang boleh dilihat seseorang. */
export function saringTugasUntuk<T extends TugasRingkas>(
  tugas: T[],
  penggunaId: string,
  namaPengguna: string | undefined,
  taskRoutes: PetaAtasan,
  semuaPengguna: PenggunaHirarki[],
): T[] {
  return (tugas ?? []).filter(t =>
    tugasTerlihatOleh(t, penggunaId, namaPengguna, taskRoutes, semuaPengguna));
}
