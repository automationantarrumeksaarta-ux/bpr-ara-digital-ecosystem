const fs = require('fs');
const filePath = 'src/mock/legacyDashboardData.ts';

let content = fs.readFileSync(filePath, 'utf8');

const arraysToEmpty = [
  'INITIAL_NPL_DATA',
  'INITIAL_SEBARAN_DATA',
  'INITIAL_AGUNAN_DATA',
  'INITIAL_JANJI_BAYAR_DATA',
  'INITIAL_TARGET_BUNGA_DATA',
  'INITIAL_PENCAPAIAN_BISNIS_DATA'
];

arraysToEmpty.forEach(arrName => {
  const regex = new RegExp(`export const ${arrName}:[\\s\\S]*?\\[[\\s\\S]*?\\];`, 'm');
  const typeMatch = content.match(new RegExp(`export const ${arrName}:\\s*([^\\[=]+)`));
  if (typeMatch) {
    const type = typeMatch[1].trim();
    content = content.replace(regex, `export const ${arrName}: ${type}[] = [];`);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully wiped legacy dummy data.');
