import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ara_secret_key_2026';

function penggunaDari(req: express.Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any;
    return db
      .prepare('SELECT id, name, role, roleTier FROM users WHERE id = ?')
      .get(payload.id) as { id: string; name: string; role: string; roleTier: string } | undefined ?? null;
  } catch {
    return null;
  }
}

const BOLEH_SETUJUI = ['Super Admin', 'Master Admin', 'Pengembangan SDM', 'Admin Legal & SDM'];

/**
 * Slip gaji milik pengguna yang sedang masuk.
 *
 * Hanya yang berstatus APPROVED yang dikembalikan. Slip berstatus DRAFT masih
 * bisa berubah di halaman Payroll web, dan menampilkannya ke pegawai sebagai
 * angka final akan menimbulkan sengketa saat nilainya berubah.
 */
router.get('/me', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const slips = db.prepare(`
      SELECT * FROM payroll_slips
      WHERE employee_id = ? AND status = 'APPROVED'
      ORDER BY period DESC
      LIMIT 12
    `).all(pengguna.id) as any[];

    const denganTotal = slips.map(s => ({
      ...s,
      totalPendapatan: (s.base_salary || 0) + (s.meal_allowance || 0) + (s.incentive || 0),
      totalPotongan: s.deductions || 0,
      gajiBersih: (s.base_salary || 0) + (s.meal_allowance || 0) + (s.incentive || 0) - (s.deductions || 0),
    }));

    res.json({ success: true, data: denganTotal });
  } catch (error: any) {
    console.error('Fetch payslip error:', error);
    res.status(500).json({ error: 'Gagal memuat slip gaji' });
  }
});

/**
 * Simpan / setujui slip gaji dari halaman Payroll web.
 *
 * Sebelumnya status persetujuan hanya disimpan di state React
 * (payrollStatus di PayrollView), sehingga hilang begitu halaman ditutup dan
 * tidak pernah sampai ke pegawai.
 */
router.post('/slips', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Unauthorized' });
  if (!BOLEH_SETUJUI.includes(pengguna.role) && !BOLEH_SETUJUI.includes(pengguna.roleTier)) {
    return res.status(403).json({ error: 'Hanya HR/Admin yang dapat menyetujui slip gaji' });
  }

  try {
    const {
      period, employee_id, employee_name, role,
      base_salary, meal_allowance, incentive, deductions,
      macro_grade, status,
    } = req.body;

    if (!period || !employee_id) {
      return res.status(400).json({ error: 'period dan employee_id wajib diisi' });
    }

    const disetujui = status === 'APPROVED';
    const id = `${period}-${employee_id}`;

    db.prepare(`
      INSERT INTO payroll_slips
        (id, period, employee_id, employee_name, role, base_salary, meal_allowance,
         incentive, deductions, macro_grade, status, approved_by, approved_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(period, employee_id) DO UPDATE SET
        employee_name = excluded.employee_name, role = excluded.role,
        base_salary = excluded.base_salary, meal_allowance = excluded.meal_allowance,
        incentive = excluded.incentive, deductions = excluded.deductions,
        macro_grade = excluded.macro_grade, status = excluded.status,
        approved_by = excluded.approved_by, approved_at = excluded.approved_at,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      id, period, employee_id, employee_name ?? null, role ?? null,
      Number(base_salary) || 0, Number(meal_allowance) || 0,
      Number(incentive) || 0, Number(deductions) || 0,
      macro_grade ?? null, disetujui ? 'APPROVED' : 'DRAFT',
      disetujui ? pengguna.name : null,
      disetujui ? new Date().toISOString() : null,
    );

    res.json({ success: true, message: disetujui ? 'Slip gaji disetujui' : 'Slip gaji disimpan' });
  } catch (error: any) {
    console.error('Save payslip error:', error);
    res.status(500).json({ error: 'Gagal menyimpan slip gaji' });
  }
});

export default router;
