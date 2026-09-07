/**
 * Utility functions for ARA Funding Dashboard
 */

// Format nominal as Rupiah without converting safe integers to strings in storage
export function formatRupiah(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount).replace('Rp', 'Rp');
}

// Format compact number for clean KPI display (e.g. 189,5Jt or 1,2M)
export function formatCompactRupiah(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp0';
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp${(amount / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp${(amount / 1_000_000).toFixed(2).replace('.', ',')} Jt`;
  }
  return formatRupiah(amount);
}

// Format date to Indonesian standard e.g. 11/08/2026 or 11 Agustus 2026
export function formatDateIndo(dateStr: string, format: 'short' | 'long' = 'short'): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];

    const monthsLong = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    if (format === 'long' && monthIndex >= 0 && monthIndex < 12) {
      return `${parseInt(day, 10)} ${monthsLong[monthIndex]} ${year}`;
    }
    return `${day.padStart(2, '0')}/${(monthIndex + 1).toString().padStart(2, '0')}/${year}`;
  }
  return dateStr;
}

// Safely parse user string to number removing commas, dots, or Rp prefixes
export function parseNominal(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  // Strip non-digit characters except minus
  const cleanStr = value.toString().replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Calculate percentage growth safely
export function calculateGrowthPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Helper to get today's date in YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to calculate date minus N days
export function getDateOffset(baseDate: string, daysOffset: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate formatted WhatsApp report text for executive or daily broadcast
export function generateWhatsAppReport(
  selectedDate: string,
  portfolioList: any[],
  dailyAdditions: any[],
  officeFilter: string = 'All'
): string {
  const filteredPortfolio = officeFilter === 'All'
    ? portfolioList
    : portfolioList.filter((p) => p.kantor_kas === officeFilter);

  const filteredDaily = officeFilter === 'All'
    ? dailyAdditions
    : dailyAdditions.filter((d) => d.kantor_kas === officeFilter);

  let totalVol = 0;
  let tabunganVol = 0;
  let depositoVol = 0;
  let tabunganNoa = 0;
  let depositoNoa = 0;

  filteredPortfolio.forEach((item) => {
    totalVol += item.volume;
    if (item.produk === 'Tabungan') {
      tabunganVol += item.volume;
      tabunganNoa += item.noa;
    } else {
      depositoVol += item.volume;
      depositoNoa += item.noa;
    }
  });

  let dailyVol = 0;
  let dailyNoa = 0;
  filteredDaily.forEach((d) => {
    dailyVol += d.volume_baru;
    dailyNoa += d.noa_baru;
  });

  const filterTitle = officeFilter === 'All' ? 'KONSOLIDASI BPR' : `KANTOR KAS ${officeFilter.toUpperCase()}`;

  let report = `*LAPORAN PENGHIMPUNAN DANA (FUNDING) - ARA FUNDING*\n`;
  report += `*${filterTitle}*\n`;
  report += `Tanggal Posisi: ${formatDateIndo(selectedDate, 'long')}\n`;
  report += `===============================\n\n`;

  report += `📊 *RINGKASAN PORTOFOLIO POSISI:*\n`;
  report += `• *Total Volume:* ${formatRupiah(totalVol)}\n`;
  report += `• *Total NOA:* ${tabunganNoa + depositoNoa} Rekening\n`;
  report += `  - Tabungan: ${formatRupiah(tabunganVol)} (${tabunganNoa} NOA)\n`;
  report += `  - Deposito: ${formatRupiah(depositoVol)} (${depositoNoa} NOA)\n\n`;

  report += `📈 *PENAMBAHAN HARIAN PERIODE:* \n`;
  report += `• *Nominal Baru:* +${formatRupiah(dailyVol)}\n`;
  report += `• *NOA Baru:* +${dailyNoa} Rekening Baru\n\n`;

  if (filteredDaily.length > 0) {
    report += `📝 *RINCIAN PENAMBAHAN HARIAN:*\n`;
    filteredDaily.forEach((item, idx) => {
      report += `${idx + 1}. [${item.kantor_kas}] *${item.nama_sumber}* (${item.produk}): +${formatRupiah(item.volume_baru)} (${item.noa_baru} NOA)\n`;
    });
    report += `\n`;
  }

  report += `===============================\n`;
  report += `_Generated automatically by ARA Funding Dashboard_`;

  return report;
}

