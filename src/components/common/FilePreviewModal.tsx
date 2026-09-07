import React, { useEffect, useState } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { EvidenceFile } from '../../types';
import { useGetTaskEvidence } from '../../hooks/useTasks';

interface FilePreviewModalProps {
  file: EvidenceFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // We always fetch because the Base64 field was removed from the backend
  const { data: blob, isLoading, isError } = useGetTaskEvidence(file?.id);

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [blob]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative max-w-5xl w-full h-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 md:-top-10 md:-right-10 p-3 text-white hover:text-gray-300 bg-black/50 md:bg-transparent rounded-full md:rounded-none z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        {isLoading ? (
          <div className="flex flex-col items-center text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Memuat file...</p>
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-[#18181A] p-8 rounded-2xl flex flex-col items-center max-w-md text-center text-red-500 shadow-2xl border border-gray-100 dark:border-gray-800">
            <X className="w-10 h-10 mb-4" />
            <p className="font-bold text-lg mb-2">Gagal memuat preview.</p>
            <p className="text-sm">File mungkin dihapus atau Anda tidak memiliki akses.</p>
          </div>
        ) : objectUrl && file.type.startsWith('image/') ? (
          <img src={objectUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        ) : objectUrl && file.type === 'application/pdf' ? (
          <iframe src={objectUrl} className="w-full h-full rounded-lg bg-white shadow-2xl" title="PDF Preview" />
        ) : (
          <div className="bg-white dark:bg-[#18181A] p-8 rounded-2xl flex flex-col items-center max-w-md text-center shadow-2xl border border-gray-100 dark:border-gray-800">
            <FileText className="w-20 h-20 text-gray-400 mb-6" />
            <p className="text-gray-800 dark:text-white font-bold mb-2 text-lg break-all">{file.name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Preview langsung tidak tersedia untuk tipe file ini. Silakan unduh untuk melihat.</p>
            {objectUrl ? (
              <a href={objectUrl} download={file.name} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download File
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
