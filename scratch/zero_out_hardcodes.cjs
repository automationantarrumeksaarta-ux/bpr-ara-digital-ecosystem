const fs = require('fs');

function zeroOut(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

zeroOut('src/context/AppContext.tsx', [
  [/rr: 75.5, npl: 10.2/g, 'rr: 0, npl: 0']
]);

zeroOut('src/components/modules/ExecutiveDashboard.tsx', [
  [/Rp 148\.50 M/g, 'Rp 0'],
  [/Rp 98\.40 M/g, 'Rp 0'],
  [/Rp 108\.10 M/g, 'Rp 0'],
  [/Rp 3\.12 M/g, 'Rp 0'],
  [/\+4\.8% vs Bulan Lalu/g, '0% vs Bulan Lalu'],
  [/\+2\.9% vs Bulan Lalu/g, '0% vs Bulan Lalu'],
  [/\+3\.2% vs Bulan Lalu/g, '0% vs Bulan Lalu'],
  [/\+11\.4% vs Tahun Lalu/g, '0% vs Tahun Lalu'],
  [/Rp 155\.00 M/g, 'Rp 0'],
  [/Rp 105\.00 M/g, 'Rp 0'],
  [/Rp 112\.00 M/g, 'Rp 0'],
  [/Rp 252\.841\.127/g, 'Rp 0'],
  [/Rp199,84 Jt/g, 'Rp 0'],
  [/Rp 2\.5 M/g, 'Rp 0'],
  [/Rp 1\.2 M/g, 'Rp 0'],
  [/144 NOA/g, '0 NOA'],
  [/\+Rp5,41 Jt/g, 'Rp 0'],
  [/79\.0%/g, '0%'],
  [/21\.0%/g, '0%'],
  [/75,8%/g, '0%'],
  [/197 NOA/g, '0 NOA'],
  [/Rp199\.841\.127/g, 'Rp 0'],
  [/192 NOA/g, '0 NOA'],
  [/Rp53\.000\.000/g, 'Rp 0'],
  [/5 NOA/g, '0 NOA'],
  [/Rp20\.000/g, 'Rp 0'],
  [/\+1 NOA/g, '0 NOA'],
  [/Rp247,43 Jt/g, 'Rp 0']
]);

zeroOut('src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx', [
  [/32 Lead/g, '0 Lead'],
  [/Rp 4\.25 M Minta/g, 'Rp 0 Minta'],
  [/18 Visit/g, '0 Visit'],
  [/85% On Track/g, '0% On Track'],
  [/14 Berkas/g, '0 Berkas'],
  [/Komite \/ SPPK/g, 'Komite / SPPK'],
  [/Rp 47\.30 M/g, 'Rp 0'],
  [/99\.6% Achieved/g, '0% Achieved'],
  [/Rp 51\.90 M/g, 'Rp 0'],
  [/99\.8% Achieved/g, '0% Achieved'],
  [/12 Debitur/g, '0 Debitur'],
  [/Rp 96\.5 Jt/g, 'Rp 0'],
  [/5 AO/g, '0 AO'],
  [/NPL Bank 2\.15%/g, 'NPL Bank 0%'],
  [/Target 100% OK/g, 'Target OK'],
  [/Belum Capai Target/g, 'Belum Capai Target'],
  [/Tampilkan Semua \(6 AO\)/g, 'Tampilkan Semua (0 AO)'],
  [/AO Belum Capai Target \(5\)/g, 'AO Belum Capai Target (0)'],
  [/Rp 12\.50 M/g, 'Rp 0'],
  [/Rp 10\.00 M/g, 'Rp 0'],
  [/Rp 9\.80 M/g, 'Rp 0'],
  [/Rp 9\.40 M/g, 'Rp 0'],
  [/Rp 8\.50 M/g, 'Rp 0'],
  [/Rp 11\.20 M/g, 'Rp 0'],
  [/Rp 8\.90 M/g, 'Rp 0'],
  [/Rp 8\.00 M/g, 'Rp 0'],
  [/Rp 6\.50 M/g, 'Rp 0'],
  [/100% Achieved/g, '0% Achieved'],
  [/98% Achieved/g, '0% Achieved'],
  [/81% Achieved/g, '0% Achieved'],
  [/Kurang DPK: Rp 200\.0 Jt/g, 'Kurang DPK: Rp 0'],
  [/Prospek: 8/g, 'Prospek: 0'],
  [/FollowUp: 5/g, 'FollowUp: 0'],
  [/Prospek: 6/g, 'Prospek: 0'],
  [/FollowUp: 4/g, 'FollowUp: 0'],
  [/Prospek: 5/g, 'Prospek: 0'],
  [/FollowUp: 3/g, 'FollowUp: 0']
]);

zeroOut('src/components/modules/legacy-dashboards/DashboardPeKepatuhan.tsx', [
  [/91\.5%/g, '0%'],
  [/4Temuan/g, '0 Temuan'],
  [/2\.15%/g, '0%'],
  [/1\.08%/g, '0%'],
  [/Rp 1\.45 M/g, 'Rp 0'],
  [/Rp 820 Jt/g, 'Rp 0'],
  [/Rp 1\.29 M/g, 'Rp 0'],
  [/14\.2%/g, '0%'],
  [/1\.2%/g, '0%'],
  [/98\.5%/g, '0%'],
  [/4 \/ 4 Cabang/g, '0 / 4 Cabang'],
  [/0 Incident/g, '0 Incident'],
  [/2 Warning/g, '0 Warning'],
  [/100% Validated/g, '0% Validated'],
  [/98\.8%/g, '0%'],
  [/100% Sesuai Limit/g, '0% Sesuai Limit']
]);

zeroOut('src/components/modules/legacy-dashboards/DashboardPeAudit.tsx', [
  [/142 Berkas/g, '0 Berkas'],
  [/1,284 Event/g, '0 Event'],
  [/48 Decisions/g, '0 Decisions'],
  [/100% Hash Verified/g, '0% Hash Verified'],
  [/100% Sign-Off Valid/g, '0% Sign-Off Valid'],
  [/99\.2% Valid/g, '0% Valid'],
  [/2 Alert/g, '0 Alert'],
  [/Revaluasi & Rate Override/g, 'Revaluasi & Rate Override']
]);

console.log('Zeroed out hardcodes.');
