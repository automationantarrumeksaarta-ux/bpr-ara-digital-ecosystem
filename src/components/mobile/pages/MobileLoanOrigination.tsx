import React, { useMemo, useRef, useState } from 'react';
import { Camera, FileText, Phone, Plus, Search, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  AppBar, Card, EmptyState, IsianPilihan, IsianTeks, LembarPenuh,
  PesanKecil, Screen, Stack, TombolUtama,
} from '../ui/primitives';
import { ink, radius, surface, text, tone, HIT_TARGET, type ToneName } from '../ui/tokens';
import { kecilkanGambar } from '../../../utils/gambar';

/**
 * Permohonan kredit versi aplikasi.
 *
 * Dua nama kolom sebelumnya salah dan membuat layar ini nyaris tidak berguna
 * pada data sungguhan: tahap dibaca dari `a.stage ?? a.status`, padahal
 * medannya bernama `currentStage`, sehingga SEMUA berkas jatuh ke nilai
 * cadangan "Input AO"; dan pemilik dibaca dari `a.aoName ?? a.createdBy`,
 * padahal namanya `accountOfficerName`, sehingga penyaring "Permohonan saya"
 * selalu menghasilkan daftar kosong.
 *
 * Versi web menampilkan pipeline mendatar tujuh tahap berikut tabel rinci —
 * bentuk yang membutuhkan lebar. Di HP, AO memakainya untuk satu hal:
 * mengecek permohonan yang ia ajukan sudah sampai tahap mana.
 *
 * Jadi tahap dijadikan penyaring, dan tiap permohonan tampil sebagai baris
 * dengan nama, plafon, dan posisi tahapnya.
 */

const TAHAP: { id: string; label: string; nada: ToneName }[] = [
  { id: 'SUBMITTED', label: 'Input AO', nada: 'neutral' },
  { id: 'VERIFICATION', label: 'Verifikasi', nada: 'warning' },
  { id: 'SURVEY', label: 'Survey', nada: 'primary' },
  { id: 'ANALYSIS', label: 'Analisa', nada: 'primary' },
  { id: 'CREDIT_COMMITTEE', label: 'Komite', nada: 'primary' },
  { id: 'APPROVED', label: 'Disetujui', nada: 'positive' },
  { id: 'DISBURSED', label: 'Cair', nada: 'positive' },
  { id: 'REJECTED', label: 'Ditolak', nada: 'danger' },
];

const infoTahap = (id: string) =>
  TAHAP.find(t => t.id === id) ?? { id, label: id, nada: 'neutral' as ToneName };

const rupiahRingkas = (v: number): string => {
  if (!v) return 'Rp 0';
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2).replace('.', ',')} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)} Jt`;
  return `Rp ${v.toLocaleString('id-ID')}`;
};

const MobileLoanOrigination: React.FC = () => {
  const { creditApplications, currentUser, createCreditApplication } = useApp() as any;
  const [bukaForm, setBukaForm] = useState(false);
  const [tahapDipilih, setTahapDipilih] = useState<string>('SEMUA');
  const [cari, setCari] = useState('');
  const [hanyaSaya, setHanyaSaya] = useState(true);

  const namaSaya = (currentUser?.name ?? '').trim().toLowerCase();

  const milikSaya = (a: any) =>
    (a.accountOfficerName ?? '').toString().trim().toLowerCase() === namaSaya;

  const semua = creditApplications ?? [];

  const jumlahPerTahap = useMemo(() => {
    const n: Record<string, number> = {};
    for (const a of semua) {
      if (hanyaSaya && namaSaya && !milikSaya(a)) continue;
      const s = a.currentStage ?? 'SUBMITTED';
      n[s] = (n[s] ?? 0) + 1;
    }
    return n;
  }, [semua, hanyaSaya, namaSaya]);

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return semua
      .filter((a: any) => {
        if (hanyaSaya && namaSaya && !milikSaya(a)) return false;
        const s = a.currentStage ?? 'SUBMITTED';
        if (tahapDipilih !== 'SEMUA' && s !== tahapDipilih) return false;
        if (!q) return true;
        return [a.customerName, a.applicationNumber, a.cif]
          .some(v => (v ?? '').toString().toLowerCase().includes(q));
      })
      .sort((a: any, b: any) =>
        (b.createdAt ?? b.submittedAt ?? '').localeCompare(a.createdAt ?? a.submittedAt ?? ''));
  }, [semua, tahapDipilih, cari, hanyaSaya, namaSaya]);

  const tahapAda = TAHAP.filter(t => (jumlahPerTahap[t.id] ?? 0) > 0);
  const totalTerlihat = Object.values(jumlahPerTahap).reduce<number>((s, v) => s + Number(v), 0);

  return (
    <Screen>
      <AppBar title="Pengajuan Kredit" back />

      <Stack className="gap-4">
        <label className={`flex items-center gap-2.5 px-3.5 ${HIT_TARGET} ${surface.card} ${radius.control} border ${surface.divider}`}>
          <Search className={`w-4 h-4 shrink-0 ${ink.faint}`} />
          <input
            value={cari}
            onChange={e => setCari(e.target.value)}
            placeholder="Cari nama nasabah atau nomor permohonan"
            className={`flex-1 min-w-0 bg-transparent outline-none ${text.body} ${ink.strong} placeholder:text-slate-400`}
          />
          {cari && (
            <button type="button" onClick={() => setCari('')} aria-label="Hapus pencarian" className="p-1 -mr-1">
              <X className={`w-4 h-4 ${ink.faint}`} />
            </button>
          )}
        </label>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5">
          <button
            type="button"
            onClick={() => setTahapDipilih('SEMUA')}
            className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold border transition-colors ${
              tahapDipilih === 'SEMUA'
                ? 'bg-primary text-white border-transparent'
                : `${surface.card} ${ink.base} ${surface.divider}`
            }`}
          >
            Semua · {totalTerlihat}
          </button>
          {tahapAda.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTahapDipilih(t.id)}
              className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold border transition-colors ${
                tahapDipilih === t.id
                  ? 'bg-primary text-white border-transparent'
                  : `${surface.card} ${ink.base} ${surface.divider}`
              }`}
            >
              {t.label} · {jumlahPerTahap[t.id]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHanyaSaya(v => !v)}
            className={`shrink-0 min-h-[36px] px-3.5 ${radius.pill} ${text.footnote} font-semibold border transition-colors ${
              hanyaSaya
                ? 'bg-primary text-white border-transparent'
                : `${surface.card} ${ink.base} ${surface.divider}`
            }`}
          >
            Permohonan saya
          </button>
        </div>

        {daftar.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={FileText}
              title={cari ? 'Tidak ada yang cocok' : 'Belum ada permohonan'}
              description={
                cari
                  ? 'Coba kata kunci lain, atau hapus pencarian.'
                  : hanyaSaya
                    ? 'Belum ada permohonan atas nama Anda. Matikan penyaring "Permohonan saya" untuk melihat semuanya.'
                    : 'Permohonan kredit baru akan muncul di sini.'
              }
            />
          </Card>
        ) : (
          <Card flush className={`overflow-hidden divide-y ${surface.hairline}`}>
            {daftar.map((a: any) => {
              const tahap = infoTahap(a.currentStage ?? 'SUBMITTED');
              return (
                <div key={a.id} className="px-4 py-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className={`block ${text.body} font-semibold ${ink.strong} truncate`}>
                        {a.customerName ?? '(tanpa nama)'}
                      </span>
                      <span className={`block ${text.caption} ${ink.faint} mt-0.5 truncate`}>
                        {a.applicationNumber ?? a.cif ?? '-'}
                      </span>
                    </span>
                    <span className={`${text.headline} ${ink.strong} tabular-nums shrink-0`}>
                      {rupiahRingkas(a.requestedPlafon ?? a.plafon ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${text.caption} font-semibold px-1.5 py-0.5 ${radius.control} ${tone[tahap.nada].bgSoft} ${tone[tahap.nada].text}`}>
                      {tahap.label}
                    </span>
                    {a.requestedTenorMonths && (
                      <span className={`${text.caption} ${ink.faint}`}>{a.requestedTenorMonths} bln</span>
                    )}
                    {a.phone && (
                      <a
                        href={`tel:${a.phone}`}
                        className={`${text.caption} ${tone.primary.text} font-semibold flex items-center gap-1`}
                      >
                        <Phone className="w-3 h-3" />
                        Telepon
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* Ruang supaya baris terakhir tidak tertutup tombol tambah. */}
        <div className="h-20" />
      </Stack>

      {/*
        Tombol tambah melayang, sama seperti di Task Board dan Aktivitas.
        Ditaruh agak naik dari tepi bawah supaya tidak bertabrakan dengan
        bilah navigasi sistem maupun bilah tab aplikasi.
      */}
      <button
        type="button"
        onClick={() => setBukaForm(true)}
        aria-label="Buat pengajuan kredit baru"
        className="fixed right-4 bottom-24 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {bukaForm && (
        <LembarPengajuan
          onTutup={() => setBukaForm(false)}
          onSimpan={createCreditApplication}
        />
      )}
    </Screen>
  );
};

/* ------------------------------------------------------- lembar pengajuan */

const TUJUAN = [
  { nilai: 'MODAL_KERJA', label: 'Modal kerja usaha' },
  { nilai: 'INVESTASI', label: 'Investasi' },
  { nilai: 'KONSUMTIF', label: 'Konsumtif' },
];

const JENIS_KREDIT = [
  { nilai: 'Umum', label: 'Umum' },
  { nilai: 'Tepat', label: 'Tepat' },
  { nilai: 'KKKB', label: 'KKKB' },
];

const STATUS_DEBITUR = [
  { nilai: 'Debitur Baru', label: 'Debitur baru' },
  { nilai: 'Debitur Lama', label: 'Debitur lama' },
];

/**
 * Formulir pengajuan versi lapangan.
 *
 * Sengaja lebih pendek daripada Form 01 di web. AO mengisinya sambil berdiri
 * di tempat usaha nasabah, jadi yang diminta hanya yang benar-benar harus
 * dicatat saat itu juga — termasuk foto KTP, yang paling sulit dikejar
 * belakangan. Sisanya dilengkapi di web sebelum berkas diteruskan ke legal.
 *
 * Data dikirim lewat `createCreditApplication` yang sama dengan versi web,
 * jadi tidak ada jalur penyimpanan kedua yang bisa berbeda perilaku.
 */
const LembarPengajuan: React.FC<{
  onTutup: () => void;
  onSimpan: (data: any) => void;
}> = ({ onTutup, onSimpan }) => {
  const [f, setF] = useState({
    nama: '', nik: '', hp: '', alamat: '',
    kelurahan: '', kecamatan: '', kabupaten: '',
    usaha: '', plafon: '', tenor: '12',
    tujuan: 'MODAL_KERJA', jenisKredit: 'Umum', statusDebitur: 'Debitur Baru',
  });
  const [fotoKtp, setFotoKtp] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [pesan, setPesan] = useState<{ teks: string; jenis: 'ok' | 'gagal' } | null>(null);
  const ktpRef = useRef<HTMLInputElement>(null);

  const ubah = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const ambilKtp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const berkas = e.target.files?.[0];
    if (!berkas) return;
    setPesan(null);
    try {
      // Tidak dipotong persegi: memotong KTP jadi bujur sangkar membuang NIK-nya.
      setFotoKtp(await kecilkanGambar(berkas, {
        maksPiksel: 1280, mutu: 0.72, potongPersegi: false, batasByte: 900 * 1024,
      }));
    } catch (err: any) {
      setPesan({ teks: err?.message ?? 'Gagal memproses foto.', jenis: 'gagal' });
    } finally {
      e.target.value = '';
    }
  };

  const plafonAngka = Number(String(f.plafon).replace(/\D/g, '')) || 0;
  const siap =
    f.nama.trim() !== '' &&
    f.hp.trim() !== '' &&
    f.alamat.trim() !== '' &&
    plafonAngka > 0 &&
    Number(f.tenor) > 0;

  const simpan = () => {
    if (!siap) return;
    setMemproses(true);
    try {
      const dokumen = fotoKtp
        ? [{
            id: `doc-${Date.now()}-ktp`,
            name: 'KTP.jpg',
            type: 'ktp',
            url: fotoKtp,
            uploadedBy: 'Aplikasi lapangan',
            uploadedAt: new Date().toISOString(),
            stage: 'SUBMITTED',
          }]
        : [];

      onSimpan({
        cif: f.nik ? `CIF-${f.nik.slice(-4)}` : undefined,
        customerName: f.nama.trim(),
        phone: f.hp.trim(),
        address: f.alamat.trim(),
        kelurahan: f.kelurahan.trim() || undefined,
        kecamatan: f.kecamatan.trim() || undefined,
        kabupaten: f.kabupaten.trim() || undefined,
        creditType: f.jenisKredit,
        debtorStatus: f.statusDebitur,
        requestedPlafon: plafonAngka,
        requestedTenorMonths: Number(f.tenor) || 12,
        purpose: f.tujuan,
        purposeDetails: f.usaha.trim() || TUJUAN.find(t => t.nilai === f.tujuan)?.label,
        documents: dokumen,
      });
      onTutup();
    } catch (err: any) {
      setPesan({ teks: err?.message ?? 'Gagal menyimpan pengajuan.', jenis: 'gagal' });
    } finally {
      setMemproses(false);
    }
  };

  return (
    <LembarPenuh
      judul="Pengajuan kredit baru"
      onTutup={onTutup}
      aksi={
        <TombolUtama
          disabled={!siap}
          memproses={memproses}
          onClick={simpan}
          label={siap ? 'Kirim pengajuan' : 'Lengkapi kolom bertanda *'}
        />
      }
    >
      {pesan && <PesanKecil teks={pesan.teks} jenis={pesan.jenis} />}

      <IsianTeks label="Nama lengkap" wajib value={f.nama} onChange={ubah('nama')} />
      <IsianTeks label="NIK" value={f.nik} onChange={ubah('nik')} inputMode="numeric"
        catatan="Boleh dilengkapi nanti di web bila KTP belum di tangan." />
      <IsianTeks label="Nomor HP" wajib value={f.hp} onChange={ubah('hp')} type="tel" inputMode="tel" />
      <IsianTeks label="Alamat" wajib value={f.alamat} onChange={ubah('alamat')} baris={2} />

      <div className="grid grid-cols-2 gap-3">
        <IsianTeks label="Kelurahan" value={f.kelurahan} onChange={ubah('kelurahan')} />
        <IsianTeks label="Kecamatan" value={f.kecamatan} onChange={ubah('kecamatan')} />
      </div>
      <IsianTeks label="Kabupaten" value={f.kabupaten} onChange={ubah('kabupaten')} />

      <IsianTeks
        label="Plafon yang dimohon" wajib inputMode="numeric"
        value={f.plafon} onChange={v => ubah('plafon')(v.replace(/\D/g, ''))}
        catatan={plafonAngka > 0 ? `Rp ${plafonAngka.toLocaleString('id-ID')}` : 'Isi angka saja, tanpa titik.'}
      />
      <IsianTeks label="Jangka waktu (bulan)" wajib inputMode="numeric" value={f.tenor} onChange={ubah('tenor')} />

      <IsianPilihan label="Tujuan penggunaan" wajib value={f.tujuan} onChange={ubah('tujuan')} pilihan={TUJUAN} />
      <IsianTeks label="Jenis usaha atau pekerjaan" value={f.usaha} onChange={ubah('usaha')} />
      <IsianPilihan label="Jenis kredit" value={f.jenisKredit} onChange={ubah('jenisKredit')} pilihan={JENIS_KREDIT} />
      <IsianPilihan label="Status debitur" value={f.statusDebitur} onChange={ubah('statusDebitur')} pilihan={STATUS_DEBITUR} />

      {/* Foto KTP langsung dari kamera, tanpa perlu plugin tambahan. */}
      <div className="flex flex-col gap-2">
        <span className={`${text.caption} ${ink.muted} uppercase tracking-wide font-semibold px-1`}>Foto KTP</span>
        <input
          ref={ktpRef} type="file" accept="image/*" capture="environment"
          onChange={ambilKtp} className="hidden"
        />
        {fotoKtp && (
          <img src={fotoKtp} alt="Foto KTP" className={`w-full ${radius.control} border ${surface.divider}`} />
        )}
        <button
          type="button"
          onClick={() => ktpRef.current?.click()}
          className={`${HIT_TARGET} px-4 ${radius.control} border ${surface.divider} ${text.body} font-semibold ${ink.base} flex items-center justify-center gap-2 active:bg-slate-50`}
        >
          <Camera className="w-4 h-4" />
          {fotoKtp ? 'Ambil ulang foto KTP' : 'Ambil foto KTP'}
        </button>
      </div>

      <p className={`${text.caption} ${ink.faint} px-1 leading-relaxed`}>
        Pengajuan masuk ke tahap Input AO. Kelengkapan berkas lain seperti kartu keluarga,
        dokumen agunan, dan surat nikah dilengkapi di web sebelum diteruskan ke legal.
      </p>

      <div className="h-2" />
    </LembarPenuh>
  );
};

export default MobileLoanOrigination;
