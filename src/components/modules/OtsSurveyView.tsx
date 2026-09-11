import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Inbox, MapPin, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditApplication } from '../../types';
import { StageShell } from '../credit/StageShell';
import {
  BarisAntrean, BelumAdaPilihan, Kosong, NadaPill, Panel, StageWorkbench, StatusPill,
} from '../credit/StageParts';
import { rupiah, sisaSla, tanggalPendek } from '../credit/pipeline';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

/**
 * Tahap 2 — Survei Lapangan.
 *
 * Halaman ini sebelumnya sama sekali bukan halaman pipeline kredit. Isinya
 * simulasi ponsel: bingkai perangkat selebar 400px lengkap dengan poni, jam
 * status bar, dan bilah tab bawah, yang di dalamnya menjalankan layar absensi
 * dan rekap cuti pegawai. Rel tahap kredit ikut terjepit ke dalam kolom selebar
 * ponsel itu sehingga terpotong di layar lebar.
 *
 * Aktivitas lapangan dan absensi sekarang punya aplikasi Android sendiri, jadi
 * peniruan ponsel di dalam peramban tidak lagi punya alasan untuk ada. Yang
 * dibutuhkan di web adalah yang dikerjakan orang di meja: melihat berkas mana
 * yang menunggu disurvei dan membaca hasil survei yang sudah masuk.
 *
 * `submitSurveyReport` tetap dipakai, dengan bentuk data yang sama. Pencatatan
 * kunjungan penagihan dan absensi tidak lagi dari sini — keduanya milik modul
 * Penagihan dan aplikasi lapangan, bukan tahap survei kredit.
 */

const kelasIsian =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground ' +
  'placeholder:text-muted outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

const Label: React.FC<{ children: React.ReactNode; untuk: string }> = ({ children, untuk }) => (
  <label htmlFor={untuk} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
    {children}
  </label>
);

const Baris: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
    <dt className="text-[11px] text-slate-500">{k}</dt>
    <dd className="text-right text-xs font-bold tabular-nums text-foreground">{v}</dd>
  </div>
);

const KONDISI_USAHA = [
  { nilai: 'AKTIF_RAMAI', label: 'Aktif dan ramai' },
  { nilai: 'SEDANG', label: 'Sedang' },
  { nilai: 'SEPI', label: 'Sepi' },
  { nilai: 'TIDAK_BEROPERASI', label: 'Tidak beroperasi' },
] as const;

const TANGGAPAN_TETANGGA = [
  { nilai: 'SANGAT_POSITIF', label: 'Sangat positif' },
  { nilai: 'POSITIF', label: 'Positif' },
  { nilai: 'NETRAL', label: 'Netral' },
  { nilai: 'NEGATIF', label: 'Negatif' },
] as const;

const KEPEMILIKAN = [
  { nilai: 'MILIK_SENDIRI', label: 'Milik sendiri' },
  { nilai: 'SEWA_KONTRAK', label: 'Sewa atau kontrak' },
  { nilai: 'MILIK_KELUARGA', label: 'Milik keluarga' },
] as const;

const labelDari = (daftar: readonly { nilai: string; label: string }[], nilai?: string) =>
  daftar.find(d => d.nilai === nilai)?.label ?? '—';

export const OtsSurveyView: React.FC = () => {
  const { creditApplications, submitSurveyReport, currentUser } = useApp();

  // Berkas yang perlu atau sudah disurvei.
  const antrean = creditApplications.filter(
    (a) => a.currentStage === 'SLIK' || a.currentStage === 'SURVEY' || a.survey
  );

  const [terpilihId, setTerpilihId] = useState<string>(antrean.length > 0 ? antrean[0].id : '');
  useEffect(() => {
    if (antrean.length === 0) { if (terpilihId) setTerpilihId(''); return; }
    if (!antrean.some(a => a.id === terpilihId)) setTerpilihId(antrean[0].id);
  }, [antrean, terpilihId]);

  const app = creditApplications.find(a => a.id === terpilihId) as CreditApplication | undefined;
  const survei = app?.survey;

  const [form, setForm] = useState({
    houseOwnership: 'MILIK_SENDIRI' as string,
    businessCondition: 'SEDANG' as string,
    neighborFeedback: 'NETRAL' as string,
    neighborIntervieweeName: '',
    neighborIntervieweeRelation: '',
    locationAddress: '',
    surveyorSummary: '',
    surveyScore: 0,
  });

  useEffect(() => {
    if (!app) return;
    setForm(f => ({
      ...f,
      locationAddress: app.address ?? '',
      neighborIntervieweeName: '',
      neighborIntervieweeRelation: '',
      surveyorSummary: '',
      surveyScore: 0,
    }));
  }, [app?.id]);

  const siapKirim = form.surveyorSummary.trim().length > 0 && form.surveyScore > 0;

  const kirim = () => {
    if (!app || !siapKirim) return;
    submitSurveyReport(app.id, {
      ...form,
      surveyorId: currentUser?.id,
      surveyorName: currentUser?.name,
      conductedDate: new Date().toISOString(),
      status: 'COMPLETED',
    });
  };

  return (
    <StageShell
      stage="Field Survey"
      judul="Survei Lapangan"
      keterangan="Memantau berkas yang menunggu kunjungan surveyor dan membaca hasil survei yang sudah masuk."
    >
      {/* Menjelaskan ke mana perginya pekerjaan lapangan, supaya tidak dicari di web. */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-slate-600">
          Pengambilan foto, titik lokasi, dan absensi surveyor dikerjakan lewat aplikasi Android.
          Halaman web ini untuk memantau antrean dan membaca hasilnya, atau mencatat survei dari kantor
          bila laporannya masuk di luar aplikasi.
        </p>
      </div>

      <StageWorkbench
        judulAntrean="Antrean survei"
        jumlah={antrean.length}
        antrean={
          antrean.length === 0 ? (
            <Kosong
              rapat
              icon={Inbox}
              judul="Tidak ada berkas menunggu survei"
              keterangan="Berkas masuk ke sini setelah pemeriksaan SLIK selesai."
            />
          ) : (
            antrean.map(a => {
              const sla = sisaSla(a.slaDeadline, a.slaExceeded);
              return (
                <BarisAntrean
                  key={a.id}
                  terpilih={terpilihId === a.id}
                  onClick={() => setTerpilihId(a.id)}
                  utama={a.customerName}
                  kedua={`${rupiah(a.requestedPlafon)} · ${a.kecamatan || a.kabupaten || 'lokasi belum dicatat'}`}
                  kanan={
                    a.survey
                      ? <NadaPill label="Sudah disurvei" nada="success" />
                      : <StatusPill stage={a.currentStage} />
                  }
                  bawah={
                    sla.nada !== 'neutral' ? (
                      <span className={cn('text-[10px] font-bold', sla.nada === 'danger' ? 'text-danger' : 'text-warning')}>
                        {sla.label}
                      </span>
                    ) : undefined
                  }
                />
              );
            })
          )
        }
      >
        {!app ? (
          <BelumAdaPilihan
            icon={MapPin}
            judul="Pilih berkas untuk melihat surveinya"
            keterangan="Klik salah satu nama di antrean sebelah kiri. Hasil survei atau lembar pencatatannya akan terbuka di sini."
            antreanKosong={antrean.length === 0}
          />
        ) : survei ? (
          /* --------------------------- hasil survei --------------------------- */
          <div className="space-y-5">
            <Panel judul={`Hasil survei · ${app.customerName}`}>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <dl>
                  <Baris k="Surveyor" v={survei.surveyorName || '—'} />
                  <Baris k="Tanggal survei" v={tanggalPendek(survei.conductedDate || survei.scheduledDate)} />
                  <Baris k="Skor survei" v={Number.isFinite(Number(survei.surveyScore)) ? `${survei.surveyScore}/100` : '—'} />
                  <Baris k="Kepemilikan rumah" v={labelDari(KEPEMILIKAN, survei.houseOwnership)} />
                </dl>
                <dl>
                  <Baris k="Kondisi usaha" v={labelDari(KONDISI_USAHA, survei.businessCondition)} />
                  <Baris k="Tanggapan tetangga" v={labelDari(TANGGAPAN_TETANGGA, survei.neighborFeedback)} />
                  <Baris k="Narasumber" v={survei.neighborIntervieweeName || '—'} />
                  <Baris k="Alamat lokasi" v={survei.locationAddress || app.address || '—'} />
                </dl>
              </div>

              {survei.surveyorSummary && (
                <div className="mt-4 rounded-xl border border-border bg-surface-muted px-3.5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Catatan surveyor</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{survei.surveyorSummary}</p>
                </div>
              )}
            </Panel>

            {survei.photos?.length > 0 && (
              <Panel judul="Foto lapangan" hitungan={survei.photos.length}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {survei.photos.map(f => (
                    <figure key={f.id} className="overflow-hidden rounded-xl border border-border">
                      <img src={f.url} alt={f.label} className="h-28 w-full object-cover" />
                      <figcaption className="truncate px-2 py-1.5 text-[10px] font-bold text-foreground">
                        {f.label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        ) : (
          /* --------------------------- catat survei --------------------------- */
          <Panel judul={`Catat hasil survei · ${app.customerName}`}>
            <p className="-mt-1 mb-5 text-[11px] tabular-nums text-slate-500">
              {app.applicationNumber} · {rupiah(app.requestedPlafon)} · {app.requestedTenorMonths} bulan
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label untuk="s-alamat">Alamat lokasi yang dikunjungi</Label>
                <input id="s-alamat" className={kelasIsian} value={form.locationAddress}
                  onChange={e => setForm(f => ({ ...f, locationAddress: e.target.value }))} />
              </div>

              <div>
                <Label untuk="s-rumah">Kepemilikan rumah</Label>
                <select id="s-rumah" className={cn(kelasIsian, 'cursor-pointer')} value={form.houseOwnership}
                  onChange={e => setForm(f => ({ ...f, houseOwnership: e.target.value }))}>
                  {KEPEMILIKAN.map(o => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <Label untuk="s-usaha">Kondisi usaha</Label>
                <select id="s-usaha" className={cn(kelasIsian, 'cursor-pointer')} value={form.businessCondition}
                  onChange={e => setForm(f => ({ ...f, businessCondition: e.target.value }))}>
                  {KONDISI_USAHA.map(o => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <Label untuk="s-narasumber">Nama narasumber</Label>
                <input id="s-narasumber" className={kelasIsian} placeholder="Tetangga atau perangkat setempat"
                  value={form.neighborIntervieweeName}
                  onChange={e => setForm(f => ({ ...f, neighborIntervieweeName: e.target.value }))} />
              </div>

              <div>
                <Label untuk="s-hubungan">Hubungan dengan pemohon</Label>
                <input id="s-hubungan" className={kelasIsian} placeholder="Misalnya tetangga sebelah, ketua RT"
                  value={form.neighborIntervieweeRelation}
                  onChange={e => setForm(f => ({ ...f, neighborIntervieweeRelation: e.target.value }))} />
              </div>

              <div>
                <Label untuk="s-tanggapan">Tanggapan lingkungan</Label>
                <select id="s-tanggapan" className={cn(kelasIsian, 'cursor-pointer')} value={form.neighborFeedback}
                  onChange={e => setForm(f => ({ ...f, neighborFeedback: e.target.value }))}>
                  {TANGGAPAN_TETANGGA.map(o => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <Label untuk="s-skor">Skor survei (0–100)</Label>
                <input id="s-skor" type="number" min={0} max={100} placeholder="0–100"
                  className={cn(kelasIsian, 'tabular-nums')}
                  value={form.surveyScore || ''}
                  onChange={e => setForm(f => ({
                    ...f, surveyScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  }))} />
              </div>

              <div className="sm:col-span-2">
                <Label untuk="s-catatan">Catatan surveyor</Label>
                <textarea id="s-catatan" rows={4} className={cn(kelasIsian, 'resize-y')}
                  placeholder="Apa yang Anda lihat di lokasi: kondisi tempat usaha, keramaian, akses jalan, dan hal yang perlu diperhatikan."
                  value={form.surveyorSummary}
                  onChange={e => setForm(f => ({ ...f, surveyorSummary: e.target.value }))} />
              </div>
            </div>

            <div className="mt-5 flex flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">
                {siapKirim
                  ? 'Hasil survei akan tercatat pada berkas ini.'
                  : 'Isi catatan surveyor dan skor survei sebelum menyimpan.'}
              </p>
              <Button type="button" disabled={!siapKirim} onClick={kirim}>
                <ClipboardCheck className="mr-1.5 h-4 w-4" /> Simpan hasil survei
              </Button>
            </div>
          </Panel>
        )}
      </StageWorkbench>
    </StageShell>
  );
};
