const fs = require('fs');

function zeroOut(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

// Wipe DashboardPeBisnis.tsx (Image 3)
zeroOut('src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx', [
  [/142 Berkas/g, '0 Berkas'],
  [/1,284 Event/g, '0 Event'],
  [/48 Decisions/g, '0 Decisions']
]);

// Wipe DashboardCrm.tsx
zeroOut('src/components/modules/legacy-dashboards/DashboardCrm.tsx', [
  [/const kbArticles(?:.|\n)*?\];/g, 'const kbArticles: any[] = [];'],
  [/const \w+Leads(?:.|\n)*?\];/g, 'const recentLeads: any[] = [];'],
  [/const \w+Tasks(?:.|\n)*?\];/g, 'const recentTasks: any[] = [];']
]);

// DashboardKreditBermasalah.tsx
zeroOut('src/components/modules/legacy-dashboards/DashboardKreditBermasalah.tsx', [
  [/const ptpList(?:.|\n)*?\];/g, 'const ptpList: any[] = [];'],
  [/const ewsAlerts(?:.|\n)*?\];/g, 'const ewsAlerts: any[] = [];']
]);

// AnalisisAgunan.tsx
zeroOut('src/components/modules/legacy-dashboards/AnalisisAgunan.tsx', [
  [/const agunanList(?:.|\n)*?\];/g, 'const agunanList: any[] = [];']
]);

// DashboardAbsensiLapangan.tsx
zeroOut('src/components/modules/legacy-dashboards/DashboardAbsensiLapangan.tsx', [
  [/const attendanceData(?:.|\n)*?\];/g, 'const attendanceData: any[] = [];']
]);

// CreditAnalysisView.tsx
zeroOut('src/components/modules/CreditAnalysisView.tsx', [
  [/const pipelineData(?:.|\n)*?\];/g, 'const pipelineData: any[] = [];'],
  [/const recentApprovals(?:.|\n)*?\];/g, 'const recentApprovals: any[] = [];']
]);

console.log('Deep wipe executed.');
