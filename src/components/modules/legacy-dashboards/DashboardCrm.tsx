import React, { useState } from 'react';
import { 
  Users, MessageSquare, Send, Bot, Sparkles, CheckSquare, Bell, Share2, 
  TrendingUp, PhoneCall, BookOpen, Cpu, Target, Zap, Search, Filter, 
  Plus, CheckCircle2, Clock, AlertTriangle, FileText, Calendar, DollarSign, 
  ChevronRight, UserPlus, Phone, Mail, ExternalLink, Layers, Database, 
  ArrowUpRight, HelpCircle, Smartphone, Check, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditApplication } from '../../../types/legacy';
import { PageContainer, PageHeader } from '../../ui/PageContainer';
import { MetricCard } from '../../ui/MetricCard';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { CrmFunnel } from '../../crm/CrmFunnel';


interface DashboardCrmProps {
 applications?: CreditApplication[];
}

interface LeadItem {
 id: string;
 name: string;
 phone: string;
 source: 'WhatsApp Web' | 'Instagram' | 'Website' | 'Walk-In' | 'Referral';
 interestType: 'Kredit Modal Kerja' | 'Kredit Consumtive' | 'Deposito ARA' | 'Tabungan';
 estimatedNominal: number;
 stage: 'PROSPEK_BARU' | 'TERHUBUNG' | 'FOLLOW_UP' | 'BERKAS_MASUK' | 'DEAL';
 assignedAo: string;
 leadScore: number;
 lastContactDate: string;
}

interface CrmTask {
 id: string;
 title: string;
 assignedTo: string;
 dueDate: string;
 priority: 'HIGH' | 'MEDIUM' | 'LOW';
 category: 'Follow Up Leads' | 'Penagihan Collection' | 'Blast WhatsApp' | 'Dokumen SKLOS';
 status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface KnowledgeArticle {
 id: string;
 category: 'Kredit' | 'Funding' | 'SOP CRM' | 'Otomasi SKLOS';
 title: string;
 snippet: string;
 updatedAt: string;
}

export default function DashboardCrm({ applications = [] }: DashboardCrmProps) {
 // Main CRM Active Sub-Tab
 const [activeTab, setActiveTab] = useState<
 'DASHBOARD' | 'MARKETING' | 'LEADS' | 'FOLLOW_UP' | 'COLLECTION' | 
 'REMINDER' | 'WHATSAPP' | 'AI' | 'TASK' | 'SKLOS' | 'KNOWLEDGE_BASE'
 >('DASHBOARD');

 // WhatsApp Blast Simulator State
 const [waRecipient, setWaRecipient] = useState<string>('0812-3456-7890');
 const [waMessage, setWaMessage] = useState<string>(
 'Yth. Bapak/Ibu Nasabah BPR ARA, mengingatkan jatuh tempo angsuran kredit Anda pada tanggal 05 Ags 2026. Terima kasih.'
 );
 const [waSentSuccess, setWaSentSuccess] = useState<boolean>(false);

 // AI Assistant Chat State
 const [aiPrompt, setAiPrompt] = useState<string>('');
 const [aiResponse, setAiResponse] = useState<string | null>(null);
 const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

 // Sample Leads Data
 const [leadsList, setLeadsList] = useState<LeadItem[]>([]);

 // Tasks List
 const [crmTasks, setCrmTasks] = useState<CrmTask[]>([]);

 // Knowledge Base Articles
 const kbArticles: any[] = [];

 const handleSendWa = (e: React.FormEvent) => {
 e.preventDefault();
 setWaSentSuccess(true);
 setTimeout(() => setWaSentSuccess(false), 4000);
 };

 const handleAiAsk = () => {
 if (!aiPrompt.trim()) return;
 setIsAiLoading(true);
 setAiResponse(null);

 setTimeout(() => {
 setIsAiLoading(false);
 setAiResponse(
 `[AI CRM Intelligence]: Berdasarkan data prospek"${aiPrompt}", lead ini memiliki skor kelayakan 89/100. Rekomendasi tindakan: Jadwalkan kunjungan AO dalam 24 jam dan kirim brosur Kredit Modal Kerja via WhatsApp Blast.`
 );
 }, 1200);
 };

 const formatIDR = (val: number) => 
 new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

 return (
    <PageContainer>
      <PageHeader 
        title="Pusat Integrasi & CRM BPR ARA"
        description="Ekosistem CRM terpadu: Marketing, Leads Pipeline, Follow Up, Collection CRM, Reminder Otomatis, Integration WhatsApp Blast, AI Scoring, Task Manager, SKLOS Sub-system, & Knowledge Base."
        badge="Executive CRM & Integration Hub"
        badgeVariant="info"
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
              <Zap size={15} />
              <span>SKLOS Sync Status: <strong>ONLINE 100%</strong></span>
            </div>
          </div>
        }
      />

      {/* 11 CRM MODULE NAVIGATION TABS */}
      <Card className="p-2 mb-6 mt-6 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: TrendingUp },
            { id: 'MARKETING', label: 'Marketing', icon: Share2 },
            { id: 'LEADS', label: 'Leads', icon: UserPlus },
            { id: 'FOLLOW_UP', label: 'Follow Up', icon: PhoneCall },
            { id: 'COLLECTION', label: 'Collection', icon: ShieldAlert },
            { id: 'REMINDER', label: 'Reminder', icon: Bell },
            { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
            { id: 'AI', label: 'AI Engine', icon: Bot },
            { id: 'TASK', label: 'Task', icon: CheckSquare },
            { id: 'SKLOS', label: 'SKLOS', icon: Cpu },
            { id: 'KNOWLEDGE_BASE', label: 'Knowledge Base', icon: BookOpen },
          ].map((item, index) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(item.id as any)}
                className="text-xs font-black rounded-xl whitespace-nowrap"
              >
                <IconComponent size={14} className="mr-1.5" />
                {index + 1}. {item.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* SUB-MODULE 1: DASHBOARD OVERVIEW & CONVERSION FUNNEL */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label="Total Leads Active"
              value="0 Lead"
              description="0% dari bulan lalu"
              icon={UserPlus}
            />
            <MetricCard
              label="Potensi Plafon Leads"
              value="Rp 0"
              description="Estimasi Penyaluran"
              icon={DollarSign}
              variant="success"
            />
            <MetricCard
              label="WhatsApp Blast Outbound"
              value="0 Pesan"
              description="0% Delivered Rate"
              icon={MessageSquare}
              variant="primary"
            />
            <MetricCard
              label="Rasio Konversi Lead"
              value="0%"
              description="Target CRM: 30%"
              icon={Target}
              variant="warning"
            />
          </div>

          <CrmFunnel />
        </div>
      )}

      {/* SUB-MODULE 2: MARKETING & CAMPAIGNS */}
      {activeTab === 'MARKETING' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Kampanye Marketing & Akuisisi Nasabah BPR ARA</h3>
            <Button size="sm" className="font-bold">
              <Plus size={14} className="mr-1.5" /> Buat Kampanye Baru
            </Button>
          </div>

          <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Belum ada kampanye marketing aktif
          </div>
        </Card>
      )}

      {/* SUB-MODULE 3: LEADS MANAGEMENT */}
      {activeTab === 'LEADS' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Daftar Leads & Calon Debitur Terintegrasi</h3>
            <Badge variant="secondary">{leadsList.length} Leads Terdaftar</Badge>
          </div>

          <div className="space-y-3">
            {leadsList.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Belum ada data leads terdaftar
              </div>
            )}
            {leadsList.map((lead) => (
              <Card key={lead.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{lead.name}</h4>
                    <Badge variant="outline" className="text-[10px]">Score: {lead.leadScore}/100</Badge>
                    <Badge variant="secondary" className="text-[10px]">{lead.source}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-gray-300 font-medium mt-1">
                    Minat: <strong>{lead.interestType}</strong> ({formatIDR(lead.estimatedNominal)}) • AO: <strong>{lead.assignedAo}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Badge variant="outline" className="text-xs px-3 py-1 bg-white dark:bg-slate-800">{lead.stage}</Badge>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="font-bold"
                  >
                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                      <MessageSquare size={13} className="mr-1.5" /> Chat WA
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* SUB-MODULE 4: FOLLOW UP */}
      {activeTab === 'FOLLOW_UP' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Jadwal & Log Follow Up Interaktif CRM
          </h3>
          <p className="text-xs text-slate-600 dark:text-gray-300">
            Monitoring tindak lanjut seluruh AO terhadap calon debitur dalam batas waktu SLA &lt; 24 Jam.
          </p>

          <div className="space-y-3">
            <Card className="p-3.5 bg-slate-50 dark:bg-slate-900/50 space-y-1 border-emerald-200 dark:border-emerald-900/50">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-900 dark:text-white">Toko Kelontong Berkah (Widi Miswari)</span>
                <span className="text-emerald-600 dark:text-emerald-400">Sudah Dikunjungi</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-400">Janji temu survei toko kelontong jam 14:00. Berkas SIUP dan foto usaha siap diupload.</p>
            </Card>
            <Card className="p-3.5 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-900 dark:text-white">CV Murni Jaya Transport (Ahmad Wahyu Aji)</span>
                <span className="text-blue-600 dark:text-blue-400">Follow up Telepon</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-400">Nasabah meminta penawaran suku bunga 0% p.a. flat. Dikomunikasikan ke PE Bisnis.</p>
            </Card>
          </div>
        </Card>
      )}

      {/* SUB-MODULE 5: COLLECTION CRM */}
      {activeTab === 'COLLECTION' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Collection CRM & Penagihan Terjadwal
          </h3>
          <Card className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">Debitur Keterlambatan Kol 2: Sri Wahyuni</span>
              <Badge variant="danger" className="text-[10px]">TUNGGAKAN 2 HARI</Badge>
            </div>
            <p className="text-xs">Nominal Angsuran: Rp 0(Janji Bayar hari ini jam 16:00 via Mobile Banking BPR ARA).</p>
            <Button size="sm" variant="outline" className="text-xs font-bold">
              <PhoneCall size={13} className="mr-1.5" /> Hubungi Debitur via WhatsApp / Telp
            </Button>
          </Card>
        </Card>
      )}

      {/* SUB-MODULE 6: REMINDER SYSTEM */}
      {activeTab === 'REMINDER' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Sistem Reminder Otomatis (SMS & WhatsApp Schedule)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <span className="text-xs font-black text-slate-900 dark:text-white block">🔔 Auto-Reminder Angsuran (H-3)</span>
              <p className="text-xs text-slate-600 dark:text-gray-400">Pesan pengingat otomatis dikirim ke 0 debitur setiap tanggal 25 bulan berjalan.</p>
              <Badge variant="success" className="text-[10px]">AUTOMATED ENABLED</Badge>
            </Card>
            <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <span className="text-xs font-black text-slate-900 dark:text-white block">🔔 Auto-Reminder Deposito Jatuh Tempo (H-7)</span>
              <p className="text-xs text-slate-600 dark:text-gray-400">Pengingat perpanjangan deposito otomatis ARO / Non-ARO ke nasabah penyiap dana.</p>
              <Badge variant="success" className="text-[10px]">AUTOMATED ENABLED</Badge>
            </Card>
          </div>
        </Card>
      )}

      {/* SUB-MODULE 7: WHATSAPP INTEGRATION */}
      {activeTab === 'WHATSAPP' && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">WhatsApp Blast & CRM Messaging Integration</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Kirim pesan resmi BPR ARA ke nasabah / calon debitur</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendWa} className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-200">Nomor WhatsApp Tujuan:</label>
              <Input
                type="text"
                value={waRecipient}
                onChange={(e) => setWaRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-200">Isi Pesan / Template:</label>
              <Textarea
                rows={4}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
              />
            </div>

            <Button type="submit" className="font-black w-full sm:w-auto">
              <Send size={15} className="mr-2" /> Kirim WhatsApp Blast Now
            </Button>

            {waSentSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 mt-2">
                <CheckCircle2 size={16} /> Pesan WhatsApp berhasil terkirim ke {waRecipient}!
              </motion.div>
            )}
          </form>
        </Card>
      )}

      {/* SUB-MODULE 8: AI ASSISTANT & LEAD SCORING */}
      {activeTab === 'AI' && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">AI Assistant CRM & Smart Lead Scoring Engine</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Asisten cerdas analisis kelayakan prospek & rekomendasi produk</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-200">Tanyakan / Analisis Prospek ke AI:</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="Contoh: Analisis kelayakan Toko Kelontong omset 150 Jt per bulan..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAiAsk}
                  disabled={isAiLoading}
                  className="font-black"
                >
                  <Sparkles size={15} className="mr-2" /> {isAiLoading ? 'Menganalisis...' : 'Analisis AI'}
                </Button>
              </div>
            </div>

            {aiResponse && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-black flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Bot size={15} /> Hasil Analisis AI CRM:
                </span>
                <p className="text-xs font-medium leading-relaxed">{aiResponse}</p>
              </motion.div>
            )}
          </div>
        </Card>
      )}

      {/* SUB-MODULE 9: TASK MANAGER */}
      {activeTab === 'TASK' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Task Manager & Tugas Harian CRM (Ahmad Wahyu Aji)</h3>
            <Badge variant="secondary">{crmTasks.length} Task Terdaftar</Badge>
          </div>

          <div className="space-y-3">
            {crmTasks.map((task) => (
              <Card key={task.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">{task.category}</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{task.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold">Assigned: {task.assignedTo} • Due: {task.dueDate}</p>
                </div>

                <Badge variant={
                  task.status === 'COMPLETED' ? 'success' :
                  task.status === 'IN_PROGRESS' ? 'warning' :
                  'secondary'
                } className="self-end sm:self-center text-[10px]">
                  {task.status}
                </Badge>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* SUB-MODULE 10: SKLOS SINKRONISASI */}
      {activeTab === 'SKLOS' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">SKLOS (Sistem Kredit & Layanan Otomasi Sub-system)</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Sinkronisasi status pengajuan kredit real-time dengan Core Banking BPR ARA</p>
              </div>
            </div>
            <Badge variant="success">API Connection Active</Badge>
          </div>

          <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-900 dark:text-white">Sinkronisasi Terakhir: Hari ini 10:15 WIB</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Status: 200 OK</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-400">
              Setiap aplikasi berkas kredit yang disetujui di Modul Kredit otomatis dibuatkan nomor rekening kredit baru di SKLOS Core Banking.
            </p>
          </Card>
        </Card>
      )}

      {/* SUB-MODULE 11: KNOWLEDGE BASE */}
      {activeTab === 'KNOWLEDGE_BASE' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Knowledge Base & FAQ Produk BPR ARA</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Pusat dokumentasi syarat kredit, brosur funding, dan SOP CRM</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kbArticles.map((kb) => (
              <Card key={kb.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">{kb.category}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{kb.updatedAt}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{kb.title}</h4>
                <p className="text-xs text-slate-600 dark:text-gray-400 font-medium">{kb.snippet}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </PageContainer>
  );
};
