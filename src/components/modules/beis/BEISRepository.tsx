import React, { useState } from 'react';
import { TaskItem, EvidenceFile } from '../../../types';
import { Search, Filter, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { FilePreviewModal } from '../../common/FilePreviewModal';
import { getBeisBadgeClass } from '../../../utils/beisUtils';

interface BEISRepositoryProps {
  tasks: TaskItem[];
}

export const BEISRepository: React.FC<BEISRepositoryProps> = ({ tasks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);

  const filteredTasks = tasks.filter(t => {
    if (filterDomain !== 'ALL' && t.beisDomain !== filterDomain) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (t.taskId && t.taskId.toLowerCase().includes(q)) ||
        (t.deskripsiTugas && t.deskripsiTugas.toLowerCase().includes(q)) ||
        (t.pic && t.pic.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Task ID, Deskripsi, PIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="ALL">Semua Domain</option>
            <option value="ADM">ADM - Administrative</option>
            <option value="OPS">OPS - Operational</option>
            <option value="CRD">CRD - Credit</option>
            <option value="COL">COL - Collection</option>
            <option value="FND">FND - Funding</option>
            <option value="MKT">MKT - Marketing</option>
            <option value="HCM">HCM - Human Capital</option>
            <option value="CRK">CRK - Compliance & Risk</option>
            <option value="ITD">ITD - IT & Digital</option>
            <option value="EXE">EXE - Executive</option>
            <option value="LGL">LGL - Legal</option>
            <option value="KIM">KIM - Knowledge</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3">Task ID (BEIS)</th>
                <th className="px-6 py-3">Deskripsi Dokumen</th>
                <th className="px-6 py-3">Domain</th>
                <th className="px-6 py-3">PIC</th>
                <th className="px-6 py-3">Keputusan</th>
                <th className="px-6 py-3">Evidence</th>
                <th className="px-6 py-3">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                      {t.taskId || '-'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-xs block" title={t.deskripsiTugas}>{t.deskripsiTugas}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                        {t.beisDomain || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3">{t.pic}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getBeisBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-1">
                        {t.evidenceFiles && t.evidenceFiles.length > 0 ? (
                          t.evidenceFiles.map((file, idx) => (
                            <button 
                              key={idx}
                              onClick={() => setPreviewFile(file)}
                              className="flex items-center gap-1.5 text-[11px] text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 px-2 py-1 rounded truncate max-w-[150px]"
                              title={`Preview ${file.name}`}
                            >
                              {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 shrink-0" /> : <FileText className="w-3 h-3 shrink-0" />}
                              <span className="truncate">{file.name}</span>
                            </button>
                          ))
                        ) : t.evidenceLink ? (
                          <a 
                            href={t.evidenceLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline break-all"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {t.evidenceLink}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">{t.tanggalFU || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada dokumen/task ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
          Menampilkan {filteredTasks.length} dari {tasks.length} total dokumen.
        </div>
      </div>
      
      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
