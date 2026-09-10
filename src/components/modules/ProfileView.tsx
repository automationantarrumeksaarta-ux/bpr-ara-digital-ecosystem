import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Briefcase, Camera, Check, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../ui/PageContainer';
import { Card } from '../ui/Card';

/**
 * Profil pengguna (web).
 *
 * Memakai endpoint yang sama dengan aplikasi — /api/auth/profile dan
 * /api/auth/password — dan menulis ke baris `users` yang sama. Tidak ada
 * salinan data profil terpisah di sisi web.
 *
 * Data kepegawaian hanya ditampilkan. Wewenang ditetapkan admin lewat menu
 * Super Admin; endpoint /profile pun mengabaikan role, unit, dan status, jadi
 * pembatasan ini tidak hanya di tampilan.
 */

const inisial = (nama: string) =>
  nama.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const kotakIsian =
  'w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 ' +
  'text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none ' +
  'focus:border-blue-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500';

const tombolUtama =
  'px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm ' +
  'transition-all hover:shadow disabled:opacity-40 disabled:cursor-not-allowed';

const Pesan: React.FC<{ teks: string; jenis: 'ok' | 'gagal' }> = ({ teks, jenis }) => (
  <div
    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
      jenis === 'ok'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
    }`}
  >
    {jenis === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
    <span>{teks}</span>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{children}</span>
);

export const ProfileView: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp() as any;

  const [nama, setNama] = useState(currentUser?.name ?? '');
  const [nik, setNik] = useState(currentUser?.nik ?? '');
  const [telepon, setTelepon] = useState(currentUser?.phone ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [pesanProfil, setPesanProfil] = useState<{ teks: string; jenis: 'ok' | 'gagal' } | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  /*
   * Isi ulang form begitu data pengguna tiba.
   *
   * currentUser masih null saat halaman ini pertama dirender — diambil
   * belakangan lewat /api/auth/me. Tanpa penyemaian ulang ini, kotak isian
   * tetap kosong walau datanya sudah ada, dan menekan Simpan justru
   * mengosongkan NIK serta nomor HP yang tersimpan di database.
   */
  const idTerpakai = useRef<string | null>(currentUser?.id ?? null);
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === idTerpakai.current) return;
    idTerpakai.current = currentUser.id;
    setNama(currentUser.name ?? '');
    setNik(currentUser.nik ?? '');
    setTelepon(currentUser.phone ?? '');
    setEmail(currentUser.email ?? '');
  }, [currentUser?.id]);

  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulangi, setUlangi] = useState('');
  const [lihat, setLihat] = useState(false);
  const [pesanSandi, setPesanSandi] = useState<{ teks: string; jenis: 'ok' | 'gagal' } | null>(null);

  // Menu "Ganti kata sandi" di topbar menuju /profile#sandi — bagian sandinya
  // langsung terbuka supaya tidak perlu satu klik lagi.
  const { hash } = useLocation();
  const [gantiSandi, setGantiSandi] = useState(hash === '#sandi');
  const kartuSandiRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hash !== '#sandi') return;
    setGantiSandi(true);
    kartuSandiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [hash]);

  const fotoRef = useRef<HTMLInputElement>(null);
  const [mengunggahFoto, setMengunggahFoto] = useState(false);

  const kirimProfil = async (data: Record<string, unknown>) => {
    setMenyimpan(true);
    setPesanProfil(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Gagal menyimpan');
      setCurrentUser(json.user);
      setPesanProfil({ teks: json.message ?? 'Tersimpan', jenis: 'ok' });
    } catch (e: any) {
      setPesanProfil({ teks: e?.message ?? 'Terjadi kesalahan', jenis: 'gagal' });
    } finally {
      setMenyimpan(false);
    }
  };

  const unggahFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMengunggahFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const hasil = await res.json();
      await kirimProfil({ avatar_url: hasil?.data?.url });
    } finally {
      setMengunggahFoto(false);
    }
  };

  const kirimSandi = async () => {
    setPesanSandi(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ currentPassword: lama, newPassword: baru }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Gagal mengganti kata sandi');
      setPesanSandi({ teks: json.message, jenis: 'ok' });
      setLama(''); setBaru(''); setUlangi('');
    } catch (e: any) {
      setPesanSandi({ teks: e?.message ?? 'Terjadi kesalahan', jenis: 'gagal' });
    }
  };

  const profilBerubah =
    nama !== (currentUser?.name ?? '') ||
    nik !== (currentUser?.nik ?? '') ||
    telepon !== (currentUser?.phone ?? '') ||
    email !== (currentUser?.email ?? '');

  const sandiSiap = lama.length > 0 && baru.length >= 8 && baru === ulangi;

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Profil Saya</h1>
      <p className="text-sm text-slate-500 mb-6">
        Perubahan di sini juga berlaku di aplikasi mobile — datanya sama.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* --- Foto & identitas --- */}
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <input ref={fotoRef} type="file" accept="image/*" onChange={unggahFoto} className="hidden" />
          <button type="button" onClick={() => fotoRef.current?.click()} className="relative group">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={nama} className="w-28 h-28 rounded-full object-cover" />
            ) : (
              <span className="w-28 h-28 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
                {inisial(nama)}
              </span>
            )}
            <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </span>
          </button>

          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white">{nama}</p>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
          </div>

          <button
            type="button"
            onClick={() => fotoRef.current?.click()}
            disabled={mengunggahFoto}
            className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
          >
            {mengunggahFoto ? 'Mengunggah…' : currentUser?.avatar_url ? 'Ganti foto' : 'Unggah foto'}
          </button>

          <div className="w-full pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Data Kepegawaian</span>
            </div>
            {[
              { label: 'Unit', nilai: currentUser?.unit },
              { label: 'Jabatan', nilai: currentUser?.role },
              { label: 'Status', nilai: currentUser?.status },
              { label: 'Username', nilai: currentUser?.username },
            ].filter(b => b.nilai).map(b => (
              <div key={b.label} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-slate-500">{b.label}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{b.nilai}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-400 mt-3 leading-snug">
              Ditetapkan oleh admin dan tidak dapat diubah sendiri. Hubungi bagian SDM bila ada yang keliru.
            </p>
          </div>
        </Card>

        {/* --- Informasi pribadi & kata sandi --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Informasi Pribadi</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nama lengkap</Label>
                <input value={nama} onChange={e => setNama(e.target.value)} className={kotakIsian} />
              </div>
              <div>
                <Label>NIK</Label>
                <input value={nik} onChange={e => setNik(e.target.value)} inputMode="numeric" className={kotakIsian} placeholder="Nomor induk kependudukan" />
              </div>
              <div>
                <Label>Nomor HP</Label>
                <input value={telepon} onChange={e => setTelepon(e.target.value)} inputMode="tel" className={kotakIsian} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={kotakIsian} />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Dipakai untuk kode verifikasi saat masuk dan saat lupa kata sandi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                disabled={!profilBerubah || !nama.trim() || menyimpan}
                onClick={() => kirimProfil({ name: nama, nik, phone: telepon, email })}
                className={tombolUtama}
              >
                {menyimpan ? 'Menyimpan…' : 'Simpan perubahan'}
              </button>
              {pesanProfil && <Pesan teks={pesanProfil.teks} jenis={pesanProfil.jenis} />}
            </div>
          </Card>

          <Card ref={kartuSandiRef} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kata Sandi</h2>
              </div>
              {!gantiSandi && (
                <button
                  type="button"
                  onClick={() => setGantiSandi(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Ganti kata sandi
                </button>
              )}
            </div>

            {!gantiSandi ? (
              <p className="text-sm text-slate-500">
                Gunakan kata sandi yang tidak dipakai di layanan lain. Minimal 8 karakter.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Kata sandi saat ini</Label>
                    <input type={lihat ? 'text' : 'password'} value={lama} onChange={e => setLama(e.target.value)} className={kotakIsian} />
                  </div>
                  <div>
                    <Label>Kata sandi baru</Label>
                    <input type={lihat ? 'text' : 'password'} value={baru} onChange={e => setBaru(e.target.value)} className={kotakIsian} />
                  </div>
                  <div>
                    <Label>Ulangi kata sandi baru</Label>
                    <input type={lihat ? 'text' : 'password'} value={ulangi} onChange={e => setUlangi(e.target.value)} className={kotakIsian} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLihat(v => !v)}
                  className="self-start flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {lihat ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {lihat ? 'Sembunyikan' : 'Tampilkan'} kata sandi
                </button>

                {baru.length > 0 && baru.length < 8 && (
                  <p className="text-xs font-bold text-rose-600">Kata sandi baru minimal 8 karakter.</p>
                )}
                {ulangi.length > 0 && baru !== ulangi && (
                  <p className="text-xs font-bold text-rose-600">Ulangan kata sandi belum sama.</p>
                )}

                <div className="flex items-center gap-3">
                  <button type="button" disabled={!sandiSiap} onClick={kirimSandi} className={tombolUtama}>
                    Ganti kata sandi
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGantiSandi(false); setLama(''); setBaru(''); setUlangi(''); setPesanSandi(null); }}
                    className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Batal
                  </button>
                  {pesanSandi && <Pesan teks={pesanSandi.teks} jenis={pesanSandi.jenis} />}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
