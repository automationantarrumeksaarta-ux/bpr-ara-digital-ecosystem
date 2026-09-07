import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  Award, 
  X, 
  Building2, 
  Briefcase, 
  CheckCircle,
  FileCheck2,
  Lock,
  BookOpen,
  Landmark,
  BadgeAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StrukturManajemenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ManagementMember {
  title: string;
  name: string;
  category: 'KOMISARIS' | 'DIREKSI' | 'PEJABAT_EKSEKUTIF' | 'SUPPORT_OPERASIONAL';
  description?: string;
  badge?: string;
}

export const DEWAN_KOMISARIS_DIREKSI: ManagementMember[] = [
  {
    title: 'Komisaris Utama',
    name: 'Taka Ditya Darma, SE',
    category: 'KOMISARIS',
    badge: 'Pengawasan Tertinggi'
  },
  {
    title: 'Komisaris',
    name: 'Ir Syamsul Ma\'arif',
    category: 'KOMISARIS',
    badge: 'Pengawasan Manajemen'
  },
  {
    title: 'Direktur Utama',
    name: 'Muhammad Rizky Hidayat Sujimin, S.Sos',
    category: 'DIREKSI',
    badge: 'Eksekutif Tertinggi'
  },
  {
    title: 'Direktur YMFK',
    name: 'Tunggul Wisnu Hadi, SE',
    category: 'DIREKSI',
    badge: 'Direktur Operasional & YMFK'
  }
];

export const PEJABAT_EKSEKUTIF: ManagementMember[] = [
  {
    title: 'PE Audit Intern & Strategi Anti Fraud',
    name: 'Agus Santoso',
    category: 'PEJABAT_EKSEKUTIF',
    description: 'Penanggung jawab Audit Internal dan Penerapan Strategi Anti Fraud BPR ARA.'
  },
  {
    title: 'PE Kepatuhan, Manrisk, APU PPT PPSPM, & Integritas Laporan Keuangan',
    name: 'Huda Asrori',
    category: 'PEJABAT_EKSEKUTIF',
    description: 'Penanggung jawab Kepatuhan Regulasi OJK, Manajemen Risiko, APU-PPT, & Integritas Keuangan.'
  },
  {
    title: 'PE Literasi & Edukasi, PE Bisnis & Collection',
    name: 'Eny Setyoningsih',
    category: 'PEJABAT_EKSEKUTIF',
    description: 'Penanggung jawab Literasi Finansial, Edukasi Konsumen, Pengembangan Bisnis, & Penagihan (Collection).'
  }
];

export const DIVISI_SUPPORT_OPERASIONAL: ManagementMember[] = [
  {
    title: 'Teknologi Informasi (TI)',
    name: 'Ghaust Shamdani',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'CRM & Digitalisasi',
    name: 'Ahmad Wahyu Aji',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Admin - SDM - Legal',
    name: 'Lilis Ariyani',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Pengembangan SDM',
    name: 'Vergiawan A.S',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Accounting',
    name: 'Yuni Susilowati',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Analis Kredit',
    name: 'Agung Bekti P.',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Bagian Umum',
    name: 'Ichwan A.M / Sunarti',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Jaga Malam',
    name: 'Supardi',
    category: 'SUPPORT_OPERASIONAL'
  },
  {
    title: 'Customer Service',
    name: 'Posisi Kosong (—)',
    category: 'SUPPORT_OPERASIONAL'
  }
];

export interface OfficeBranch {
  branchName: string;
  staff: { title: string; name: string }[];
}

export const KANTOR_PUSAT_KAS: OfficeBranch[] = [
  {
    branchName: 'Kantor Pusat',
    staff: [
      { title: 'Teller', name: 'Tiara Suci P' },
      { title: 'Marketing Dana', name: 'Anik Budiarti & Nada Rizky Eka M' }
    ]
  },
  {
    branchName: 'Kantor Kas Jumapolo',
    staff: [
      { title: 'Kepala Kas', name: 'Tri Surono' },
      { title: 'Teller Kas', name: 'Nina Suryaningsih' }
    ]
  },
  {
    branchName: 'Kantor Kas Matesih',
    staff: [
      { title: 'Kepala Kas', name: 'Memet Fianka' },
      { title: 'Teller Kas', name: 'Karolina Rosita' },
      { title: 'Marketing Dana', name: 'Widi Miswari' }
    ]
  },
  {
    branchName: 'Kantor Kas Klodran',
    staff: [
      { title: 'Kepala Kas', name: 'Ariyanto' },
      { title: 'Teller Kas', name: 'Purnaning H T' }
    ]
  }
];

export const DIVISI_COLLECTION = [
  { title: 'Koordinator Collection', name: 'B. Windra D.H' },
  { title: 'Staff Collection', name: 'Y. Deddie E. & Wahid Budi S.' }
];

export default function StrukturManajemenModal({ isOpen, onClose }: StrukturManajemenModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shadow-xs">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Struktur Organisasi BPR ARA
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  Dewan Komisaris, Direksi & Pejabat Eksekutif (PE) Resmi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Section 1: Dewan Komisaris & Direksi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Dewan Komisaris & Direksi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEWAN_KOMISARIS_DIREKSI.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all shadow-xs"
                >
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-blue-200">
                    {item.title}
                  </span>
                  <h4 className="font-black text-slate-900 text-sm leading-tight mt-1">
                    {item.name}
                  </h4>
                  {item.badge && (
                    <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-500" />
                      {item.badge}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Pejabat Eksekutif (PE) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Pejabat Eksekutif (PE)
              </h3>
            </div>

            <div className="space-y-3">
              {PEJABAT_EKSEKUTIF.map((pe, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-xl">
                      {pe.title}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {pe.name}
                    </span>
                  </div>
                  {pe.description && (
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {pe.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Divisi Support & Operasional */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. Divisi Support & Operasional
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DIVISI_SUPPORT_OPERASIONAL.map((staff, idx) => {
                const isVacant = staff.name.includes('Kosong');
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isVacant 
                        ? 'bg-slate-50/60 border-dashed border-slate-300' 
                        : 'bg-gradient-to-br from-slate-50 to-emerald-50/20 border-slate-200 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        {staff.title}
                      </span>
                      <h4 className={`text-xs font-black mt-0.5 ${isVacant ? 'text-slate-400 italic' : 'text-slate-900'}`}>
                        {staff.name}
                      </h4>
                    </div>
                    {isVacant ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                        Vacant
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Kantor Pusat & Kantor Kas */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-amber-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                4. Jaringan Kantor Pusat & Kantor Kas
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KANTOR_PUSAT_KAS.map((branch, idx) => (
                <div 
                  key={idx}
                  className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 space-y-2 hover:border-amber-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Building2 size={14} className="text-amber-700" />
                      {branch.branchName}
                    </h4>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                      {branch.staff.length} Personel
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    {branch.staff.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-start justify-between text-xs gap-2">
                        <span className="text-[11px] font-bold text-slate-600 shrink-0">{st.title}:</span>
                        <span className="text-[11px] font-black text-slate-900 text-right">{st.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Divisi Collection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <BadgeAlert size={18} className="text-rose-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                5. Divisi Collection & Penagihan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIVISI_COLLECTION.map((col, idx) => (
                <div key={idx} className="bg-rose-50/50 border border-rose-200/80 p-3.5 rounded-2xl space-y-1 hover:border-rose-300 transition-all">
                  <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">
                    {col.title}
                  </span>
                  <h4 className="text-xs font-black text-slate-900">
                    {col.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="bg-blue-900 text-white p-4 rounded-2xl text-xs flex items-start gap-3 shadow-sm">
            <Building2 size={20} className="text-blue-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-blue-100 mb-0.5">PT BPR Antar Rumeksa Arta (BPR ARA)</p>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                Terdaftar dan diawasi oleh Otoritas Jasa Keuangan (OJK) serta merupakan peserta penjaminan Lembaga Penjamin Simpanan (LPS).
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Tutup Direktori
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
