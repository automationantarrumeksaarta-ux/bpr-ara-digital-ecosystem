import React, { useState, useEffect } from 'react';
import { TaskItem, User, BEISTaskItemStatus as TaskStatus, EvidenceFile } from '../../types';
import { CheckCircle2, XCircle, ShieldCheck, Search, Filter, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import { getAllUsersList } from '../../utils/beisUtils';
import { FilePreviewModal } from '../common/FilePreviewModal';

interface DecisionQueueProps {
  tasks: TaskItem[];
  currentUser: User;
  onUpdateTask: (task: TaskItem) => void;
}

export const DecisionQueue: React.FC<DecisionQueueProps> = ({ tasks, currentUser, onUpdateTask }) => {
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [arahanInputs, setArahanInputs] = useState<Record<string, string>>({});
  const [arahanUtamaInputs, setArahanUtamaInputs] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
  
  const allUsers = getAllUsersList();
  
  // Track inputs for arahan per task without overriding on every rerender
  useEffect(() => {
    const newInputs = { ...arahanInputs };
    const newUtamaInputs = { ...arahanUtamaInputs };
    tasks.forEach(t => {
      if (t.arahanAtasan && newInputs[t.id] === undefined) {
        newInputs[t.id] = t.arahanAtasan;
      }
      if (t.arahanAtasanUtama && newUtamaInputs[t.id] === undefined) {
        newUtamaInputs[t.id] = t.arahanAtasanUtama;
      }
    });
    // Only update if there are new ones to avoid loops
    if (Object.keys(newInputs).length > Object.keys(arahanInputs).length) {
      setArahanInputs(newInputs);
    }
    if (Object.keys(newUtamaInputs).length > Object.keys(arahanUtamaInputs).length) {
      setArahanUtamaInputs(newUtamaInputs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Include Validated Closed & Improved so they can be shown greyed out
  // Also include Blocked for escalation
  // Show all tasks in the queue (including Planned and In Progress) so directions (WOPS) can be given
  const queueTasks = tasks;

  const isDescendantApprover = (userId: string | undefined, approverId: string): boolean => {
    let currentId = userId;
    let visited = new Set<string>();
    while (currentId) {
      if (visited.has(currentId)) return false;
      visited.add(currentId);
      
      const user = allUsers.find(u => u.id === currentId);
      if (!user || !user.approverId) return false;
      
      if (user.approverId === approverId) return true;
      currentId = user.approverId;
    }
    return false;
  };

  const filteredTasks = queueTasks.filter(t => {
    // Determine if this task belongs to currentUser's queue based on Approver Matrix
    const assignedTo = t.assignedTo?.toLowerCase() || '';
    const picUser = allUsers.find(u => 
      (u.assignedMemberTab && u.assignedMemberTab.toLowerCase() === assignedTo) || 
      (u.name && u.name.toLowerCase() === assignedTo) ||
      (u.name && u.name.toLowerCase().includes(assignedTo))
    );
    
    // Is currentUser the direct or indirect approver of the PIC?
    const isUnderApprover = picUser ? isDescendantApprover(picUser.id, currentUser.id) : false;
    // Is the task escalated to the currentUser?
    const isEscalatedToMe = t.escalatedTo === currentUser.id;
    // Fallback: If currentUser is Super Admin, they can see everything (optional safety net)
    const isSuperAdmin = currentUser.role === 'Super Admin';
    
    // Check if the current user is specifically named as the validator for this task
    let isNamedValidator = false;
    if (t.validator && currentUser.name) {
      isNamedValidator = t.validator.split(',').some((v: string) => v.trim().toLowerCase() === currentUser.name!.trim().toLowerCase());
    }
    
    // If we only strictly follow the matrix, Super Admin might see nothing if they aren't assigned as approver.
    // Let's stick strictly to the matrix unless it's super admin for safety.
    const isMyTask = isUnderApprover || isEscalatedToMe || isSuperAdmin || isNamedValidator;
    
    if (!isMyTask) return false;

    // Khusus untuk tier TOP, hanya tampilkan yang sudah divalidasi approvernya
    // KECUALI jika secara eksplisit ditunjuk sebagai validator untuk task tersebut
    if (currentUser.roleTier === 'TOP' && !isNamedValidator) {
      if (t.status !== 'Validated Closed' && t.status !== 'Improved') {
        return false;
      }
    }
    
    if (filterUnit !== 'ALL' && t.unit !== filterUnit) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.deskripsiTugas.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q) || t.taskId.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter(i => i !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleBulkAction = (newStatus: TaskStatus) => {
    const today = new Date().toISOString().split('T')[0];
    tasks.forEach(t => {
      if (selectedTaskIds.includes(t.id)) {
        let escalatedTo = t.escalatedTo;
        if (newStatus === 'Blocked') {
          escalatedTo = currentUser.approverId; // Escalate to my approver
        } else if (newStatus === 'Minor Rework' || newStatus === 'Major Rework') {
          // If returned, clear escalation
          escalatedTo = undefined;
        }

        onUpdateTask({
          ...t,
          status: newStatus,
          closedDate: (newStatus === 'Validated Closed' || newStatus === 'Improved') ? today : undefined,
          updatedAt: new Date().toISOString(),
          arahanAtasan: arahanInputs[t.id] !== undefined ? arahanInputs[t.id] : (t.arahanAtasan || ''),
          arahanAtasanUtama: arahanUtamaInputs[t.id] !== undefined ? arahanUtamaInputs[t.id] : (t.arahanAtasanUtama || ''),
          escalatedTo
        });
      }
    });
    setSelectedTaskIds([]);
  };

  const handleSingleAction = (task: TaskItem, newStatus: TaskStatus) => {
    const today = new Date().toISOString().split('T')[0];
    
    let escalatedTo = task.escalatedTo;
    if (newStatus === 'Blocked') {
      escalatedTo = currentUser.approverId; // Escalate to my approver
    } else if (newStatus === 'Minor Rework' || newStatus === 'Major Rework') {
      // If returned, clear escalation
      escalatedTo = undefined;
    }

    onUpdateTask({
      ...task,
      status: newStatus,
      closedDate: (newStatus === 'Validated Closed' || newStatus === 'Improved') ? today : undefined,
      updatedAt: new Date().toISOString(),
      arahanAtasan: arahanInputs[task.id] !== undefined ? arahanInputs[task.id] : (task.arahanAtasan || ''),
      arahanAtasanUtama: arahanUtamaInputs[task.id] !== undefined ? arahanUtamaInputs[task.id] : (task.arahanAtasanUtama || ''),
      escalatedTo
    });
  };

  const isTaskApproved = (status: TaskStatus) => status === 'Validated Closed' || status === 'Improved';

  return (
    <div className="flex-1 flex flex-col h-full bg-background p-6">
      <div className="mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
          MY WORKSPACE / DECISION QUEUE
        </span>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Decision Queue (Antrean Keputusan)
          </h2>
          <p className="text-sm text-muted mt-1">
            Validasi dan persetujuan tugas berdasarkan matriks hirarki.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
            <input
              type="text"
              placeholder="Cari Task ID, PIC, Deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm w-64 text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="ALL">Semua Unit</option>
            <option value="BIS">BIS - Bisnis</option>
            <option value="OPS">OPS - Operasional</option>
            <option value="CRD">CRD - Credit</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Minor Rework">Minor Rework</option>
            <option value="Major Rework">Major Rework</option>
            <option value="Blocked">Blocked</option>
            <option value="Validated Closed">Validated Closed</option>
            <option value="Improved">Improved</option>
          </select>
        </div>
      </div>

      {selectedTaskIds.length > 0 && (
        <div className="mb-4 p-3 bg-primary-light border border-primary/20 rounded-xl flex items-center justify-between animate-in fade-in">
          <span className="text-sm font-semibold text-primary">
            {selectedTaskIds.length} Tugas Dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('Minor Rework')}
              className="px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning rounded-lg text-xs font-bold transition-colors"
            >
              Kembalikan (Minor Rework)
            </button>
            <button
              onClick={() => handleBulkAction('Validated Closed')}
              className="px-3 py-1.5 bg-success hover:bg-success/90 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Approve Semua (Validated Closed)
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-muted font-bold border-b border-border uppercase text-[10px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 w-48">PIC / Unit</th>
                <th className="px-4 py-3 max-w-sm">Deskripsi & Arahan</th>
                <th className="px-4 py-3 w-48">Evidence Link/File</th>
                <th className="px-4 py-3 text-right w-56">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted/50" />
                    <p>Antrean kosong. Tidak ada tugas yang menunggu validasi.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => {
                  const approved = isTaskApproved(t.status);
                  
                  return (
                  <tr 
                    key={t.id} 
                    className={`transition-colors ${approved ? 'opacity-40 bg-background/50' : 'hover:bg-background/80'}`}
                  >
                    <td className="px-4 py-3 text-center align-top pt-4">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(t.id)}
                        onChange={() => toggleSelectTask(t.id)}
                        className="rounded text-primary focus:ring-primary"
                        disabled={approved}
                      />
                    </td>
                    <td className="px-4 py-3 align-top pt-4">
                      <p className={`font-bold text-foreground ${approved ? 'line-through' : ''}`}>{t.assignedTo}</p>
                      <p className="text-xs text-muted uppercase">{t.unit}</p>
                    </td>
                    <td className="px-4 py-4 max-w-sm align-top">
                      <div className="flex flex-col gap-3">
                        {/* Deskripsi & Meta */}
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 ${approved ? 'line-through opacity-50' : ''}`}>{t.taskId}</span>
                            {t.status === 'Blocked' && (
                              <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Blocked
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-semibold text-gray-900 dark:text-gray-100 leading-snug ${approved ? 'line-through opacity-50' : ''}`}>
                            {t.deskripsiTugas}
                          </p>
                          {t.outputDoD && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 font-medium">
                              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                              Target: {t.outputDoD}
                            </p>
                          )}
                        </div>

                        {/* Arahan Inputs */}
                        <div className="space-y-2.5 mt-1 border-t border-gray-100 dark:border-gray-800/60 pt-3">
                          {/* Arahan Validator */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <span>Arahan / Catatan Validator</span>
                              </label>
                              <div className="flex gap-1">
                                {(['W', 'O', 'P', 'S'] as const).map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => {
                                      const labels = { W: 'W: [Tujuan]: ', O: 'O: [Hambatan]: ', P: 'P: [Rencana]: ', S: 'S: [Langkah]: ' };
                                      const currentVal = arahanInputs[t.id] ?? t.arahanAtasan ?? '';
                                      setArahanInputs({...arahanInputs, [t.id]: currentVal ? `${currentVal}\n${labels[p]}` : labels[p]});
                                    }}
                                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-emerald-100 dark:bg-gray-800 dark:hover:bg-emerald-900/40 text-gray-500 hover:text-emerald-700 dark:hover:text-emerald-300 rounded text-[9px] font-bold transition-colors"
                                    title={`Tambah ${p}`}
                                  >
                                    +{p}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <textarea
                              value={arahanInputs[t.id] ?? t.arahanAtasan ?? ''}
                              onChange={(e) => setArahanInputs({...arahanInputs, [t.id]: e.target.value})}
                              placeholder="Ketik arahan strategis, teknis, atau catatan perbaikan di sini..."
                              rows={3}
                              className="w-full text-[11px] px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 dark:focus:border-emerald-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top pt-4">
                      <div className="space-y-2">
                        {/* Evidence Files Preview */}
                        {t.evidenceFiles && t.evidenceFiles.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {t.evidenceFiles.map((file, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setPreviewFile(file)}
                                className="flex items-center gap-1.5 text-[11px] text-success hover:text-success/80 bg-success/10 px-2 py-1 rounded truncate max-w-[150px]"
                                title={`Preview ${file.name}`}
                              >
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="truncate">{file.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {/* Evidence Link */}
                        {t.evidenceLink ? (
                          <a 
                            href={t.evidenceLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 text-[11px] text-primary hover:underline break-all"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {t.evidenceLink}
                          </a>
                        ) : (
                          (!t.evidenceFiles || t.evidenceFiles.length === 0) && (
                            <span className="text-xs text-muted italic">Tidak ada evidence</span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top pt-4">
                      {approved ? (
                        <span className="text-xs font-bold text-muted uppercase px-2 py-1 bg-border rounded-lg">
                          {t.status}
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1.5">
                          <select 
                            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-surface font-medium w-40 text-foreground focus:outline-none focus:border-primary"
                            value={t.status}
                            onChange={(e) => handleSingleAction(t, e.target.value as TaskStatus)}
                          >
                            <option value="Submitted" disabled>Pilih Keputusan...</option>
                            <option value="Validated Closed">✅ Validated Closed</option>
                            <option value="Improved">⭐ Improved/Standardized</option>
                            <option value="Minor Rework">🔄 Need Improvement</option>
                            <option value="Blocked">🚫 Blocked (Eskalasi)</option>
                          </select>
                          
                          {/* Hint text when they select something that would escalate */}
                          {currentUser.approverId && (
                            <div className="text-[9px] text-muted flex items-center gap-1">
                              Eskalasi ke Tier Atas <ArrowRight className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
