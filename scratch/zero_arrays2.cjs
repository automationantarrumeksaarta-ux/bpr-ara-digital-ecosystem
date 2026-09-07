const fs = require('fs');

function wipeArray(filePath, varName, type = 'any') {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`const ${varName}(?:\\s*:\\s*[^\\[=]+(?:\\[\\])?)?\\s*=\\s*\\[[\\s\\S]*?\\];`, 'm');
  content = content.replace(regex, `const ${varName}: ${type}[] = [];`);
  fs.writeFileSync(filePath, content, 'utf8');
}

wipeArray('src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx', 'aoPerformanceData');
wipeArray('src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx', 'prospekList');
wipeArray('src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx', 'collectionJanjiList');

console.log('Cleared remaining arrays.');
