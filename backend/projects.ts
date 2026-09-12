import express from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { JWT_SECRET } from './keamanan.js';

/**
 * Modul Proyek.
 *
 * Sebelumnya proyek hanya hidup di dalam state React: `useGetProjects` memulai
 * dengan array kosong dan menambah ke state, tanpa tabel maupun endpoint. Apa
 * pun yang diketik hilang begitu halaman dimuat ulang, dan tidak ada seorang
 * pun selain pembuatnya yang bisa melihatnya. Tombol tambah pun hanya muncul
 * untuk peran 'Master Admin'.
 *
 * Sekarang proyek tersimpan sungguhan, siapa pun dapat ditetapkan sebagai
 * ketua, dan ketua beserta anggotanya mencatat laporan kemajuan di sana.
 *
 * Hak akses mengikuti pola yang sudah dipakai modul lain:
 * - Ketua dan anggota selalu melihat proyeknya sendiri.
 * - Atasan melihat proyek bawahannya, berjenjang, lewat task_routes.
 * - Peran tertentu melihat seluruh proyek.
 */

const router = express.Router();


const BOLEH_LIHAT_SEMUA = [
  'Super Admin', 'Master Admin', 'Direktur Utama', 'Direktur YMFK',
  'PE Kepatuhan, Manrisk & LK', 'Pengembangan SDM',
];

export function siapkanTabelProyek() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT,
      leader_id    TEXT NOT NULL,
      leader_name  TEXT,
      unit         TEXT,
      /* Anggota disimpan sebagai JSON berisi {id, name}. Jumlah anggota per
         proyek di BPR ini kecil, jadi tabel penghubung tersendiri hanya akan
         menambah kerumitan tanpa memberi apa pun. */
      members      TEXT DEFAULT '[]',
      deadline     TEXT,
      target       REAL DEFAULT 100,
      actual       REAL DEFAULT 0,
      status       TEXT DEFAULT 'On Track',
      created_by   TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_reports (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      author_id   TEXT NOT NULL,
      author_name TEXT,
      progress    REAL,
      body        TEXT NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_projects_leader ON projects(leader_id);
    CREATE INDEX IF NOT EXISTS idx_project_reports ON project_reports(project_id, created_at);
  `);
}
siapkanTabelProyek();

/* ------------------------------------------------------------------ bantu */

function penggunaDari(req: express.Request): { id: string; name: string; role: string; unit: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any;
    return db.prepare('SELECT id, name, role, unit FROM users WHERE id = ?').get(payload.id) as any ?? null;
  } catch {
    return null;
  }
}

/** Seluruh bawahan berjenjang menurut task_routes. */
function bawahanBerjenjang(atasanId: string): Set<string> {
  const baris = db.prepare('SELECT user_id, supervisor_id FROM task_routes').all() as any[];
  const anak = new Map<string, string[]>();
  for (const r of baris) {
    if (!r.supervisor_id) continue;
    const d = anak.get(r.supervisor_id) ?? [];
    d.push(r.user_id);
    anak.set(r.supervisor_id, d);
  }
  const hasil = new Set<string>();
  const antre = [...(anak.get(atasanId) ?? [])];
  while (antre.length) {
    const id = antre.pop()!;
    if (hasil.has(id) || id === atasanId) continue;
    hasil.add(id);
    antre.push(...(anak.get(id) ?? []));
  }
  return hasil;
}

const anggotaDari = (baris: any): { id: string; name?: string }[] => {
  try { return JSON.parse(baris.members ?? '[]'); } catch { return []; }
};

/** Apakah pengguna boleh melihat proyek ini. */
function bolehLihat(proyek: any, pengguna: any, bawahan: Set<string>): boolean {
  if (BOLEH_LIHAT_SEMUA.includes(pengguna.role)) return true;
  if (proyek.leader_id === pengguna.id) return true;
  if (proyek.created_by === pengguna.id) return true;
  if (anggotaDari(proyek).some(a => a.id === pengguna.id)) return true;
  if (bawahan.has(proyek.leader_id)) return true;
  return anggotaDari(proyek).some(a => bawahan.has(a.id));
}

/**
 * Apakah pengguna boleh mengubah proyek dan mencatat laporannya.
 *
 * Sengaja lebih sempit daripada hak melihat: atasan boleh memantau, tetapi
 * yang melaporkan kemajuan adalah orang yang mengerjakannya.
 */
const bolehLapor = (proyek: any, pengguna: any): boolean =>
  proyek.leader_id === pengguna.id ||
  proyek.created_by === pengguna.id ||
  anggotaDari(proyek).some(a => a.id === pengguna.id) ||
  BOLEH_LIHAT_SEMUA.includes(pengguna.role);

const STATUS_SAH = ['On Track', 'Delayed', 'At Risk', 'Completed'];

/* ------------------------------------------------------------------- rute */

/** Daftar proyek yang boleh dilihat pengguna. */
router.get('/', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  try {
    const bawahan = bawahanBerjenjang(pengguna.id);
    const semua = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[];
    const terlihat = semua.filter(p => bolehLihat(p, pengguna, bawahan));

    // Jumlah laporan per proyek, supaya daftar bisa menunjukkan yang mana
    // yang belum pernah dilaporkan sama sekali.
    const jumlahLaporan = db.prepare(`
      SELECT project_id, COUNT(*) AS n, MAX(created_at) AS terakhir
      FROM project_reports GROUP BY project_id
    `).all() as any[];
    const peta = new Map(jumlahLaporan.map(r => [r.project_id, r]));

    res.json({
      success: true,
      data: terlihat.map(p => ({
        ...p,
        members: anggotaDari(p),
        jumlahLaporan: peta.get(p.id)?.n ?? 0,
        laporanTerakhir: peta.get(p.id)?.terakhir ?? null,
        bolehLapor: bolehLapor(p, pengguna),
      })),
      bolehLihatSemua: BOLEH_LIHAT_SEMUA.includes(pengguna.role),
    });
  } catch (e) {
    console.error('Fetch projects error:', e);
    res.status(500).json({ error: 'Gagal memuat proyek' });
  }
});

/**
 * Buat proyek.
 *
 * Siapa pun yang sudah masuk boleh membuat proyek dan menetapkan siapa pun
 * sebagai ketuanya — termasuk dirinya sendiri. Itulah yang diminta: kepemimpinan
 * proyek tidak terikat jabatan.
 */
router.post('/', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  const { title, description, leaderId, members, deadline, target, status, unit } = req.body ?? {};

  if (!String(title ?? '').trim()) {
    return res.status(400).json({ error: 'Nama proyek wajib diisi.' });
  }
  if (!leaderId) {
    return res.status(400).json({ error: 'Ketua proyek wajib ditentukan.' });
  }
  const ketua = db.prepare('SELECT id, name, unit FROM users WHERE id = ?').get(leaderId) as any;
  if (!ketua) {
    return res.status(400).json({ error: 'Ketua proyek tidak dikenali.' });
  }
  if (status && !STATUS_SAH.includes(status)) {
    return res.status(400).json({ error: `Status harus salah satu dari: ${STATUS_SAH.join(', ')}` });
  }

  try {
    const id = `PRJ-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const daftarAnggota = Array.isArray(members)
      ? members.filter((m: any) => m?.id).map((m: any) => ({ id: m.id, name: m.name ?? null }))
      : [];

    db.prepare(`
      INSERT INTO projects (
        id, title, description, leader_id, leader_name, unit, members,
        deadline, target, actual, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id, String(title).trim(), String(description ?? '').trim() || null,
      ketua.id, ketua.name, unit || ketua.unit || null,
      JSON.stringify(daftarAnggota),
      deadline || null, Number(target) > 0 ? Number(target) : 100,
      status || 'On Track', pengguna.id,
    );

    const baru = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    res.json({ success: true, data: { ...baru, members: anggotaDari(baru) } });
  } catch (e) {
    console.error('Create project error:', e);
    res.status(500).json({ error: 'Gagal menyimpan proyek' });
  }
});

/** Ubah proyek. Hanya ketua, pembuat, anggota, atau peran berwenang. */
router.put('/:id', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  const proyek = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!proyek) return res.status(404).json({ error: 'Proyek tidak ditemukan' });
  if (!bolehLapor(proyek, pengguna)) {
    return res.status(403).json({ error: 'Hanya ketua, anggota, atau pembuat proyek yang dapat mengubahnya.' });
  }

  const { title, description, leaderId, members, deadline, target, actual, status } = req.body ?? {};
  if (status && !STATUS_SAH.includes(status)) {
    return res.status(400).json({ error: `Status harus salah satu dari: ${STATUS_SAH.join(', ')}` });
  }

  try {
    let ketua = { id: proyek.leader_id, name: proyek.leader_name };
    if (leaderId && leaderId !== proyek.leader_id) {
      const u = db.prepare('SELECT id, name FROM users WHERE id = ?').get(leaderId) as any;
      if (!u) return res.status(400).json({ error: 'Ketua proyek tidak dikenali.' });
      ketua = u;
    }

    db.prepare(`
      UPDATE projects SET
        title = ?, description = ?, leader_id = ?, leader_name = ?, members = ?,
        deadline = ?, target = ?, actual = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      String(title ?? proyek.title).trim(),
      description !== undefined ? (String(description).trim() || null) : proyek.description,
      ketua.id, ketua.name,
      members !== undefined
        ? JSON.stringify((members ?? []).filter((m: any) => m?.id).map((m: any) => ({ id: m.id, name: m.name ?? null })))
        : proyek.members,
      deadline !== undefined ? (deadline || null) : proyek.deadline,
      Number(target) > 0 ? Number(target) : proyek.target,
      actual !== undefined ? Math.max(0, Number(actual) || 0) : proyek.actual,
      status || proyek.status,
      proyek.id,
    );

    const baru = db.prepare('SELECT * FROM projects WHERE id = ?').get(proyek.id) as any;
    res.json({ success: true, data: { ...baru, members: anggotaDari(baru) } });
  } catch (e) {
    console.error('Update project error:', e);
    res.status(500).json({ error: 'Gagal menyimpan perubahan' });
  }
});

/** Laporan kemajuan sebuah proyek. */
router.get('/:id/reports', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  const proyek = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!proyek) return res.status(404).json({ error: 'Proyek tidak ditemukan' });
  if (!bolehLihat(proyek, pengguna, bawahanBerjenjang(pengguna.id))) {
    return res.status(403).json({ error: 'Anda tidak berwenang melihat proyek ini.' });
  }

  const laporan = db.prepare(`
    SELECT * FROM project_reports WHERE project_id = ? ORDER BY created_at DESC
  `).all(proyek.id);
  res.json({ success: true, data: laporan });
});

/**
 * Catat laporan kemajuan.
 *
 * Selain menyimpan laporannya, `actual` proyek ikut diperbarui bila laporannya
 * menyertakan angka kemajuan — supaya persentase pada daftar selalu berasal
 * dari laporan terakhir, bukan dari isian terpisah yang bisa berbeda.
 */
router.post('/:id/reports', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  const proyek = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!proyek) return res.status(404).json({ error: 'Proyek tidak ditemukan' });
  if (!bolehLapor(proyek, pengguna)) {
    return res.status(403).json({ error: 'Hanya ketua, anggota, atau pembuat proyek yang dapat melapor.' });
  }

  const { body, progress, status } = req.body ?? {};
  if (!String(body ?? '').trim()) {
    return res.status(400).json({ error: 'Isi laporan tidak boleh kosong.' });
  }
  if (status && !STATUS_SAH.includes(status)) {
    return res.status(400).json({ error: `Status harus salah satu dari: ${STATUS_SAH.join(', ')}` });
  }

  try {
    const id = `RPT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const angka = progress === undefined || progress === null || progress === ''
      ? null
      : Math.max(0, Math.min(Number(proyek.target) || 100, Number(progress) || 0));

    const jalankan = db.transaction(() => {
      db.prepare(`
        INSERT INTO project_reports (id, project_id, author_id, author_name, progress, body)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, proyek.id, pengguna.id, pengguna.name, angka, String(body).trim());

      if (angka !== null || status) {
        db.prepare(`
          UPDATE projects SET
            actual = COALESCE(?, actual),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(angka, status ?? null, proyek.id);
      }
    });
    jalankan();

    const baru = db.prepare('SELECT * FROM projects WHERE id = ?').get(proyek.id) as any;
    res.json({
      success: true,
      laporan: db.prepare('SELECT * FROM project_reports WHERE id = ?').get(id),
      proyek: { ...baru, members: anggotaDari(baru) },
    });
  } catch (e) {
    console.error('Create project report error:', e);
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
});

export default router;
