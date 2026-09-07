const fs = require('fs');
const path = require('path');

const filePath = '/Users/ahmadwahyuaji/Downloads/bpr-ara-digital-ecosystem/src/components/modules/LosCreditView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add interestRate to formData state
content = content.replace(
  /termMonths: '12', interestType: 'Flat', creditType: 'Umum',/,
  "termMonths: '12', interestRate: '', interestType: 'Flat', creditType: 'Umum',"
);

// 2. Remove Otomatisasi Input Data banner
// Using regex to remove from {/* FEATURE BANNER: OTOMATISASI */} to {autoFillNotification && ...}
content = content.replace(
  /\{\/\* FEATURE BANNER: OTOMATISASI \*\/\}[\s\S]*?(?=\{\/\* Section A \*\/\})/g,
  ''
);

// 3. Replace Section A, B, and C with the new floating labels and updated layouts
const newFormContent = `                  {/* Section A */}
                  <div>
                    <h4 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-wider mb-3 border-b border-border dark:border-white/10 pb-2 flex items-center gap-1.5"><User size={14} className="text-foreground dark:text-white" />A. Identitas Nasabah</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><User size={14} /></div>
                        <input type="text" id="floating_name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 pl-9 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_name" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nama Pemohon (Sesuai KTP)</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_ktp" maxLength={16} value={formData.ktp} onChange={(e) => setFormData({...formData, ktp: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-mono font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_ktp" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nomor KTP (NIK 16 Digit)</label>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><Phone size={14} /></div>
                        <input type="tel" id="floating_wa" required value={formData.wa} onChange={(e) => setFormData({...formData, wa: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 pl-9 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_wa" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Nomor HP / WhatsApp</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_address" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_address" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Alamat Tinggal</label>
                      </div>
                    </div>
                  </div>

                  {/* Section B */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-wider mb-3 border-b border-border dark:border-white/10 pb-2 flex items-center gap-1.5"><DollarSign size={14} className="text-foreground dark:text-white" />B. Detail Fasilitas Kredit</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted peer-focus:text-primary transition-colors z-20"><span className="text-[10px] font-bold">Rp</span></div>
                        <input type="number" id="floating_amount" required min="1000000" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 pl-9 outline-none text-xs font-black focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_amount" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Plafon Pinjaman</label>
                      </div>
                      <div className="relative group">
                        <input type="number" id="floating_term" min="1" max="120" value={formData.termMonths} onChange={(e) => setFormData({...formData, termMonths: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_term" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Jangka Waktu (Bulan)</label>
                      </div>
                      <div className="relative group">
                        <input type="number" id="floating_interest" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_interest" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Suku Bunga (%)</label>
                      </div>
                      <div className="relative group">
                        <input type="text" id="floating_business" required value={formData.businessType} onChange={(e) => setFormData({...formData, businessType: e.target.value})} className="block w-full bg-background dark:bg-[#111111] border border-border rounded-xl px-3 pb-2 pt-6 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary peer appearance-none transition-all" placeholder=" " />
                        <label htmlFor="floating_business" className="absolute text-[11px] font-bold text-muted duration-300 transform -translate-y-2.5 scale-75 top-3 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-3 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-primary pointer-events-none">Jenis Usaha / Pekerjaan</label>
                      </div>
                      <div className="relative col-span-1 sm:col-span-2 mt-1">
                        <label className="block text-[10px] font-bold text-muted mb-1 ml-1">Tujuan Penggunaan</label>
                        <select value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="w-full bg-background dark:bg-[#111111] border border-border rounded-xl p-2.5 outline-none text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                          <option value="Modal Kerja">Modal Kerja Usaha</option>
                          <option value="Investasi">Investasi Usaha</option>
                          <option value="Konsumtif">Konsumtif / Renovasi</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Lampiran */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-wider mb-3 border-b border-border dark:border-white/10 pb-2 flex items-center gap-1.5"><FileText size={14} className="text-foreground dark:text-white" />C. Lampiran Kelengkapan (HVS Sequential)</h4>
                    <div className="space-y-2">
                      <div className="bg-background dark:bg-[#111111] p-3 rounded-2xl border border-border space-y-2">
                        <span className="text-[10px] font-black uppercase bg-slate-200 dark:bg-white/10 text-foreground dark:text-white px-2 py-0.5 rounded">Halaman 2-4: Syarat Utama Debitur</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderUploadRow('ktp', 'KTP Pemohon & Pasangan')}
                          {renderUploadRow('kk', 'Kartu Keluarga (KK)')}
                          {renderUploadRow('suratNikah', 'Surat Nikah/Cerai')}
                          {renderUploadRow('mutasi', 'Mutasi / Rekening Koran')}
                        </div>
                      </div>
                      <div className="bg-background dark:bg-[#111111] p-3 rounded-2xl border border-border space-y-2">
                        <span className="text-[10px] font-black uppercase bg-slate-200 dark:bg-white/10 text-foreground dark:text-white px-2 py-0.5 rounded">Halaman 5: Syarat Agunan</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderUploadRow('shm', 'Sertifikat SHM/SHGB')}
                          {renderUploadRow('bpkb', 'BPKB & STNK')}
                          {renderUploadRow('esekEsek', 'Esek-esek Kendaraan')}
                          {renderUploadRow('ktpPenjamin', 'KTP Penjamin')}
                        </div>
                      </div>
                    </div>
                  </div>`;

// Replace Section A up to the end of Section C
content = content.replace(
  /\{\/\* Section A \*\/\}[\s\S]*?(?=\{\/\* END FORM OR BUTTONS \*\/\}|\<div className="p-4 border-t)/,
  newFormContent + '\n\n                <' + 'div className="p-4 border-t'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update applied');
