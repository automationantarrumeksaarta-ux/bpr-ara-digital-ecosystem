import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldAlert,
  FileText,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlusCircle,
  Building,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Customer360Modal: React.FC = () => {
  const {
    selectedCustomerFor360,
    closeCustomer360,
    loanFacilities,
    fundingOpportunities,
    creditApplications,
    collectionCases,
    ptpRecords,
    createFlowTask,
    setActiveModule,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINANCIALS' | 'CREDIT' | 'COLLECTION' | 'DOCS' | 'TIMELINE'>('OVERVIEW');

  if (!selectedCustomerFor360) return null;

  const customer = selectedCustomerFor360;

  // Connected records
  const custFacilities = loanFacilities.filter((f) => f.cif === customer.cif);
  const custFundings = fundingOpportunities.filter((f) => f.cif === customer.cif);
  const custApplications = creditApplications.filter((a) => a.cif === customer.cif);
  const custCases = collectionCases.filter((c) => c.cif === customer.cif);
  const custPtps = ptpRecords.filter((p) => p.cif === customer.cif);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-mono border border-blue-200">
                  {customer.cif}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
                  {customer.segment.replace('_', ' ')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    customer.currentCollectibility === 'KOL_1'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : customer.currentCollectibility === 'KOL_2'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {customer.currentCollectibility === 'KOL_1'
                    ? 'KOL-1 (Lancar)'
                    : customer.currentCollectibility === 'KOL_2'
                    ? 'KOL-2 (DPK)'
                    : 'KOL-3+ (NPL)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>NIK: {customer.nik}</span>
                <span>•</span>
                <span>AO: {customer.accountOfficerName}</span>
                <span>•</span>
                <span>{customer.branchId === 'KC_PUSAT' ? 'KC Pusat' : customer.branchId === 'KC_MATESIH' ? 'Cabang Matesih' : customer.branchId === 'KC_JUMAPOLO' ? 'Cabang Jumapolo' : 'Cabang Klodran'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                createFlowTask({
                  title: `Follow-up Nasabah ${customer.name} (${customer.cif})`,
                  description: `Hubungi nasabah untuk konfirmasi layanan dan penawaran produk BPR ARA.`,
                  module: 'CRM',
                  entityType: 'CUSTOMER',
                  entityId: customer.id,
                  entityReference: `${customer.cif} - ${customer.name}`,
                  priority: 'MEDIUM',
                });
                alert(`Tugas baru berhasil dibuat untuk follow up nasabah ${customer.name}`);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Buat Tugas
            </button>
            <button
              onClick={closeCustomer360}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: '1. Profil & Identitas' },
            { id: 'FINANCIALS', label: '2. Hubungan Finansial' },
            { id: 'CREDIT', label: '3. Fasilitas & Agunan' },
            { id: 'COLLECTION', label: '4. Riwayat Angsuran & PTP' },
            { id: 'DOCS', label: '5. Dokumen Legal' },
            { id: 'TIMELINE', label: '6. Kronologi Interaksi 360' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-50/50">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Profile Card */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" /> Data Pribadi & Kontak
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Nama Lengkap</span>
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Nama Ibu Kandung</span>
                      <p className="font-semibold text-slate-900">{customer.motherMaidenName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Nomor Telepon / WhatsApp</span>
                      <p className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Email</span>
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-600" /> {customer.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Tanggal Lahir & Status</span>
                      <p className="text-slate-800">
                        {customer.dateOfBirth} ({customer.maritalStatus})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">NPWP</span>
                      <p className="text-slate-800 font-mono">{customer.npwp || 'Belum Terdaftar'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" /> Alamat Domisili KTP
                    </span>
                    <p className="text-xs text-slate-800 mt-0.5">
                      {customer.address}, RT/RW {customer.rtRw}, Kel. {customer.kelurahan}, Kec. {customer.kecamatan},{' '}
                      {customer.city}
                    </p>
                  </div>
                </div>

                {/* Business Info */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-600" /> Profil Usaha & Pekerjaan
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Nama Usaha</span>
                      <p className="font-semibold text-slate-900">{customer.businessName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Bidang Usaha</span>
                      <p className="font-semibold text-slate-900">{customer.businessType || customer.occupation}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Lama Usaha</span>
                      <p className="font-semibold text-slate-800">{customer.businessYears || 0} Tahun</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Pendapatan / Omzet Bulanan</span>
                      <p className="font-bold text-emerald-700">
                        Rp {customer.monthlyIncome.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Risk & Related Parties */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ringkasan Risiko</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500">Risk Rating</span>
                      <span className="font-bold text-emerald-700">RENDAH (Clean SLIK)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500">Indikator Fraud</span>
                      <span className="font-semibold text-emerald-700">Tidak Terdeteksi</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pihak Terkait & Kontak Darurat</h3>
                  <div className="space-y-2 text-xs">
                    {customer.relatedParties.map((rp, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800">{rp.name}</div>
                        <div className="text-[11px] text-slate-500">{rp.relation} • {rp.phone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIALS */}
          {activeTab === 'FINANCIALS' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4" /> Total Simpanan & Deposito (Funding)
                    </span>
                    <span className="text-xs text-slate-500">{custFundings.length} Rekening Aktif</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    Rp {customer.totalFundingBalance.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> Total Baki Debet Pinjaman (Credit)
                    </span>
                    <span className="text-xs text-slate-500">{custFacilities.length} Fasilitas</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    Rp {customer.totalCreditOutstanding.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Funding List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Rekening Simpanan / Deposito</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Produk</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Nominal Terhimpun</th>
                        <th className="p-3">Suku Bunga</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {custFundings.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold">{f.productType}</td>
                          <td className="p-3 text-slate-600">{f.productCategory}</td>
                          <td className="p-3 font-bold text-emerald-700">
                            Rp {f.realizedAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">{f.interestRate}% p.a.</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                              {f.stage}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDIT & COLLATERAL */}
          {activeTab === 'CREDIT' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fasilitas Kredit Aktif</h4>
              <div className="grid grid-cols-1 gap-3">
                {custFacilities.map((fac) => (
                  <div key={fac.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500">No. Fasilitas: {fac.facilityNumber}</span>
                        <h5 className="font-bold text-slate-900 text-sm">{fac.productType}</h5>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        {fac.collectibility} (DPD: {fac.dpdDays} Hari)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[11px]">Plafon Awal</span>
                        <p className="font-semibold text-slate-900">Rp {fac.originalPlafon.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Baki Debet Saat Ini</span>
                        <p className="font-bold text-blue-700">
                          Rp {fac.outstandingPrincipal.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Angsuran Bulanan</span>
                        <p className="font-semibold text-slate-800">Rp {fac.monthlyInstallment.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Jatuh Tempo Berikutnya</span>
                        <p className="font-semibold text-slate-800">{fac.nextDueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COLLECTION & PTP */}
          {activeTab === 'COLLECTION' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Catatan Janji Bayar (Promise to Pay) & Penagihan
              </h4>
              {custPtps.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                  Tidak ada catatan tunggakan atau PTP. Nasabah berstatus lancar.
                </div>
              ) : (
                <div className="space-y-3">
                  {custPtps.map((ptp) => (
                    <div
                      key={ptp.id}
                      className={`p-4 rounded-xl border text-xs space-y-2 bg-white ${
                        ptp.status === 'BROKEN'
                          ? 'border-red-300 bg-red-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Janji Bayar: Rp {ptp.promisedAmount.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ptp.status === 'BROKEN'
                              ? 'bg-red-600 text-white'
                              : ptp.status === 'PAID'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-slate-900'
                          }`}
                        >
                          {ptp.status}
                        </span>
                      </div>
                      <p className="text-slate-700">{ptp.notes}</p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Tgl Janji: {ptp.promiseDate}</span>
                        <span>•</span>
                        <span>Kolektor: {ptp.collectorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCS */}
          {activeTab === 'DOCS' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Berkas Legal & Dokumen Tersimpan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customer.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-900">{doc.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {doc.type} • Diunggah: {doc.uploadDate}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kronologi Interaksi & Transaksi 360°
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {customer.timeline.map((evt) => (
                  <div key={evt.id} className="relative text-xs">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] text-white shadow-xs">
                      •
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-600">{evt.module}</span>
                        <span>{evt.timestamp}</span>
                      </div>
                      <h5 className="font-bold text-slate-900">{evt.action}</h5>
                      <p className="text-slate-700 text-[11px]">{evt.details}</p>
                      <div className="text-[10px] text-slate-500 mt-1">Oleh: {evt.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>CIF ID Master: {customer.cif} • Sumber Data Tunggal BPR ARA</span>
          <button
            onClick={closeCustomer360}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
