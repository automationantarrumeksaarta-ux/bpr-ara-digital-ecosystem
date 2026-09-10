/**
 * Aturan siapa yang berhak melihat dan memutuskan sebuah tugas di Approval
 * Queue.
 *
 * Disalin apa adanya dari DecisionQueue.tsx (versi web) agar aplikasi dan web
 * memakai aturan yang persis sama. Layar Approval Queue versi APK sempat
 * hanya menyaring berdasarkan status, sehingga setiap pengguna melihat —
 * dan bisa menyetujui — seluruh tugas yang menunggu, termasuk yang bukan
 * wewenangnya.
 *
 * Aturan ini TIDAK boleh diubah tanpa mengubah versi web sekaligus.
 */

interface PenggunaAntrean {
  id: string;
  name?: string;
  role?: string;
  roleTier?: string;
  approverId?: string;
  assignedMemberTab?: string;
}

interface TugasAntrean {
  assignedTo?: string;
  validator?: string;
  escalatedTo?: string;
  status?: string;
}

/**
 * Apakah `approverId` berada di atas `userId` dalam rantai atasan — langsung
 * maupun berjenjang. Kunjungan dicatat supaya rantai yang melingkar tidak
 * membuat perulangan tak berujung.
 */
export function isDescendantApprover(
  allUsers: PenggunaAntrean[],
  userId: string | undefined,
  approverId: string,
): boolean {
  let currentId = userId;
  const visited = new Set<string>();
  while (currentId) {
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    const user = allUsers.find(u => u.id === currentId);
    if (!user || !user.approverId) return false;

    if (user.approverId === approverId) return true;
    currentId = user.approverId;
  }
  return false;
}

/**
 * Apakah tugas ini masuk antrean keputusan `currentUser`.
 *
 * Aturannya: HANYA yang secara eksplisit ditunjuk sebagai validator, atau
 * yang tugasnya dieskalasikan kepadanya. Untuk tier TOP yang tidak ditunjuk
 * sebagai validator, tugas baru tampil setelah divalidasi atasannya.
 */
export function isTugasAntreanSaya(
  tugas: TugasAntrean,
  currentUser: PenggunaAntrean | null | undefined,
  allUsers: PenggunaAntrean[],
): boolean {
  if (!currentUser) return false;

  const isEscalatedToMe = tugas.escalatedTo === currentUser.id;

  let isNamedValidator = false;
  if (tugas.validator && currentUser.name) {
    isNamedValidator = tugas.validator
      .split(',')
      .some(v => v.trim().toLowerCase() === currentUser.name!.trim().toLowerCase());
  }

  const isMyTask = isNamedValidator || isEscalatedToMe;
  if (!isMyTask) return false;

  if (currentUser.roleTier === 'TOP' && !isNamedValidator) {
    if (tugas.status !== 'Validated Closed' && tugas.status !== 'Improved') {
      return false;
    }
  }

  return true;
}
