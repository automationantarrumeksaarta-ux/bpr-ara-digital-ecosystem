import React, { useState, useEffect } from 'react';
import { TaskItem, User, BEISTaskItemStatus as TaskStatus, EvidenceFile } from '../../types';
import { CheckCircle2, XCircle, ShieldCheck, Search, Filter, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import { getAllUsersList } from '../../utils/beisUtils';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { PageContainer } from '../ui/PageContainer';
import { DeretAngka } from '../credit/StageShell';
import { Panel } from '../credit/StageParts';

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
  const [editingArahanId, setEditingArahanId] = useState<string | null>(null);
  
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
    
    // Aturan baru: Approval Queue HANYA untuk yang secara eksplisit ditunjuk sebagai Validator.
    const isMyTask = isNamedValidator || isEscalatedToMe;
    
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

  // Ringkasan antrean. Dihitung dari daftar yang SAMA dengan yang ditampilkan,
  // jadi angkanya tidak pernah bercerita lain daripada isi tabelnya.
  const menunggu = filteredTasks.filter(t => !isTaskApproved(t.status)).length;
  const disetujui = filteredTasks.filter(t => isTaskApproved(t.status)).length;
  const dikembalikan = filteredTasks.filter(
    t => t.status === 'Minor Rework' || t.status === 'Major Rework').length;
  const terhambat = filteredTasks.filter(t => t.status === 'Blocked').length;

  const kelasIsian =
    'rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground ' +
    'outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <PageContainer className="p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Antrean Persetujuan</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Tugas yang menunggu keputusan Anda sebagai validator, beserta bukti penyelesaiannya.
          </p>
        </div>
      </header>

      <DeretAngka
        angka={[
          {
            label: 'Menunggu keputusan',
            nilai: menunggu.toLocaleString('id-ID'),
            konteks: menunggu > 0 ? 'Perlu ditindaklanjuti' : 'Tidak ada yang tertahan',
            nada: menunggu > 0 ? 'warning' : 'default',
          },
          { label: 'Sudah disetujui', nilai: disetujui.toLocaleString('id-ID'), konteks: 'Dalam tampilan ini', nada: disetujui > 0 ? 'success' : 'default' },
          { label: 'Dikembalikan', nilai: dikembalikan.toLocaleString('id-ID'), konteks: 'Minta perbaikan' },
          { label: 'Terhambat', nilai: terhambat.toLocaleString('id-ID'), konteks: terhambat > 0 ? 'Dieskalasikan' : 'Tidak ada', nada: terhambat > 0 ? 'danger' : 'default' },
        ]}
      />

      {/*
        Bilah tindakan massal muncul hanya saat ada yang dipilih, dan tetap
        menempel di atas daftar supaya tidak perlu menggulir kembali ke atas
        setelah memilih beberapa baris.
      */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky top-2 z-20 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-light px-4 py-3 shadow-sm">
          <span className="text-xs font-bold tabular-nums text-primary-dark">
            {selectedTaskIds.length} tugas dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('Minor Rework')}
              className="rounded-xl bg-warning/15 px-3 py-2 text-xs font-bold text-warning transition-colors hover:bg-warning/25"
            >
              Kembalikan untuk diperbaiki
            </button>
            <button
              onClick={() => handleBulkAction('Validated Closed')}
              className="rounded-xl bg-success px-3 py-2 text-xs font-bold text-white transition-colors hover:opacity-90"
            >
              Setujui semua
            </button>
          </div>
        </div>
      )}

      <Panel
        judul="Daftar tugas"
        hitungan={filteredTasks.length}
        padat
        alat={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Cari nomor tugas, PIC, atau deskripsi"
                aria-label="Cari tugas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${kelasIsian} w-60 pl-9`}
              />
            </div>
            <select
              value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}
              aria-label="Saring unit" className={`${kelasIsian} cursor-pointer`}
            >
              <option value="ALL">Semua unit</option>
              <option value="BIS">BIS · Bisnis</option>
              <option value="OPS">OPS · Operasional</option>
              <option value="CRD">CRD · Kredit</option>
            </select>
            <select
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Saring status" className={`${kelasIsian} cursor-pointer`}
            >
              <option value="ALL">Semua status</option>
              <option value="Planned">Direncanakan</option>
              <option value="In Progress">Dikerjakan</option>
              <option value="Submitted">Diajukan</option>
              <option value="Minor Rework">Perlu perbaikan</option>
              <option value="Major Rework">Perlu perbaikan besar</option>
              <option value="Blocked">Terhambat</option>
              <option value="Validated Closed">Disetujui</option>
              <option value="Improved">Disetujui & distandarkan</option>
            </select>
          </>
        }
      >
        <div className="overflow-x-auto">
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
                <th className="px-4 py-3 w-32 whitespace-nowrap">Tanggal Dibuat</th>
                <th className="px-4 py-3 max-w-sm">Deskripsi & Arahan</th>
                <th className="px-4 py-3 w-48">Evidence Link/File</th>
                <th className="px-4 py-3 text-right w-56">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted">
                      <ShieldCheck className="h-5 w-5 text-muted" strokeWidth={1.75} />
                    </span>
                    <p className="text-sm font-bold text-foreground">Tidak ada yang menunggu keputusan</p>
                    <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
                      Tugas muncul di sini setelah pelaksananya mengajukan penyelesaian dan Anda
                      ditunjuk sebagai validatornya.
                    </p>
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
                    <td className="px-4 py-3 align-top pt-4 text-xs text-muted whitespace-nowrap">
                      {new Date((t.createdAt || '').replace(' ', 'T')).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
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
                                {editingArahanId === t.id ? (
                                  (['W', 'O', 'P', 'S'] as const).map(p => (
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
                                  ))
                                ) : (
                                  <button
                                    onClick={() => setEditingArahanId(t.id)}
                                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[9px] font-bold transition-colors"
                                  >
                                    Edit Arahan
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {editingArahanId === t.id ? (
                              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <textarea
                                  value={arahanInputs[t.id] ?? t.arahanAtasan ?? ''}
                                  onChange={(e) => setArahanInputs({...arahanInputs, [t.id]: e.target.value})}
                                  placeholder="Ketik arahan strategis, teknis, atau catatan perbaikan di sini..."
                                  rows={3}
                                  className="w-full text-[11px] px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 dark:focus:border-emerald-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none transition-all"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      // Cancel edit, reset value
                                      setArahanInputs({...arahanInputs, [t.id]: t.arahanAtasan || ''});
                                      setEditingArahanId(null);
                                    }}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg transition-colors"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateTask({
                                        ...t,
                                        arahanAtasan: arahanInputs[t.id] !== undefined ? arahanInputs[t.id] : (t.arahanAtasan || ''),
                                        updatedAt: new Date().toISOString()
                                      });
                                      setEditingArahanId(null);
                                      alert("Arahan berhasil disimpan!");
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                                  >
                                    Simpan
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="w-full text-[11px] px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50 rounded-xl text-gray-800 dark:text-gray-300 min-h-[40px] whitespace-pre-wrap cursor-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setEditingArahanId(t.id)}
                              >
                                {t.arahanAtasan ? t.arahanAtasan : <span className="text-gray-400 italic">Belum ada arahan... Klik untuk Edit</span>}
                              </div>
                            )}
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
      </Panel>

      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </PageContainer>
  );
};
