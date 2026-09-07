const fs = require('fs');

function zeroOut(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

zeroOut('src/components/modules/ExecutiveDashboard.tsx', [
  [/totalAset: \d+/g, 'totalAset: 0'],
  [/asetGrowth: \d+\.?\d*/g, 'asetGrowth: 0'],
  [/totalTabungan: \d+/g, 'totalTabungan: 0'],
  [/tabunganGrowth: \d+\.?\d*/g, 'tabunganGrowth: 0'],
  [/totalDeposito: \d+/g, 'totalDeposito: 0'],
  [/depositoGrowth: \d+\.?\d*/g, 'depositoGrowth: 0'],
  [/outstandingKredit: \d+/g, 'outstandingKredit: 0'],
  [/kreditGrowth: \d+\.?\d*/g, 'kreditGrowth: 0'],
  [/labaBersihYTD: \d+/g, 'labaBersihYTD: 0'],
  [/labaGrowth: \d+\.?\d*/g, 'labaGrowth: 0'],
  [/pencairanHariIni: \d+/g, 'pencairanHariIni: 0'],
  [/pencairanHariIniDebitur: \d+/g, 'pencairanHariIniDebitur: 0']
]);

zeroOut('src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx', [
  [/const aoPerformance(?:.|\n)*?\];/g, 'const aoPerformance: any[] = [];'],
  [/const pipelineList(?:.|\n)*?\];/g, 'const pipelineList: any[] = [];'],
  [/const pipelineData(?:.|\n)*?\];/g, 'const pipelineData: any[] = [];']
]);

// Any other files with metrics?
// DashboardPeKepatuhan.tsx - I already zeroed the strings, but are there objects?
zeroOut('src/components/modules/legacy-dashboards/DashboardPeKepatuhan.tsx', [
  [/const kpiKepatuhan(?:.|\n)*?\];/g, 'const kpiKepatuhan: any[] = [];']
]);

console.log('Zeroed out objects and leftover arrays.');
