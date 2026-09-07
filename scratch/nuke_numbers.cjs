const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      // Safe replacements for specific UI text patterns
      content = content.replace(/Rp\s*\d+[.,\d]*\s*(?:M|Jt|B|K)?/g, 'Rp 0');
      content = content.replace(/\d+,\d+\s*Event/g, '0 Event');
      content = content.replace(/\b\d+\s*(Lead|Visit|Berkas|Decisions|Temuan|Alert|AO|Debitur|NOA|Rekening)\b/gi, '0 $1');
      content = content.replace(/\b\d+\.\d+%/g, '0%');
      content = content.replace(/\b\d+%\s*(Achieved|On Track|Valid|Sesuai)/gi, '0% $1');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned: ${fullPath}`);
      }
    }
  }
}

processDir('src/components/modules');
