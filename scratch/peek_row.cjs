const fs = require('fs');

const content = fs.readFileSync('/Users/ahmadwahyuaji/Downloads/data aji 2.xls', 'utf8');
const rows = content.match(/<Row.*?>(.*?)<\/Row>/gs);

function decodeHtml(html) {
    return html.replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(dec));
}

if (rows) {
  let count = 0;
  for (let row of rows) {
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
      console.log(`--- DATA ROW ${count} ---`);
      cells.forEach((c, i) => console.log(`[${i}] ${c}`));
      count++;
      if (count > 2) break;
    }
  }
}
