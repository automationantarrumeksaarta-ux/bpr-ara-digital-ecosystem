/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Alamat server API untuk build aplikasi native (Capacitor/Android).
   * Kosongkan untuk build web — web memakai origin-nya sendiri.
   * Contoh: VITE_API_BASE=https://api.bprara.co.id
   */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
