const fs = require('fs');

const content = fs.readFileSync('/Users/ahmadwahyuaji/Downloads/data aji 2.xls', 'utf8');
const rows = content.match(/<Row.*?>(.*?)<\/Row>/gs);

function decodeHtml(html) {
    return html.replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(dec));
}

if (rows) {
  let count = 0;
  for (let rowStr of rows) {
    const cellStrs = rowStr.match(/<Cell[\s\S]*?<\/Cell>/gi) || [];
    const cellData = {};
    let currentIndex = 1;
    for (const cellStr of cellStrs) {
      const indexMatch = cellStr.match(/ss:Index="(\d+)"/i);
      if (indexMatch) {
        currentIndex = parseInt(indexMatch[1], 10);
      }
      const dataMatch = cellStr.match(/<Data[^>]*>([\s\S]*?)<\/Data>/i);
      if (dataMatch) {
        cellData[currentIndex] = decodeHtml(dataMatch[1].trim());
      }
      currentIndex++;
    }

    if (Object.keys(cellData).length > 20) {
      console.log(`--- DATA ROW ${count} ---`);
      for (const [idx, val] of Object.entries(cellData)) {
        console.log(`[${idx}] ${val}`);
      }
      count++;
      if (count > 2) break;
    }
  }
}
