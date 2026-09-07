const fs = require('fs');

const content = fs.readFileSync('/Users/ahmadwahyuaji/Downloads/data aji 2.xls', 'utf8');
const rows = content.match(/<Row.*?>(.*?)<\/Row>/gs);

let totalBakiDebet = 0;
let nplBakiDebet = 0;
let dpkBakiDebet = 0; // Kol 2

function decodeHtml(html) {
    return html.replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(dec));
}

if (rows) {
  let count = 0;
  rows.forEach(row => {
    const cells = [];
    const cellMatches = row.match(/<Data[^>]*>([^<]+)<\/Data>/g);
    if (cellMatches) {
      cellMatches.forEach(match => {
        let data = match.replace(/<Data[^>]*>/, '').replace(/<\/Data>/, '').trim();
        data = decodeHtml(data);
        cells.push(data);
      });
    }

    if (cells.length > 20) {
      // Find baki debet and kolek
      const bakiDebetStr = cells[17] || '0';
      // Assume Indonesian format: dots for thousands, commas for decimal.
      // So remove dots, replace comma with dot.
      let cleanStr = bakiDebetStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, "");
      let bakiDebet = parseFloat(cleanStr);
      
      const kolek = (cells[29] || cells[30] || cells[28] || '').toUpperCase().trim();
      
      if (!isNaN(bakiDebet) && bakiDebet > 0) {
        totalBakiDebet += bakiDebet;
        if (['KL', 'D', 'M', '3', '4', '5', 'KURANG LANCAR', 'DIRAGUKAN', 'MACET'].includes(kolek)) {
          nplBakiDebet += bakiDebet;
        }
        if (['DPK', '2'].includes(kolek)) {
          dpkBakiDebet += bakiDebet;
        }
      }
    }
  });
}

console.log(`Total Baki Debet: ${totalBakiDebet}`);
console.log(`NPL Baki Debet (Kol 3,4,5): ${nplBakiDebet}`);
console.log(`DPK Baki Debet (Kol 2): ${dpkBakiDebet}`);
console.log(`NPL % (Kol 3,4,5): ${totalBakiDebet > 0 ? (nplBakiDebet / totalBakiDebet) * 100 : 0}%`);
console.log(`NPL % with DPK: ${totalBakiDebet > 0 ? ((nplBakiDebet + dpkBakiDebet) / totalBakiDebet) * 100 : 0}%`);
