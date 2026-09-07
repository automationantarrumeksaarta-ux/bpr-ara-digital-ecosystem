import React from 'react';
import { CreditApplication } from '../../types';

interface Form01PreviewProps {
  app: CreditApplication;
}

export const Form01Preview: React.FC<Form01PreviewProps> = ({ app }) => {
  return (
    <div className="w-full h-full bg-slate-900/10 p-4 sm:p-8 flex items-start justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-[800px] shadow-2xl rounded-sm p-8 sm:p-12 relative overflow-hidden text-slate-800">
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg]">
          <h1 className="text-6xl sm:text-8xl font-black whitespace-nowrap tracking-widest text-slate-900">
            MASTER BPR ARA
            <br />
            GENERATED PDF
          </h1>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[2px] border-slate-900 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <img 
              src="https://antarrumeksaarta.vittoriaproperti.com/uploads/profile/d96a287d-a983-4e54-8719-b46c7a2f3694.png" 
              alt="Logo BPR ARA" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">PT. BPR ANTAR RUMEKSA ARTA</h2>
              <p className="text-[11px] font-bold text-slate-600">FORMULIR PERMOHONAN KREDIT</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="bg-[#0f172a] text-white font-bold px-3 py-1 rounded-full text-[11px] mb-1.5 shadow-sm">
              Form 01
            </span>
            <span className="font-mono text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              REG ID: {app.applicationNumber}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-6 relative z-10 font-sans">
          
          {/* Section A */}
          <div className="border border-slate-300/80 rounded-[8px] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100/80">
              <h3 className="font-bold text-slate-800 tracking-wide text-[12px]">A. DATA UMUM</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] leading-relaxed">
              
              {/* Left Column Data */}
              <div className="space-y-1">
                <div>
                  <span className="text-[#597594]">Nama Lengkap :</span> <strong className="text-slate-900 ml-1">{app.customerName}</strong>
                </div>
                <div>
                  <span className="text-[#597594]">Alamat :</span> <span className="text-slate-800 ml-1">{app.address || 'Sesuai KTP Terlampir'}</span>
                </div>
                <div>
                  <span className="text-[#597594]">RT/RW :</span> <span className="text-slate-800 ml-1">{app.rtRw || '-'}</span> <span className="text-[#597594] ml-1">| Kel :</span> <span className="text-slate-800 ml-1">{app.kelurahan || '-'}</span>
                </div>
                <div>
                  <span className="text-[#597594]">Kec :</span> <span className="text-slate-800 ml-1">{app.kecamatan || '-'}</span> <span className="text-[#597594] ml-1">| Kab :</span> <span className="text-slate-800 ml-1">{app.kabupaten || '-'}</span>
                </div>
              </div>

              {/* Right Column Data */}
              <div className="space-y-1">
                <div>
                  <span className="text-[#597594]">No. KTP :</span> <strong className="text-slate-900 ml-1 font-mono">{app.cif.replace('CIF-', '3571')}</strong>
                </div>
                <div>
                  <span className="text-[#597594]">No. Telepon/WA :</span> <strong className="text-slate-900 ml-1 font-mono">{app.phone}</strong>
                </div>
                <div>
                  <span className="text-[#597594]">Status Perkawinan :</span> <span className="text-slate-800 ml-1">{app.maritalStatus || '-'}</span>
                </div>
                <div>
                  <span className="text-[#597594]">Ibu Kandung :</span> <span className="text-slate-800 ml-1">{app.motherName || '-'}</span>
                </div>
                <div>
                  <span className="text-[#597594]">Suami/Istri :</span> <span className="text-slate-800 ml-1">{app.spouseName || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B */}
          <div className="border border-slate-300/80 rounded-[8px] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100/80">
              <h3 className="font-bold text-slate-800 tracking-wide text-[12px]">B. DATA KREDIT</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-[#597594]">Pengajuan Kredit :</span> <strong className="text-[#2563eb] text-[12px] ml-1">Rp {app.requestedPlafon.toLocaleString('id-ID')}</strong>
                </div>
                <div>
                  <span className="text-[#597594]">Jangka Waktu :</span> <span className="text-slate-800 ml-1">{app.requestedTenorMonths} Bulan (Flat/Anuitas)</span>
                </div>
              </div>
              
              <div className="bg-[#eef2f6]/60 border border-slate-200/80 rounded-md p-3.5 text-[11px] text-[#475569] space-y-2">
                <p className="font-bold mb-2 text-slate-900 text-[10px] tracking-wide">Diisi Oleh Petugas Bank ( Centang v ) :</p>
                <div>
                  Jenis Kredit : 
                  <span className="mx-2 inline-flex items-center gap-1">{app.creditType === 'Umum' ? '[v]' : '[ ]'} Umum</span>
                  <span className="mx-2 inline-flex items-center gap-1">{app.creditType === 'Tepat' ? '[v]' : '[ ]'} Tepat</span>
                  <span className="mx-2 inline-flex items-center gap-1">{app.creditType === 'KKKB' ? '[v]' : '[ ]'} KKKB</span>
                  <span className="mx-2 inline-flex items-center gap-1">[ ] Deposito</span>
                </div>
                <div>
                  Status : 
                  <span className="mx-2 inline-flex items-center gap-1">{app.debtorStatus === 'Debitur Baru' ? '[v]' : '[ ]'} Baru</span>
                  <span className="mx-2 inline-flex items-center gap-1">{app.debtorStatus === 'Debitur Lama' ? '[v]' : '[ ]'} Lama - Rek: -</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section C */}
          <div className="border border-slate-300/80 rounded-[8px] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100/80">
              <h3 className="font-bold text-slate-800 tracking-wide text-[12px]">C. PERTANYAAN UTAMA</h3>
            </div>
            <div className="p-5 space-y-3 text-[11px] text-slate-700">
              <div className="flex gap-1.5">
                <span>1.</span>
                <p><span className="text-[#597594]">Sumber info tentang BPR ARA :</span> Rekomendasi / Media Sosial</p>
              </div>
              <div className="flex gap-1.5">
                <span>2.</span>
                <p><span className="text-[#597594]">Penggunaan uang pinjaman :</span> {app.purposeDetails || 'Pengembangan modal usaha harian & persediaan barang'}</p>
              </div>
              <div className="flex gap-1.5">
                <span>3.</span>
                <p><span className="text-[#597594]">Rencana sumber angsuran :</span> Hasil arus kas usaha harian / penerimaan rutin</p>
              </div>
            </div>
          </div>

          {/* Footer Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
            <div>
              <div className="border-b-[1.5px] border-slate-800 pb-1.5 mb-2.5 text-[11px] font-bold text-slate-900">
                Dilengkapi Calon Debitur (Syarat)
              </div>
              <div className="space-y-1.5 text-[10px] font-medium text-slate-600">
                <div>[v] Scan Fotocopy KTP (Pemohon & Pasangan)</div>
                <div>[v] Scan Fotocopy KK / Surat Nikah</div>
                <div>[ ] Scan Fotocopy Agunan (BPKB / SHM)</div>
                <div>[ ] Dokumen Penghasilan (Slip Gaji / Rek Koran)</div>
              </div>
            </div>
            
            <div>
              <div className="border-b-[1.5px] border-slate-800 pb-1.5 mb-2.5 text-[11px] font-bold text-slate-900">
                Dilengkapi Petugas Bank
              </div>
              <div className="space-y-1.5 text-[10px] font-medium text-slate-600">
                <div>[v] Form Permohonan Kredit (Form 01)</div>
                <div>[ ] Form Analisa 5C / Kelayakan Usaha</div>
                <div>[ ] Laporan SLIK OJK Calon Debitur</div>
                <div>[ ] Laporan Taksasi Agunan / Survey Lapangan</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
