const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(searchFiles(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for common dummy names or large hardcoded arrays
      if (
        content.match(/Rp \d/i) || 
        content.match(/Budi /) || 
        content.match(/Joko /) || 
        content.match(/Sutarno/) ||
        content.match(/PT /) ||
        content.match(/CV /) ||
        content.match(/const [a-zA-Z0-9]+:.*\[\]\s*=\s*\[\s*\{/s) || // Typed array of objects
        content.match(/const [a-zA-Z0-9]+\s*=\s*\[\s*\{/s) // Untyped array of objects
      ) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const res = searchFiles('src/components/modules');
console.log(res.join('\n'));
