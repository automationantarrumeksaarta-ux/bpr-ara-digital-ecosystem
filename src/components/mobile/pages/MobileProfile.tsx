import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Briefcase, Camera, Check, Eye, EyeOff, Lock, LogOut, User, X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Avatar, AppBar, Badge, Card, ListGroup, ListRow, Screen, Section, Stack } from '../ui/primitives';
import { ink, radius, surface, text, tone } from '../ui/tokens';

/**
 * Profil pegawai.
 *
 * Profil dan kata sandi ditulis ke baris `users` yang sama dengan web lewat
 * endpoint /api/auth/profile dan /api/auth/password — tidak ada salinan data
 * terpisah di aplikasi.
 *
 * Data kepegawaian (unit, jabatan, status) sengaja hanya bisa DILIHAT.
 * Wewenang pegawai ditetapkan admin; membiarkan pegawai mengubahnya sendiri
 * berarti membiarkannya menaikkan hak aksesnya. Endpoint /profile pun
 * mengabaikan field itu, jadi pembatasan ini tidak hanya di tampilan.
 */

type Lembar = null | 'profil' | 'pribadi' | 'sandi';

const MobileProfile: React.FC = () => {
  const { currentUser, setCurrentUser, setIsAuthenticated } = useApp() as any;
  const navigate = useNavigate();
  const [lembar, setLembar] = useState<Lembar>(null);

  const keluar = () => {
    // Token wajib dibuang. Versi sebelumnya hanya mengosongkan state React,
    // sehingga auth_token tetap tersimpan dan sesi hidup lagi setelah refresh.
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/', { replace: true });
  };

  const nama = currentUser?.name || 'Pengguna';

  return (
    <Screen>
      <AppBar title="Profil" />

      <Stack>
        <Card className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setLembar('profil')}
            aria-label="Ubah foto profil"
            className="relative shrink-0"
          >
            <Avatar name={nama} size={56} src={currentUser?.avatar_url} />
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-white">
              <Camera className="w-2.5 h-2.5 text-white" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className={`${text.headline} ${ink.strong} truncate`}>{nama}</p>
            <p className={`${text.footnote} ${ink.muted} truncate mt-0.5`}>{currentUser?.email ?? '—'}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {currentUser?.role && <Badge toneName="primary">{currentUser.role}</Badge>}
              {currentUser?.unit && <Badge>{currentUser.unit}</Badge>}
            </div>
          </div>
        </Card>

        <Section title="Akun">
          <ListGroup>
            <ListRow
              icon={User}
              title="Informasi pribadi"
              subtitle="Nama, NIK, no. HP, email"
              onClick={() => setLembar('pribadi')}
            />
            <ListRow
              icon={Briefcase}
              title="Data kepegawaian"
              subtitle="Unit, jabatan, status"
              onClick={() => setLembar('profil')}
              chevron={false}
              value="Lihat"
            />
            <ListRow
              icon={Lock}
              title="Ubah kata sandi"
              onClick={() => setLembar('sandi')}
            />
          </ListGroup>
        </Section>

        <button
          type="button"
          onClick={keluar}
          className={`min-h-[48px] ${radius.control} ${tone.danger.bgSoft} ${tone.danger.text} ${text.body} font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Keluar
        </button>

        <p className={`${text.caption} ${ink.faint} text-center`}>BPR ARA Digital Ecosystem</p>
        <div className="h-2" />
      </Stack>

      {lembar === 'profil' && <LembarProfil onTutup={() => setLembar(null)} />}
      {lembar === 'pribadi' && <LembarPribadi onTutup={() => setLembar(null)} />}
      {lembar === 'sandi' && <LembarSandi onTutup={() => setLembar(null)} />}
    </Screen>
  );
};

/* ------------------------------------------------------------------ kerangka lembar */

const KerangkaLembar: React.FC<{
  judul: string;
  onTutup: () => void;
  aksi?: React.ReactNode;
  children: React.ReactNode;
}> = ({ judul, onTutup, aksi, children }) => (
  <div className="fixed inset-0 z-50 flex flex-col bg-white">
    <header
      className={`shrink-0 border-b ${surface.divider} flex items-center gap-1 h-12 px-1`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <button
        type="button"
        onClick={onTutup}
        aria-label="Tutup"
        className={`w-11 h-11 flex items-center justify-center ${ink.base} active:opacity-50`}
      >
        <X className="w-6 h-6" />
      </button>
      <h1 className={`${text.title} ${ink.strong} flex-1`}>{judul}</h1>
    </header>
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">{children}</div>
    {aksi && (
      <div
        className={`shrink-0 border-t ${surface.divider} px-4 py-3`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        {aksi}
      </div>
    )}
  </div>
);

const Isian: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  catatan?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, inputMode, catatan }) => (
  <label className="flex flex-col gap-1.5">
    <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>{label}</span>
    <input
      type={type}
      value={value}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3.5 min-h-[48px] ${radius.control} border ${surface.divider} ${text.body} ${ink.strong} placeholder:text-slate-400 outline-none focus:border-blue-500`}
    />
    {catatan && <span className={`${text.caption} ${ink.faint} px-1`}>{catatan}</span>}
  </label>
);

const Pesan: React.FC<{ teks: string; jenis: 'ok' | 'gagal' }> = ({ teks, jenis }) => (
  <div className={`${radius.control} px-3.5 py-3 flex items-start gap-2.5 ${jenis === 'ok' ? tone.positive.bgSoft : tone.danger.bgSoft}`}>
    {jenis === 'ok'
      ? <Check className={`w-4 h-4 shrink-0 mt-px ${tone.positive.text}`} />
      : <AlertCircle className={`w-4 h-4 shrink-0 mt-px ${tone.danger.text}`} />}
    <p className={`${text.footnote} ${jenis === 'ok' ? tone.positive.text : tone.danger.text}`}>{teks}</p>
  </div>
);

const TombolSimpan: React.FC<{ disabled: boolean; memproses: boolean; onClick: () => void; label?: string }> = ({
  disabled, memproses, onClick, label = 'Simpan perubahan',
}) => (
  <button
    type="button"
    disabled={disabled || memproses}
    onClick={onClick}
    className={`w-full min-h-[52px] ${radius.control} ${text.headline} text-white bg-primary disabled:bg-slate-300 transition-transform active:scale-[0.98] disabled:active:scale-100`}
  >
    {memproses ? 'Menyimpan…' : label}
  </button>
);

/** Kirim perubahan profil dan segarkan currentUser dari jawaban server. */
function useSimpanProfil() {
  const { setCurrentUser } = useApp() as any;
  const [memproses, setMemproses] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'ok' | 'gagal' } | null>(null);

  const simpan = async (data: Record<string, unknown>, sesudah?: () => void) => {
    setMemproses(true);
    setPesan(null);
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
      // Server yang menentukan bentuk akhir data, bukan tebakan di sisi klien.
      setCurrentUser(json.user);
      setPesan({ teks: json.message ?? 'Tersimpan', jenis: 'ok' });
      sesudah?.();
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Terjadi kesalahan', jenis: 'gagal' });
    } finally {
      setMemproses(false);
    }
  };

  return { simpan, memproses, pesan };
}

/* ------------------------------------------------------------------ foto & kepegawaian */

const LembarProfil: React.FC<{ onTutup: () => void }> = ({ onTutup }) => {
  const { currentUser } = useApp() as any;
  const { simpan, memproses, pesan } = useSimpanProfil();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mengunggah, setMengunggah] = useState(false);

  const pilihFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (pratinjau) URL.revokeObjectURL(pratinjau);
    setFile(f);
    setPratinjau(URL.createObjectURL(f));
  };

  const simpanFoto = async () => {
    if (!file) return;
    setMengunggah(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const hasil = await res.json();
      await simpan({ avatar_url: hasil?.data?.url }, onTutup);
    } finally {
      setMengunggah(false);
    }
  };

  const kepegawaian = [
    { label: 'Unit', nilai: currentUser?.unit },
    { label: 'Jabatan', nilai: currentUser?.role },
    { label: 'Status', nilai: currentUser?.status },
  ].filter(b => b.nilai);

  return (
    <KerangkaLembar
      judul="Foto & kepegawaian"
      onTutup={onTutup}
      aksi={file ? <TombolSimpan disabled={!file} memproses={memproses || mengunggah} onClick={simpanFoto} label="Simpan foto" /> : undefined}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={pilihFoto} className="hidden" />

      <div className="flex flex-col items-center gap-3 py-2">
        {pratinjau ? (
          <img src={pratinjau} alt="Pratinjau" className="w-28 h-28 rounded-full object-cover" />
        ) : (
          <Avatar name={currentUser?.name ?? 'Pengguna'} size={112} src={currentUser?.avatar_url} />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`min-h-[44px] px-4 ${radius.pill} border ${surface.divider} ${text.body} font-semibold ${ink.base} flex items-center gap-2 active:bg-slate-50`}
        >
          <Camera className="w-4 h-4" />
          {currentUser?.avatar_url || pratinjau ? 'Ganti foto' : 'Unggah foto'}
        </button>
      </div>

      {pesan && <Pesan teks={pesan.teks} jenis={pesan.jenis} />}

      <div className="flex flex-col gap-1.5">
        <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>
          Data kepegawaian
        </span>
        <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
          {kepegawaian.map(b => (
            <div key={b.label} className="px-4 py-3.5 flex items-center gap-3">
              <span className={`flex-1 ${text.body} ${ink.muted}`}>{b.label}</span>
              <span className={`${text.body} font-medium ${ink.strong} text-right`}>{b.nilai}</span>
            </div>
          ))}
        </Card>
        {/*
          Dinyatakan terus terang supaya pegawai tidak mencari-cari tombol ubah
          yang memang sengaja tidak ada.
        */}
        <span className={`${text.caption} ${ink.faint} px-1`}>
          Data kepegawaian ditetapkan oleh admin dan tidak dapat diubah sendiri.
          Hubungi bagian SDM bila ada yang keliru.
        </span>
      </div>
    </KerangkaLembar>
  );
};

/* ------------------------------------------------------------------ informasi pribadi */

const LembarPribadi: React.FC<{ onTutup: () => void }> = ({ onTutup }) => {
  const { currentUser } = useApp() as any;
  const { simpan, memproses, pesan } = useSimpanProfil();

  const [nama, setNama] = useState(currentUser?.name ?? '');
  const [nik, setNik] = useState(currentUser?.nik ?? '');
  const [telepon, setTelepon] = useState(currentUser?.phone ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');

  const berubah =
    nama !== (currentUser?.name ?? '') ||
    nik !== (currentUser?.nik ?? '') ||
    telepon !== (currentUser?.phone ?? '') ||
    email !== (currentUser?.email ?? '');

  return (
    <KerangkaLembar
      judul="Informasi pribadi"
      onTutup={onTutup}
      aksi={<TombolSimpan disabled={!berubah || !nama.trim()} memproses={memproses} onClick={() => simpan({ name: nama, nik, phone: telepon, email })} />}
    >
      {pesan && <Pesan teks={pesan.teks} jenis={pesan.jenis} />}
      <Isian label="Nama lengkap" value={nama} onChange={setNama} />
      <Isian label="NIK" value={nik} onChange={setNik} inputMode="numeric" placeholder="Nomor induk kependudukan" />
      <Isian label="Nomor HP" value={telepon} onChange={setTelepon} inputMode="tel" type="tel" placeholder="08xxxxxxxxxx" />
      <Isian
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        inputMode="email"
        catatan="Email dipakai untuk kode verifikasi saat masuk dan saat lupa kata sandi."
      />
      <p className={`${text.caption} ${ink.faint} px-1`}>
        Username tidak dapat diubah sendiri.
      </p>
    </KerangkaLembar>
  );
};

/* ------------------------------------------------------------------ ganti sandi */

const LembarSandi: React.FC<{ onTutup: () => void }> = ({ onTutup }) => {
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [lihat, setLihat] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'ok' | 'gagal' } | null>(null);

  const terlaluPendek = baru.length > 0 && baru.length < 8;
  const tidakCocok = ulang.length > 0 && baru !== ulang;
  const siap = lama.length > 0 && baru.length >= 8 && baru === ulang;

  const kirim = async () => {
    setMemproses(true);
    setPesan(null);
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
      setPesan({ teks: json.message, jenis: 'ok' });
      setLama(''); setBaru(''); setUlang('');
      setTimeout(onTutup, 1200);
    } catch (e: any) {
      setPesan({ teks: e?.message ?? 'Terjadi kesalahan', jenis: 'gagal' });
    } finally {
      setMemproses(false);
    }
  };

  return (
    <KerangkaLembar
      judul="Ubah kata sandi"
      onTutup={onTutup}
      aksi={<TombolSimpan disabled={!siap} memproses={memproses} onClick={kirim} label="Ganti kata sandi" />}
    >
      {pesan && <Pesan teks={pesan.teks} jenis={pesan.jenis} />}

      <Isian label="Kata sandi saat ini" value={lama} onChange={setLama} type={lihat ? 'text' : 'password'} />
      <Isian
        label="Kata sandi baru"
        value={baru}
        onChange={setBaru}
        type={lihat ? 'text' : 'password'}
        catatan="Minimal 8 karakter"
      />
      <Isian label="Ulangi kata sandi baru" value={ulang} onChange={setUlang} type={lihat ? 'text' : 'password'} />

      {/* Satu tombol untuk ketiga isian — mengetik sandi di layar HP mudah
          salah, dan memberi tiga ikon mata terpisah hanya menambah kekacauan. */}
      <button
        type="button"
        onClick={() => setLihat(v => !v)}
        className={`self-start min-h-[44px] flex items-center gap-2 ${text.footnote} font-semibold ${tone.primary.text}`}
      >
        {lihat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      </button>

      {terlaluPendek && <p className={`${text.caption} ${tone.danger.text} px-1`}>Kata sandi baru minimal 8 karakter.</p>}
      {tidakCocok && <p className={`${text.caption} ${tone.danger.text} px-1`}>Ulangan kata sandi belum sama.</p>}
    </KerangkaLembar>
  );
};

export default MobileProfile;
