import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle, FilePlus2, FileText, Info, Plus, RefreshCw, Search, Upload, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditApplication, CreditAppStage } from '../../types';
import { WorkflowActionModal } from '../common/WorkflowActionModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { StageShell, DeretAngka } from '../credit/StageShell';
import { Kosong, KosongKarenaSaringan, Panel, StatusPill } from '../credit/StageParts';
import { persen, rupiah, rupiahRingkas, tanggalPendek } from '../credit/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

/**
 * Tahap 1 — Pengajuan Kredit (Loan Origination).
 *
 * Kontrak data tidak berubah: `formData`, `uploadedFiles`, `uploadedImages`,
 * `handleNewSubmit`, dan seluruh argumen `createCreditApplication` sama persis
 * seperti sebelumnya, begitu juga alur `getStageConfig` ke WorkflowActionModal.
 *
 * Yang berubah:
 *
 * 1. **Daftar pengajuan jadi tabel.** Sebelumnya satu kartu per berkas. Kartu
 *    enak dipakai selama orang masih menelusuri, kira-kira sampai selusin baris;
 *    lewat itu orang mencari satu baris tertentu, dan mencari butuh kolom yang
 *    rata dengan angka rata kanan.
 * 2. **Ada keadaan kosong.** Sebelumnya badan daftar benar-benar kosong tanpa
 *    satu kata pun — dan karena belum ada pengajuan tersimpan sama sekali,
 *    itulah yang dilihat pegawai setiap hari.
 * 3. **Pengisi cepat dijujurkan.** Tombolnya dulu bernama "Smart OCR" dan
 *    "Core Banking", dan pesannya berbunyi "Data NIK/CIF ditemukan!" — padahal
 *    tidak ada pemindaian maupun pencarian apa pun: keduanya menyalin dua
 *    contoh yang ditulis di dalam kode, lengkap dengan NIK karangan, lalu
 *    memasukkannya ke formulir kredit sungguhan. Sekarang jelas disebut data
 *    contoh untuk uji coba.
 * 4. Label mengambang di 20 isian formulir diganti label biasa. Selain
 *    menyalin blok className enam baris dua puluh kali, label mengambang
 *    menyembunyikan nama kolom begitu isian terisi — persis saat petugas
 *    memeriksa ulang berkas kredit.
 */

const FLOW_STEPS: CreditAppStage[] = [
  'SUBMITTED', 'VERIFICATION', 'ANALYSIS', 'CREDIT_COMMITTEE', 'APPROVED', 'DISBURSED', 'REJECTED',
];

const LABEL_TAHAP: Record<CreditAppStage, string> = {
  DRAFT: 'Draf',
  SUBMITTED: 'Input AO',
  VERIFICATION: 'Verifikasi Admin Legal',
  SLIK: 'Cek SLIK',
  SURVEY: 'Survei lapangan',
  ANALYSIS: 'Analisis kredit',
  LEGAL_REVIEW: 'Telaah legal',
  CREDIT_COMMITTEE: 'Putusan komite',
  APPROVED: 'Disetujui',
  DISBURSED: 'Cair',
  REJECTED: 'Ditolak',
};

const compressImageFile = (file: File, maxWidth = 800, quality = 0.7): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { resolve(''); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

/* --------------------------------------------------------------- isian form */

const kelasIsian =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground ' +
  'placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

const Isian: React.FC<{
  label: string; id: string; wajib?: boolean; petunjuk?: string;
  className?: string; children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>> = ({
  label, id, wajib, petunjuk, className, children, ...props
}) => (
  <div className={className}>
    <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
      {label} {wajib && <span className="text-danger">*</span>}
    </label>
    {children ?? <input id={id} required={wajib} className={kelasIsian} {...props} />}
    {petunjuk && <p className="mt-1 text-[10px] text-slate-500">{petunjuk}</p>}
  </div>
);

const Pilihan: React.FC<{
  label: string; id: string; wajib?: boolean; className?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}> = ({ label, id, wajib, className, children, ...props }) => (
  <Isian label={label} id={id} wajib={wajib} className={className}>
    <select id={id} required={wajib} className={cn(kelasIsian, 'cursor-pointer')} {...props}>
      {children}
    </select>
  </Isian>
);

/* ------------------------------------------------------------------ halaman */

export const LosCreditView: React.FC = () => {
  const { currentUser, creditApplications: applications, createCreditApplication, updateCreditAppStage } = useApp();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [actionModal, setActionModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; app: CreditApplication | null }>({ isOpen: false, app: null });
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', ktp: '', wa: '', maritalStatus: 'Single / Belum Menikah', motherName: '',
    spouseName: '', address: '', rtRw: '', kelurahan: '', kecamatan: '', kabupaten: '',
    amount: '', interestRate: '', termMonths: '12', purpose: 'Modal Kerja Usaha',
    businessType: '', creditType: 'Umum', debtorStatus: 'Debitur Baru',
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string | null>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [pesanContoh, setPesanContoh] = useState<string | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Data contoh untuk uji coba, bukan hasil pemindaian atau pencarian.
   *
   * Nilainya ditulis di dalam kode dan NIK-nya karangan. Sengaja dinamai apa
   * adanya supaya tidak ada yang mengira sistem baru saja membaca KTP atau
   * menghubungi core banking.
   */
  const CONTOH_UJI = [
    {
      id: 'sembako', label: 'Usaha sembako',
      data: {
        name: 'Bambang Purnomo', ktp: '3273012508820005', wa: '081223456789', maritalStatus: 'Menikah',
        motherName: 'Siti Aminah', spouseName: 'Sri Wahyuni', address: 'Jl. Raya Soreang No. 142',
        rtRw: '003/007', kelurahan: 'Padasuka', kecamatan: 'Soreang', kabupaten: 'Bandung',
        businessType: 'Perdagangan Grosir Sembako', amount: '75000000', interestRate: '12.5',
        termMonths: '24', purpose: 'Modal Kerja Usaha',
      },
    },
    {
      id: 'pns', label: 'Pegawai negeri',
      data: {
        name: 'Dra. Ratna Juwita, M.Si', ktp: '3273045411800002', wa: '081398765432', maritalStatus: 'Menikah',
        motherName: 'Hj. Rukmini', spouseName: 'Drs. Hendra Wijaya', address: 'Komplek Permata',
        rtRw: '005/012', kelurahan: 'Sekarwangi', kecamatan: 'Soreang', kabupaten: 'Bandung',
        businessType: 'PNS Dinas Pendidikan', amount: '45000000', interestRate: '11',
        termMonths: '36', purpose: 'Konsumtif',
      },
    },
  ];

  const pakaiContoh = (contoh: typeof CONTOH_UJI[0]) => {
    setFormData(prev => ({ ...prev, ...contoh.data }));
    setPesanContoh(`Formulir diisi dengan data contoh "${contoh.label}". Ganti sebelum dikirim.`);
    setTimeout(() => setPesanContoh(null), 6000);
  };

  const convertFilenameToPdf = (originalName: string, fallbackType?: string) =>
    originalName ? `${originalName.replace(/\.[^/.]+$/, '')}.pdf` : `${fallbackType || 'Dokumen'}_Converted.pdf`;

  const handleFileChange = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFiles(prev => ({ ...prev, [docType]: convertFilenameToPdf(file.name, docType) }));
    const dataUrl = await compressImageFile(file);
    if (dataUrl) setUploadedImages(prev => ({ ...prev, [docType]: dataUrl }));
  };

  const handleRtRwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '');
    if ((val.length === 2 || val.length === 3) && !val.includes('/') && formData.rtRw.length < val.length) val += '/';
    setFormData({ ...formData, rtRw: val });
  };

  const [galatPengajuan, setGalatPengajuan] = useState<string | null>(null);

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGalatPengajuan(null);

    const initialDocs: any[] = [{
      id: `doc-${Date.now()}-form01`,
      name: 'Form_01_Permohonan.pdf',
      type: 'FORM_01',
      url: 'virtual',
      uploadedBy: 'Sistem LOS',
      uploadedAt: new Date().toISOString(),
      stage: 'SUBMITTED',
    }];
    Object.keys(uploadedImages).forEach((key) => {
      initialDocs.push({
        id: `doc-${Date.now()}-${key}`,
        name: uploadedFiles[key] || `${key}.jpg`,
        type: key,
        url: uploadedImages[key],
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toISOString(),
        stage: 'SUBMITTED',
      });
    });

    const pengajuan = {
      cif: formData.ktp ? `CIF-${formData.ktp.slice(-4)}` : undefined,
      customerName: formData.name,
      phone: formData.wa,
      maritalStatus: formData.maritalStatus,
      motherName: formData.motherName,
      spouseName: formData.spouseName,
      address: formData.address,
      rtRw: formData.rtRw,
      kelurahan: formData.kelurahan,
      kecamatan: formData.kecamatan,
      kabupaten: formData.kabupaten,
      creditType: formData.creditType,
      debtorStatus: formData.debtorStatus,
      interestRate: parseFloat(formData.interestRate) || undefined,
      requestedPlafon: parseInt(formData.amount) || 0,
      requestedTenorMonths: parseInt(formData.termMonths) || 12,
      purpose: (formData.purpose === 'Modal Kerja Usaha' ? 'MODAL_KERJA' : formData.purpose === 'Investasi' ? 'INVESTASI' : 'KONSUMTIF'),
      purposeDetails: formData.businessType || formData.purpose,
      documents: initialDocs,
    };

    try {
      createCreditApplication(pengajuan);
    } catch (err: any) {
      /*
       * Pengajuan yang belum lengkap ditolak, bukan ditambal nilai karangan.
       * Pesannya ditampilkan di dalam formulir supaya orangnya tahu kolom mana
       * yang kurang; menutup modal di sini akan membuang isian yang sudah
       * diketik.
       */
      setGalatPengajuan(err?.message ?? 'Gagal menyimpan pengajuan.');
      return;
    }
    setIsNewModalOpen(false);
  };

  const refreshApplications = () => { setLoading(true); setTimeout(() => setLoading(false), 800); };

  const getStageConfig = (stage: CreditAppStage | undefined) => {
    switch (stage) {
      case 'SUBMITTED': return { title: 'Ajukan ke Legal', subtitle: 'Verifikasi kelengkapan', next: 'VERIFICATION', label: 'Ajukan ke Legal' };
      case 'VERIFICATION': return { title: 'Proses SLIK OJK', subtitle: 'Pengecekan riwayat kredit', next: 'SLIK', label: 'Proses SLIK' };
      case 'SLIK': return { title: 'Tugaskan Survey', subtitle: 'Survey lokasi & usaha', next: 'SURVEY', label: 'Tugaskan Survey' };
      case 'SURVEY': return { title: 'Analisa Kredit', subtitle: 'Evaluasi kelayakan', next: 'ANALYSIS', label: 'Mulai Analisa' };
      case 'ANALYSIS': return { title: 'Legal Review', subtitle: 'Review perjanjian kredit', next: 'LEGAL_REVIEW', label: 'Kirim ke Legal' };
      case 'LEGAL_REVIEW': return { title: 'Komite Kredit', subtitle: 'Sidang putusan komite', next: 'CREDIT_COMMITTEE', label: 'Ajukan ke Komite' };
      case 'CREDIT_COMMITTEE': return { title: 'Keputusan Komite', subtitle: 'Persetujuan akhir direksi', next: 'APPROVED', label: 'Setujui Pengajuan' };
      case 'APPROVED': return { title: 'Pencairan Kredit', subtitle: 'Disbursement ke rekening nasabah', next: 'DISBURSED', label: 'Cairkan Dana' };
      default: return { title: 'Aplikasi Selesai', subtitle: 'Tidak ada tindakan lanjutan', next: 'DISBURSED', label: 'Selesai' };
    }
  };

  const isSlaExceeded = (app: CreditApplication) => {
    if (app.slaExceeded) return true;
    if (!app.slaDeadline) return false;
    try {
      return new Date() > new Date(app.slaDeadline.replace(' WIB', '').replace(' ', 'T'));
    } catch { return false; }
  };

  const filteredApps = useMemo(() => applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    const cocokCari =
      app.customerName.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q) ||
      (app.purposeDetails ?? '').toLowerCase().includes(q);
    const cocokStatus = statusFilter === 'ALL' || app.currentStage === statusFilter;
    return cocokCari && cocokStatus;
  }), [applications, searchTerm, statusFilter]);

  const cair = applications.filter(a => a.currentStage === 'DISBURSED').length;
  const disetujui = applications.filter(a => a.currentStage === 'DISBURSED' || a.currentStage === 'APPROVED').length;
  const slaWarnings = applications.filter(
    a => (a.slaExceeded || isSlaExceeded(a)) && a.currentStage !== 'DISBURSED' && a.currentStage !== 'REJECTED'
  ).length;
  const nilaiDiajukan = applications.reduce((s, a) => s + (a.requestedPlafon || 0), 0);

  const adaSaringan = searchTerm.trim() !== '' || statusFilter !== 'ALL';
  const resetSaringan = () => { setSearchTerm(''); setStatusFilter('ALL'); };

  const tombolBaru = (
    <>
      <Button variant="secondary" size="md" onClick={refreshApplications} disabled={loading} title="Muat ulang">
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      </Button>
      <Button onClick={() => setIsNewModalOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> Pengajuan baru
      </Button>
    </>
  );

  return (
    <StageShell
      stage="Loan Origination"
      judul="Pengajuan Kredit"
      keterangan={`Menerima permohonan kredit nasabah dan mengawal berkasnya sampai cair. Hak tindak lanjut mengikuti jabatan Anda sebagai ${currentUser?.role}.`}
      aksi={tombolBaru}
    >
      <DeretAngka
        angka={[
          { label: 'Berkas pengajuan', nilai: applications.length.toLocaleString('id-ID'), konteks: `Nilai dimohon ${rupiahRingkas(nilaiDiajukan)}` },
          // Nol bukan keberhasilan, jadi warna hijau baru dipakai bila memang ada yang cair.
          { label: 'Sudah cair', nilai: cair.toLocaleString('id-ID'), konteks: `${persen(cair, applications.length)} dari seluruh berkas`, nada: cair > 0 ? 'success' : 'default' },
          { label: 'Disetujui', nilai: disetujui.toLocaleString('id-ID'), konteks: `${persen(disetujui, applications.length)} dari seluruh berkas` },
          {
            label: 'Lewat batas waktu',
            nilai: slaWarnings.toLocaleString('id-ID'),
            konteks: slaWarnings > 0 ? 'Perlu didahulukan' : 'Semua masih dalam tenggat',
            nada: slaWarnings > 0 ? 'danger' : 'default',
          },
        ]}
      />

      <Panel
        judul="Daftar pengajuan"
        hitungan={filteredApps.length}
        padat
        alat={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nama nasabah atau tujuan"
                aria-label="Cari pengajuan"
                className="w-56 rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring lg:w-72"
              />
            </div>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              aria-label="Saring tahap"
              className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Semua tahap ({applications.length})</option>
              {FLOW_STEPS.map(step => (
                <option key={step} value={step}>
                  {LABEL_TAHAP[step]} ({applications.filter(a => a.currentStage === step).length})
                </option>
              ))}
            </select>
          </>
        }
      >
        {filteredApps.length === 0 ? (
          adaSaringan ? (
            <KosongKarenaSaringan onReset={resetSaringan} />
          ) : (
            <Kosong
              icon={FilePlus2}
              judul="Belum ada pengajuan kredit"
              keterangan="Setiap permohonan yang masuk dicatat di sini, lalu berjalan melewati verifikasi, survei, analisis, komite, legal, sampai cair."
              aksi={
                <Button onClick={() => setIsNewModalOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Buat pengajuan pertama
                </Button>
              }
            />
          )
        ) : (
          <Table wrapperClassName="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Nasabah</TableHead>
                <TableHead>Tahap</TableHead>
                <TableHead className="text-right">Plafon dimohon</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead className="text-right">Diajukan</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map(app => {
                const lewat = isSlaExceeded(app) && app.currentStage !== 'DISBURSED' && app.currentStage !== 'REJECTED';
                return (
                  <TableRow key={app.id}>
                    <TableCell className="py-3">
                      <span className="block font-bold text-foreground">{app.customerName}</span>
                      <span className="block text-[10px] tabular-nums text-slate-500">
                        {app.applicationNumber} · AO {app.accountOfficerName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusPill stage={app.currentStage} />
                      {lewat && (
                        <span className="mt-1 block text-[10px] font-bold text-danger">Lewat batas waktu</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right font-bold tabular-nums text-foreground">
                      {rupiah(app.requestedPlafon)}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="block max-w-[16rem] truncate text-slate-600">{app.purposeDetails || '—'}</span>
                      <span className="block text-[10px] text-slate-500">{app.requestedTenorMonths} bulan</span>
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-slate-600">
                      {tanggalPendek(app.createdAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setViewerModal({ isOpen: true, app })}>
                          <FileText className="mr-1 h-3.5 w-3.5" /> Berkas
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setActionModal({ isOpen: true, app })}>
                          Tindak lanjut
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* ------------------------------------------------ formulir pengajuan */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Pengajuan kredit baru"
        description="Formulir 01 permohonan kredit. Kolom bertanda bintang wajib diisi."
        className="max-w-3xl"
      >
        <form onSubmit={handleNewSubmit} className="space-y-6">
          <input ref={ocrFileInputRef} type="file" accept="image/*,application/pdf" className="hidden" />

          {galatPengajuan && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-xs font-medium leading-relaxed text-danger"
            >
              {galatPengajuan}
            </div>
          )}

          {/* Pengisi cepat, dinamai apa adanya. */}
          <div className="rounded-xl border border-border bg-surface-muted px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="text-[11px] font-bold text-foreground">Isi cepat dengan data contoh</span>
              {CONTOH_UJI.map(c => (
                <button
                  key={c.id} type="button" onClick={() => pakaiContoh(c)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
              Data karangan untuk uji coba, termasuk NIK-nya. Bukan hasil pemindaian KTP dan bukan
              dari core banking. Jangan dikirim sebagai pengajuan sungguhan.
            </p>
            {pesanContoh && (
              <p className="mt-2 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[11px] font-bold text-warning">
                {pesanContoh}
              </p>
            )}
          </div>

          {/* --------------------------- data diri --------------------------- */}
          <section>
            <h3 className="border-b border-border pb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              Data diri pemohon
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Isian label="Nama lengkap" id="f-nama" wajib className="sm:col-span-2"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <Isian label="NIK" id="f-nik" wajib maxLength={16} inputMode="numeric"
                value={formData.ktp} onChange={e => setFormData({ ...formData, ktp: e.target.value })} />
              <Isian label="Nomor HP" id="f-hp" wajib type="tel" inputMode="tel"
                value={formData.wa} onChange={e => setFormData({ ...formData, wa: e.target.value })} />
              <Pilihan label="Status perkawinan" id="f-kawin" wajib
                value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                <option value="Single / Belum Menikah">Belum menikah</option>
                <option value="Menikah">Menikah</option>
                <option value="Janda / Duda">Janda / duda</option>
              </Pilihan>
              <Isian label="Nama ibu kandung" id="f-ibu" wajib
                value={formData.motherName} onChange={e => setFormData({ ...formData, motherName: e.target.value })} />
              <Isian label="Nama suami / istri" id="f-pasangan" className="sm:col-span-2"
                petunjuk="Kosongkan bila belum menikah."
                value={formData.spouseName} onChange={e => setFormData({ ...formData, spouseName: e.target.value })} />
              <Isian label="Alamat" id="f-alamat" wajib className="sm:col-span-2"
                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-4">
                <Isian label="RT / RW" id="f-rtrw" wajib value={formData.rtRw} onChange={handleRtRwChange} />
                <Isian label="Kelurahan" id="f-kel" wajib
                  value={formData.kelurahan} onChange={e => setFormData({ ...formData, kelurahan: e.target.value })} />
                <Isian label="Kecamatan" id="f-kec" wajib
                  value={formData.kecamatan} onChange={e => setFormData({ ...formData, kecamatan: e.target.value })} />
                <Isian label="Kabupaten" id="f-kab" wajib
                  value={formData.kabupaten} onChange={e => setFormData({ ...formData, kabupaten: e.target.value })} />
              </div>
            </div>
          </section>

          {/* --------------------------- fasilitas --------------------------- */}
          <section>
            <h3 className="border-b border-border pb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              Fasilitas yang dimohon
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Isian label="Plafon (Rp)" id="f-plafon" wajib type="number" min={1000000}
                className="sm:col-span-2"
                petunjuk={formData.amount ? rupiah(Number(formData.amount)) : 'Minimal Rp 1.000.000'}
                value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              <Isian label="Jangka waktu (bulan)" id="f-tenor" wajib type="number" min={1} max={120}
                value={formData.termMonths} onChange={e => setFormData({ ...formData, termMonths: e.target.value })} />
              <Isian label="Suku bunga (% per tahun)" id="f-bunga" type="number" step="0.01"
                value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} />
              <Isian label="Jenis usaha atau pekerjaan" id="f-usaha" wajib className="sm:col-span-2"
                value={formData.businessType} onChange={e => setFormData({ ...formData, businessType: e.target.value })} />
              <Pilihan label="Jenis kredit" id="f-jeniskredit" wajib
                value={formData.creditType} onChange={e => setFormData({ ...formData, creditType: e.target.value })}>
                <option value="Umum">Umum</option>
                <option value="Tepat">Tepat</option>
                <option value="KKKB">KKKB</option>
              </Pilihan>
              <Pilihan label="Tujuan penggunaan" id="f-tujuan" wajib
                value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })}>
                <option value="Modal Kerja Usaha">Modal kerja usaha</option>
                <option value="Investasi">Investasi</option>
                <option value="Konsumtif">Konsumtif</option>
              </Pilihan>
              <Pilihan label="Status debitur" id="f-statusdebitur" wajib className="sm:col-span-2"
                value={formData.debtorStatus} onChange={e => setFormData({ ...formData, debtorStatus: e.target.value })}>
                <option value="Debitur Baru">Debitur baru</option>
                <option value="Debitur Lama">Debitur lama</option>
              </Pilihan>
            </div>
          </section>

          {/* --------------------------- lampiran --------------------------- */}
          <section>
            <h3 className="border-b border-border pb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              Lampiran
            </h3>
            <div className="mt-4 space-y-4">
              {[
                {
                  judul: 'Syarat utama debitur',
                  berkas: [
                    ['ktp', 'KTP pemohon & pasangan'],
                    ['kk', 'Kartu keluarga'],
                    ['suratNikah', 'Surat nikah atau cerai'],
                    ['mutasi', 'Mutasi rekening'],
                  ] as const,
                },
                {
                  judul: 'Syarat agunan',
                  berkas: [
                    ['shm', 'Sertifikat SHM atau SHGB'],
                    ['bpkb', 'BPKB dan STNK'],
                    ['esekEsek', 'Gesek nomor rangka & mesin'],
                    ['ktpPenjamin', 'KTP penjamin'],
                  ] as const,
                },
              ].map(grup => (
                <div key={grup.judul}>
                  <p className="mb-2 text-[11px] font-bold text-foreground">{grup.judul}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {grup.berkas.map(([key, label]) => {
                      const namaBerkas = uploadedFiles[key];
                      const gambar = uploadedImages[key];
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-ring"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            {gambar ? (
                              <img src={gambar} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                            ) : namaBerkas ? (
                              <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                            ) : (
                              <span className="h-4 w-4 shrink-0 rounded border-2 border-border" />
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-foreground">{label}</span>
                              {namaBerkas && (
                                <span className="block truncate text-[10px] text-success">
                                  {gambar ? 'Foto terlampir' : namaBerkas}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-foreground">
                            <Upload className="h-3 w-3" /> {namaBerkas ? 'Ganti' : 'Unggah'}
                          </span>
                          <input type="file" className="sr-only" accept="image/*,.pdf"
                            onChange={e => handleFileChange(key, e)} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsNewModalOpen(false)}>
              <X className="mr-1.5 h-4 w-4" /> Batal
            </Button>
            <Button type="submit">
              <CheckCircle className="mr-1.5 h-4 w-4" /> Simpan & kirim
            </Button>
          </div>
        </form>
      </Modal>

      <WorkflowActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, app: null })}
        title={getStageConfig(actionModal.app?.currentStage).title}
        subtitle={getStageConfig(actionModal.app?.currentStage).subtitle}
        applicationId={actionModal.app?.applicationNumber || ''}
        customerName={actionModal.app?.customerName || ''}
        currentStage={actionModal.app?.currentStage || 'SUBMITTED'}
        availableActions={['SUBMITTED', 'DRAFT'].includes(actionModal.app?.currentStage || '') ? ['PROCEED', 'REJECT'] : []}
        proceedStage={getStageConfig(actionModal.app?.currentStage).next as CreditAppStage}
        proceedLabel={getStageConfig(actionModal.app?.currentStage).label}
        onSubmit={(action, nextStage, notes, fileUrl, fileName) => {
          if (!actionModal.app) return;
          updateCreditAppStage(actionModal.app.id, nextStage, notes, fileUrl, fileName);
          setActionModal({ isOpen: false, app: null });
        }}
      />

      <DocumentViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal({ isOpen: false, app: null })}
        documents={viewerModal.app?.documents || []}
        customerName={viewerModal.app?.customerName || ''}
        applicationNumber={viewerModal.app?.applicationNumber || ''}
        app={viewerModal.app}
      />
    </StageShell>
  );
};
