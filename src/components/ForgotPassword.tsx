import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';

/**
 * Alur lupa kata sandi: minta kode ke email terdaftar, lalu setel ulang.
 *
 * Server sengaja memberi jawaban yang sama baik akun terdaftar maupun tidak,
 * supaya alamat email mana yang punya akun tidak bisa ditebak dari luar.
 * Karena itu layar ini juga tidak menampilkan alamat email tujuan — hanya
 * mengarahkan pengguna membuka email terdaftarnya.
 */

interface ForgotPasswordProps {
  onKembali: () => void;
  /** Nilai yang sudah diketik di layar masuk, supaya tidak perlu diketik ulang. */
  identifierAwal?: string;
}

type Langkah = 'minta' | 'setel' | 'selesai';

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onKembali, identifierAwal = '' }) => {
  const [langkah, setLangkah] = useState<Langkah>('minta');
  const [identifier, setIdentifier] = useState(identifierAwal);
  const [otpCode, setOtpCode] = useState('');
  const [sandiBaru, setSandiBaru] = useState('');
  const [ulangi, setUlangi] = useState('');
  const [lihat, setLihat] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [error, setError] = useState('');

  const kotak =
    'w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] ' +
    'text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none ' +
    'focus:border-gray-400 transition-colors';

  const tombol =
    'w-full flex items-center justify-center px-6 py-4 bg-gray-900 hover:bg-black dark:bg-white ' +
    'dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl shadow-md ' +
    'transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed';

  const mintaKode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setMemproses(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Gagal mengirim kode');
      setLangkah('setel');
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan');
    } finally {
      setMemproses(false);
    }
  };

  const setelUlang = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemproses(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otpCode: otpCode.trim(), newPassword: sandiBaru }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Gagal menyetel ulang kata sandi');
      setLangkah('selesai');
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan');
    } finally {
      setMemproses(false);
    }
  };

  const siapSetel = otpCode.trim().length >= 4 && sandiBaru.length >= 8 && sandiBaru === ulangi;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onKembali}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke halaman masuk
      </button>

      {langkah === 'minta' && (
        <form onSubmit={mintaKode} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lupa kata sandi</h2>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan username atau email akun Anda. Kami akan mengirim kode verifikasi ke email terdaftar.
            </p>
          </div>

          <div className="relative flex items-center">
            <Mail className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Username atau email"
              autoFocus
              className={`${kotak} pl-12`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={!identifier.trim() || memproses} className={tombol}>
            {memproses ? 'Mengirim…' : 'Kirim kode verifikasi'}
          </button>
        </form>
      )}

      {langkah === 'setel' && (
        <form onSubmit={setelUlang} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Masukkan kode & kata sandi baru</h2>
            <p className="text-sm text-gray-500 mt-1">
              Bila akun terdaftar, kode 6 digit telah dikirim ke email terdaftarnya. Kode berlaku 10 menit.
            </p>
          </div>

          <div className="relative flex items-center">
            <KeyRound className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Kode 6 digit"
              inputMode="numeric"
              autoFocus
              className={`${kotak} pl-12 tracking-[0.3em] font-bold`}
            />
          </div>

          <input
            type={lihat ? 'text' : 'password'}
            value={sandiBaru}
            onChange={e => setSandiBaru(e.target.value)}
            placeholder="Kata sandi baru (min. 8 karakter)"
            className={kotak}
          />
          <input
            type={lihat ? 'text' : 'password'}
            value={ulangi}
            onChange={e => setUlangi(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            className={kotak}
          />

          <button
            type="button"
            onClick={() => setLihat(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {lihat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          </button>

          {ulangi.length > 0 && sandiBaru !== ulangi && (
            <p className="text-xs font-bold text-red-600">Ulangan kata sandi belum sama.</p>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={!siapSetel || memproses} className={tombol}>
            {memproses ? 'Menyimpan…' : 'Setel ulang kata sandi'}
          </button>

          <button
            type="button"
            onClick={() => { setLangkah('minta'); setError(''); }}
            className="w-full text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Tidak menerima kode? Kirim ulang
          </button>
        </form>
      )}

      {langkah === 'selesai' && (
        <div className="space-y-4 text-center py-4">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" strokeWidth={1.5} />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kata sandi berhasil diganti</h2>
            <p className="text-sm text-gray-500 mt-1">Silakan masuk memakai kata sandi baru Anda.</p>
          </div>
          <button type="button" onClick={onKembali} className={tombol}>
            Masuk sekarang
          </button>
        </div>
      )}
    </div>
  );
};
