import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  FileText,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    customers,
    creditApplications,
    loanFacilities,
    fundingOpportunities,
    ewsAlerts,
    flowTasks,
    openCustomer360,
    setActiveModule,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const cleanQ = query.trim().toLowerCase();

  const matchedCustomers = cleanQ
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQ) ||
          c.cif.toLowerCase().includes(cleanQ) ||
          c.nik.includes(cleanQ) ||
          c.phone.includes(cleanQ)
      )
    : [];

  const matchedCreditApps = cleanQ
    ? creditApplications.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(cleanQ) ||
          a.customerName.toLowerCase().includes(cleanQ) ||
          a.cif.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchedFacilities = cleanQ
    ? loanFacilities.filter(
        (f) =>
          f.facilityNumber.toLowerCase().includes(cleanQ) ||
          f.accountNumber.toLowerCase().includes(cleanQ) ||
          f.customerName.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchedFundings = cleanQ
    ? fundingOpportunities.filter(
        (f) =>
          f.customerName.toLowerCase().includes(cleanQ) ||
          f.cif.toLowerCase().includes(cleanQ) ||
          f.productType.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchedEws = cleanQ
    ? ewsAlerts.filter(
        (e) =>
          e.title.toLowerCase().includes(cleanQ) ||
          e.alertCode.toLowerCase().includes(cleanQ) ||
          e.entityReference.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchedTasks = cleanQ
    ? flowTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQ) ||
          t.entityReference.toLowerCase().includes(cleanQ) ||
          t.ownerName.toLowerCase().includes(cleanQ)
      )
    : [];

  const totalResults =
    matchedCustomers.length +
    matchedCreditApps.length +
    matchedFacilities.length +
    matchedFundings.length +
    matchedEws.length +
    matchedTasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-4 pt-16 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama nasabah, nomor CIF, NIK, No LOS, No Rekening, EWS, Tugas..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline px-2 py-0.5 text-[10px] font-mono bg-white text-slate-500 border border-slate-200 rounded-md shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/40">
          {!cleanQ ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-3">
              <Sparkles className="w-8 h-8 text-blue-600 mx-auto opacity-70" />
              <p className="font-medium text-slate-700">Pencarian Terpadu BPR ARA Ecosystem (Data Master Tunggal)</p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                {['Budi Santoso', 'CIF-00892', 'LOS-ARA-2026', 'Deposito', 'EWS-SLIK'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setQuery(chip)}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-[11px] border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-xs"
                  >
                    🔍 {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Tidak ditemukan hasil untuk kata kunci <span className="text-slate-900 font-semibold">"{query}"</span>.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Customers Result */}
              {matchedCustomers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Nasabah (CRM & 360°) ({matchedCustomers.length})
                  </div>
                  <div className="space-y-1">
                    {matchedCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          openCustomer360(c.id);
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center border border-blue-200">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {c.name}
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                                {c.cif}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              NIK: {c.nik} • {c.businessType || c.occupation} • AO: {c.accountOfficerName}
                            </div>
                          </div>
                        </div>
                        <span className="text-blue-600 font-semibold text-[11px] flex items-center gap-1">
                          Buka 360° <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credit Applications Result */}
              {matchedCreditApps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> Pengajuan Kredit (LOS) ({matchedCreditApps.length})
                  </div>
                  <div className="space-y-1">
                    {matchedCreditApps.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          setActiveModule('LOS_CREDIT');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {a.applicationNumber} - {a.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Plafon: Rp {a.requestedPlafon.toLocaleString('id-ID')} • Tahap: {a.currentStage}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium">
                          LOS Stage: {a.currentStage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loan Facilities Result */}
              {matchedFacilities.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-600" /> Fasilitas Pinjaman ({matchedFacilities.length})
                  </div>
                  <div className="space-y-1">
                    {matchedFacilities.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setActiveModule('DISBURSEMENT_PORTFOLIO');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{f.customerName} ({f.facilityNumber})</div>
                          <div className="text-[11px] text-slate-500">
                            Baki Debet: Rp {f.outstandingPrincipal.toLocaleString('id-ID')} • Kol: {f.collectibility} (DPD {f.dpdDays})
                          </div>
                        </div>
                        <span className="text-cyan-700 text-[11px] font-semibold">Portofolio</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EWS Result */}
              {matchedEws.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Early Warning System ({matchedEws.length})
                  </div>
                  <div className="space-y-1">
                    {matchedEws.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setActiveModule('EWS_RISK');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100/70 border border-red-200 flex items-center justify-between text-xs cursor-pointer transition-colors shadow-xs"
                      >
                        <div>
                          <div className="font-semibold text-red-800">{e.title}</div>
                          <div className="text-[11px] text-slate-600">{e.description}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                          {e.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500">
          <span>Tekan ESC untuk menutup</span>
          <button
            onClick={() => setIsGlobalSearchOpen(false)}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
