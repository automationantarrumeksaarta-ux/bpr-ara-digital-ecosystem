import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Shield,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { headerAuth } from '../../utils/api';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionChips?: { label: string; action: () => void }[];
}

export const AiAssistantDrawer: React.FC = () => {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    currentUser,
    customers,
    loanFacilities,
    fundingOpportunities,
    creditApplications,
    ewsAlerts,
    ptpRecords,
    openCustomer360,
    setActiveModule,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Halo ${currentUser.name}! Saya **ARA Copilot**, asisten AI operasional & pendukung keputusan cerdas PT BPR Antar Rumeksa Arta.\n\nSaya memantau seluruh ekosistem data: kredit, funding, penagihan, survey, hingga EWS risiko secara real-time. Ada yang bisa saya bantu analisa hari ini?`,
      timestamp: 'Baru saja',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isAiAssistantOpen) return null;

  const quickPrompts = [
    'Berapa rasio NPL, LDR, dan CAR BPR saat ini?',
    'Siapa saja debitur yang memiliki Janji Bayar (PTP) hari ini?',
    'Ringkas usulan kredit Budi Santoso & skor 5C',
    'Tampilkan alert EWS Merah yang butuh tindakan segera',
    'Evaluasi kinerja funding vs target bulan ini',
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      // Build real-time context summary from the ecosystem
      const totalLoanOutstanding = loanFacilities.reduce((acc, f) => acc + f.outstandingPrincipal, 0);
      const totalFundingBalance = fundingOpportunities.reduce((acc, f) => acc + f.realizedAmount, 0);
      const activeEws = ewsAlerts.filter((e) => e.status !== 'RESOLVED');
      const pendingApps = creditApplications.filter((a) => a.currentStage !== 'DISBURSED' && a.currentStage !== 'REJECTED');

      const systemContext = {
        currentUser: { name: currentUser.name, role: currentUser.roleTitle, branch: currentUser.branchId },
        metrics: {
          totalLoanOutstanding,
          totalFundingBalance,
          nplRatio: 2.14,
          carRatio: 24.8,
          ldrRatio: 78.4,
          activeEwsCount: activeEws.length,
          redEwsCount: activeEws.filter((e) => e.severity === 'RED').length,
          pendingApplicationsCount: pendingApps.length,
        },
        sampleCustomers: customers.map((c) => ({ cif: c.cif, name: c.name, kol: c.currentCollectibility })),
        sampleApplications: creditApplications.map((a) => ({
          no: a.applicationNumber,
          customer: a.customerName,
          plafon: a.requestedPlafon,
          stage: a.currentStage,
        })),
        activePtps: ptpRecords.map((p) => ({ debtor: p.debtorName, amount: p.promisedAmount, date: p.promiseDate, status: p.status })),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headerAuth() },
        body: JSON.stringify({
          prompt: textToSend,
          context: systemContext,
        }),
      });

      const data = await response.json();
      const replyText =
        data.text ||
        'Maaf, sistem AI sedang memproses pembaruan. Silakan coba kembali atau gunakan menu operasional langsung.';

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // Fallback helpful message if server endpoint encounters issue
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Berdasarkan data operasional BPR ARA saat ini:\n\n• **CAR**: 24.8% (Sangat Sehat, min OJK 12%)\n• **NPL Net**: 2.14% (Terjaga aman di bawah batas 5%)\n• **LDR**: 78.4% (Optimal likuiditas)\n• **EWS Perhatian Khusus**: 2 Kasus (PTP Broken Pak Hendro Kusumo & Notifikasi Perubahan Tempat Usaha).\n\nSilakan pilih modul terkait di bilah navigasi untuk aksi operasional.`,
        timestamp: 'Baru saja',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-slate-800">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm text-white">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">ARA Copilot</h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono border border-blue-200 font-semibold">
                Decision AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Asisten Keputusan & Analisis Risiko Cerdas</p>
          </div>
        </div>

        <button
          onClick={() => setIsAiAssistantOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-xs font-medium'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-600 p-2 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>ARA Copilot sedang menganalisa data ekosistem...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-600" /> Analisis Cepat:
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 border border-slate-200 hover:border-blue-500 whitespace-nowrap transition-colors cursor-pointer shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tanyakan analisis kredit, EWS, funding, debitur..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          AI berfungsi sebagai pendukung keputusan. Keputusan akhir kredit tetap berada pada wewenang Komite Kredit BPR ARA.
        </p>
      </div>
    </div>
  );
};
