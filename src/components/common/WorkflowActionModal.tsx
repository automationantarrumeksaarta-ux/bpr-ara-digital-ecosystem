import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, RotateCcw, XCircle, FileText, UploadCloud, Loader2, Check } from 'lucide-react';
import { CreditAppStage } from '../../types';

export type ActionType = 'PROCEED' | 'RETURN' | 'REJECT';

interface WorkflowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  applicationId: string;
  customerName: string;
  currentStage: CreditAppStage;
  availableActions: ActionType[];
  returnOptions?: { stage: CreditAppStage; label: string }[];
  proceedStage?: CreditAppStage;
  proceedLabel?: string;
  onSubmit: (action: ActionType, nextStage: CreditAppStage, notes: string, fileUrl?: string, fileName?: string) => void;
}

export const WorkflowActionModal: React.FC<WorkflowActionModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  applicationId,
  customerName,
  currentStage,
  availableActions,
  returnOptions = [],
  proceedStage,
  proceedLabel = 'Lanjutkan',
  onSubmit,
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedReturnStage, setSelectedReturnStage] = useState<CreditAppStage | ''>('');
  
  // File upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const getRequiredDocumentLabel = (stage: CreditAppStage): string | null => {
    switch (stage) {
      case 'VERIFICATION': return 'Upload Hasil Cek SLIK OJK (PDF/Image)';
      case 'SLIK': return 'Surat Tugas / Memo (Opsional)';
      case 'SURVEY': return 'Laporan Kunjungan OTS & Foto (PDF/Image)';
      case 'ANALYSIS': return 'Memorandum Analisis Kredit / 5C (PDF)';
      case 'LEGAL_REVIEW': return 'Draft Perjanjian Kredit & Opini Legal (PDF)';
      case 'CREDIT_COMMITTEE': return 'Surat Keputusan Komite / Notulen (PDF)';
      case 'APPROVED': return 'Bukti Transfer Pencairan & Tanda Terima (PDF/Image)';
      default: return null;
    }
  };

  const requiredDocLabel = getRequiredDocumentLabel(currentStage);
  // We only require documents if the action is PROCEED, and stage is not SLIK (which asks for optional Memo)
  const isDocumentRequired = requiredDocLabel && selectedAction === 'PROCEED' && currentStage !== 'SLIK'; 
  
  const isSubmitDisabled = !selectedAction || 
    (selectedAction === 'RETURN' && !selectedReturnStage) || 
    (isDocumentRequired && !uploadedFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate file upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadedFile(file);
            return 100;
          }
          return prev + 25;
        });
      }, 300);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    let targetStage: CreditAppStage = currentStage;
    if (selectedAction === 'PROCEED' && proceedStage) {
      targetStage = proceedStage;
    } else if (selectedAction === 'RETURN' && selectedReturnStage) {
      targetStage = selectedReturnStage as CreditAppStage;
    } else if (selectedAction === 'REJECT') {
      targetStage = 'REJECTED';
    }

    const mockFileUrl = uploadedFile ? `https://storage.bpr-ara.com/docs/${uploadedFile.name}` : undefined;
    onSubmit(selectedAction, targetStage, notes, mockFileUrl, uploadedFile?.name);
    
    // Reset states after submit
    setSelectedAction(null);
    setNotes('');
    setSelectedReturnStage('');
    setUploadedFile(null);
    setUploadProgress(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-semibold mb-1">Informasi Aplikasi</p>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{customerName}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">{applicationId}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                    Tahap: {currentStage}
                  </span>
                </div>
              </div>

              <form id="workflowActionForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Pilih Tindak Lanjut
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableActions.includes('PROCEED') && (
                      <button
                        type="button"
                        onClick={() => setSelectedAction('PROCEED')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          selectedAction === 'PROCEED'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/50'
                        }`}
                      >
                        <CheckCircle className="mb-2" size={24} />
                        <span className="text-xs font-bold text-center">{proceedLabel}</span>
                      </button>
                    )}

                    {availableActions.includes('RETURN') && (
                      <button
                        type="button"
                        onClick={() => setSelectedAction('RETURN')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          selectedAction === 'RETURN'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <RotateCcw className="mb-2" size={24} />
                        <span className="text-xs font-bold text-center">Kembalikan</span>
                      </button>
                    )}

                    {availableActions.includes('REJECT') && (
                      <button
                        type="button"
                        onClick={() => setSelectedAction('REJECT')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          selectedAction === 'REJECT'
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-200 hover:bg-rose-50/50'
                        }`}
                      >
                        <XCircle className="mb-2" size={24} />
                        <span className="text-xs font-bold text-center">Tolak (Reject)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Return Stage Options */}
                {selectedAction === 'RETURN' && returnOptions.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Kembalikan Ke Tahap:
                    </label>
                    <select
                      required
                      value={selectedReturnStage}
                      onChange={(e) => setSelectedReturnStage(e.target.value as CreditAppStage)}
                      className="w-full bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="" disabled>Pilih tahap tujuan...</option>
                      {returnOptions.map((opt) => (
                        <option key={opt.stage} value={opt.stage}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* File Upload Section specifically for PROCEED */}
                {selectedAction === 'PROCEED' && requiredDocLabel && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UploadCloud size={14} /> 
                      {requiredDocLabel}
                      {isDocumentRequired && <span className="text-rose-500">* Wajib</span>}
                    </label>
                    
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        accept=".pdf,image/*"
                      />
                      
                      <div className="p-5 flex flex-col items-center justify-center text-center">
                        {isUploading ? (
                          <div className="flex flex-col items-center text-blue-600">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <span className="text-xs font-bold">Mengunggah & Mengekstrak Dokumen ({uploadProgress}%)</span>
                            <div className="w-32 h-1.5 bg-blue-100 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          </div>
                        ) : uploadedFile ? (
                          <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                              <Check className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold truncate max-w-xs">{uploadedFile.name}</span>
                            <span className="text-[10px] text-slate-500 mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                            <button type="button" onClick={removeFile} className="relative z-20 mt-3 text-[10px] px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-bold hover:bg-rose-200 transition-colors">
                              Hapus & Ganti File
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-500">
                            <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Drag & Drop atau Klik untuk Upload</span>
                            <span className="text-[10px] mt-1">Format didukung: PDF, JPG, PNG (Max 5MB)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notes Section */}
                {selectedAction && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <FileText size={14} /> 
                      {selectedAction === 'REJECT' ? 'Alasan Penolakan' : selectedAction === 'RETURN' ? 'Catatan Perbaikan / Revisi' : 'Catatan Tindak Lanjut (Opsional)'}
                    </label>
                    <textarea
                      required={selectedAction === 'REJECT' || selectedAction === 'RETURN'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        selectedAction === 'REJECT'
                          ? 'Masukkan alasan penolakan secara spesifik...'
                          : selectedAction === 'RETURN'
                          ? 'Masukkan bagian mana yang perlu diperbaiki atau dilengkapi...'
                          : 'Tambahkan catatan opsional jika ada...'
                      }
                      className="w-full h-24 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 transition-colors resize-none"
                    ></textarea>
                  </motion.div>
                )}
              </form>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="workflowActionForm"
                disabled={isSubmitDisabled}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
              >
                Kirim Keputusan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
