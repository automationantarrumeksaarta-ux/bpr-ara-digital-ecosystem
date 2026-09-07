const fs = require('fs');

const content = fs.readFileSync('/Users/ahmadwahyuaji/Downloads/data aji 2.xls', 'utf8');
const rows = content.match(/<Row.*?>(.*?)<\/Row>/gs);

let totalBakiDebet = 0;
let nplBakiDebet = 0;

function decodeHtml(html) {
    return html.replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(dec));
}

if (rows) {
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
      const bakiDebetStr = cells[13] || '0';
      let cleanStr = bakiDebetStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, "");
      let bakiDebet = parseFloat(cleanStr);
      
      const kolek = (cells[26] || '').toUpperCase().trim();
      
      if (!isNaN(bakiDebet) && bakiDebet > 0 && cells[2]) { // cells[2] is Nama Peminjam
        totalBakiDebet += bakiDebet;
        // Kol 3,4,5
        if (['KL', 'D', 'M', '3', '4', '5', 'KURANG LANCAR', 'DIRAGUKAN', 'MACET'].includes(kolek)) {
          nplBakiDebet += bakiDebet;
        }
      }
    }
  });
}

console.log(`Total Baki Debet: ${totalBakiDebet}`);
console.log(`NPL Baki Debet: ${nplBakiDebet}`);
console.log(`NPL % (Kol 3,4,5): ${totalBakiDebet > 0 ? (nplBakiDebet / totalBakiDebet) * 100 : 0}%`);
