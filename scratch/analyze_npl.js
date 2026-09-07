const fs = require('fs');

const content = fs.readFileSync('/Users/ahmadwahyuaji/Downloads/data aji 2.xls', 'utf8');

// Match <Row>...</Row>
const rows = content.match(/<Row.*?>(.*?)<\/Row>/gs);
if (!rows) {
  console.log("No rows found.");
  process.exit(0);
}

let totalBakiDebet = 0;
let nplBakiDebetOjk = 0; // Kol 3, 4, 5
let nplBakiDebetWithDpk = 0; // Kol 2, 3, 4, 5

rows.forEach(row => {
  const cells = [];
  const cellMatches = row.match(/<Data[^>]*>([^<]+)<\/Data>/g);
  if (cellMatches) {
    cellMatches.forEach(match => {
      const data = match.replace(/<Data[^>]*>/, '').replace(/<\/Data>/, '').trim();
      cells.push(data);
    });
  }
  
  if (cells.length > 20) {
    // Assuming structure from CBSDataCenterView:
    // Baki debet is usually cell 17, kolek is cell 28/29/30.
    // Let's do a more robust search.
    // We can just print the first data row to see indices.
    
    // In our previous `grep`, the headers were:
    // 0: NO
    // 1: No Rekening
    // ...
    // 10: Baki Debet ?
  }
});
console.log('Done');
