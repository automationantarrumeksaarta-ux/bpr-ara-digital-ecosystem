import React, { useState, useEffect } from 'react';
import { X, FileText, Download, ChevronRight, File, FileImage, ShieldCheck } from 'lucide-react';
import { CreditDocument, CreditApplication } from '../../types';
import { Form01Preview } from './Form01Preview';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents?: CreditDocument[];
  customerName?: string;
  applicationNumber?: string;
  app?: CreditApplication | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  customerName = '',
  applicationNumber = '',
  app = null,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<CreditDocument | null>(null);

  useEffect(() => {
    if (isOpen && documents.length > 0) {
      setSelectedDoc(documents[0]);
    } else if (!isOpen) {
      setSelectedDoc(null);
    }
  }, [isOpen, documents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Master Dossier Digital (BPR ARA)
            </h2>
            <p className="text-xs text-slate-500 mt-1">Nasabah: {customerName} | No: {applicationNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto p-3 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Daftar Dokumen</h3>
            {documents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Belum ada dokumen yang dilampirkan.</div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    selectedDoc?.id === doc.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedDoc?.id === doc.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {doc.url.startsWith('data:image') ? <FileImage className="w-5 h-5" /> : <File className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${selectedDoc?.id === doc.id ? 'text-blue-900' : 'text-slate-700'}`}>
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Oleh: {doc.uploadedBy} • Tahap: {doc.stage}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 self-center ${selectedDoc?.id === doc.id ? 'text-blue-500' : 'text-slate-300'}`} />
                </button>
              ))
            )}
          </div>

          {/* Main Viewer */}
          <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-6 overflow-y-auto relative">
            {selectedDoc ? (
              <div className="w-full max-w-2xl bg-white shadow-md border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">{selectedDoc.name}</span>
                  </div>
                  <a href={selectedDoc.url} download={selectedDoc.name} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                    <Download className="w-3 h-3" /> Unduh Asli
                  </a>
                </div>
                <div className="p-4 flex items-center justify-center bg-slate-200/50 min-h-[400px]">
                  {selectedDoc.type === 'FORM_01' && app ? (
                    <div className="w-full h-full bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
                      <Form01Preview app={app} />
                    </div>
                  ) : selectedDoc.url.startsWith('data:image') || selectedDoc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img src={selectedDoc.url} alt={selectedDoc.name} className="max-w-full max-h-[60vh] object-contain rounded border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="text-center p-8">
                      <File className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Preview tidak tersedia untuk format ini.</p>
                      <a href={selectedDoc.url} download={selectedDoc.name} className="inline-block mt-4 text-blue-600 font-bold hover:underline">Unduh Berkas</a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Pilih dokumen di sebelah kiri untuk melihat detail.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
