/**
 * Aturan hak akses menu — satu sumber kebenaran.
 *
 * Sebelumnya logika ini hanya hidup di dalam src/app/routes.tsx. Begitu layar
 * mobile juga perlu menyaring menu, menyalin logikanya akan membuat web dan
 * mobile perlahan berbeda — persis jenis masalah yang bikin user sah tidak
 * bisa membuka menunya. Jadi dipusatkan di sini.
 */
import { navigationConfig, type NavItem } from '../config/navigationConfig';

export type RolePermissions = Record<string, string[]>;

const ADMIN_ROLES = ['Super Admin', 'Master Admin'];

export const isAdminRole = (role: string | undefined): boolean =>
  !!role && ADMIN_ROLES.includes(role);

/**
 * Izin dinamis (diatur Super Admin lewat DB) menang atas `allowedRoles` statis.
 * Kalau peran belum punya izin dinamis sama sekali, jatuh ke daftar statis.
 */
export function isItemAllowed(
  item: NavItem,
  role: string | undefined,
  rolePermissions: RolePermissions | undefined,
): boolean {
  if (isAdminRole(role)) return true;
  if (!role) return false;

  const dinamis = rolePermissions?.[role];
  if (dinamis && dinamis.length > 0) return dinamis.includes(item.title);

  if (role === 'User') return false;
  return !item.allowedRoles || (item.allowedRoles as string[]).includes(role);
}

/** Semua item menu (termasuk anak menu) yang boleh diakses peran tersebut. */
export function accessibleItems(
  role: string | undefined,
  rolePermissions: RolePermissions | undefined,
): NavItem[] {
  const hasil: NavItem[] = [];
  for (const grup of navigationConfig) {
    for (const item of grup.items) {
      if (item.path && isItemAllowed(item, role, rolePermissions)) hasil.push(item);
      for (const anak of item.children ?? []) {
        if (anak.path && isItemAllowed(anak, role, rolePermissions)) hasil.push(anak);
      }
    }
  }
  return hasil;
}

/** Rute pertama yang boleh dibuka — dipakai sebagai tujuan setelah login. */
export function firstAccessibleRoute(
  role: string | undefined,
  rolePermissions: RolePermissions | undefined,
): string {
  if (isAdminRole(role)) return '/super-admin';
  return accessibleItems(role, rolePermissions)[0]?.path ?? '/dashboard';
}

/** Apakah sebuah path boleh dibuka peran tersebut. */
export function isPathAllowed(
  path: string,
  role: string | undefined,
  rolePermissions: RolePermissions | undefined,
): boolean {
  if (isAdminRole(role)) return true;

  for (const grup of navigationConfig) {
    for (const item of grup.items) {
      const semua = [item, ...(item.children ?? [])];
      for (const kandidat of semua) {
        if (kandidat.path && path.startsWith(kandidat.path)) {
          return isItemAllowed(kandidat, role, rolePermissions);
        }
      }
    }
  }
  // Path di luar navigationConfig (mis. /mobile/*) tidak diatur di sini.
  return true;
}
