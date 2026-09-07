const fs = require('fs');

function wipeArray(filePath, varName, type = 'any') {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  // Match `const varName = [` or `const varName: Type[] = [`
  const regex = new RegExp(`const ${varName}(?:\\s*:\\s*[^\\[=]+(?:\\[\\])?)?\\s*=\\s*\\[[\\s\\S]*?\\];`, 'm');
  content = content.replace(regex, `const ${varName}: ${type}[] = [];`);
  fs.writeFileSync(filePath, content, 'utf8');
}

wipeArray('src/components/modules/ExecutiveDashboard.tsx', 'riskAlerts');
wipeArray('src/components/modules/ExecutiveDashboard.tsx', 'targetRbb');
wipeArray('src/components/modules/ExecutiveDashboard.tsx', 'rankingCabang');
wipeArray('src/components/modules/ExecutiveDashboard.tsx', 'rankingAO');

wipeArray('src/components/modules/legacy-dashboards/DashboardPeKepatuhan.tsx', 'auditTemuanList');
wipeArray('src/components/modules/legacy-dashboards/DashboardPeKepatuhan.tsx', 'fraudIndicators');
wipeArray('src/components/modules/legacy-dashboards/DashboardPeKepatuhan.tsx', 'riskProfileMatrix');

wipeArray('src/components/modules/legacy-dashboards/DashboardPeAudit.tsx', 'auditLogs', 'AuditLogItem');
wipeArray('src/components/modules/legacy-dashboards/DashboardPeAudit.tsx', 'auditEvidenceList', 'AuditEvidenceItem');
wipeArray('src/components/modules/legacy-dashboards/DashboardPeAudit.tsx', 'approvalAuditTrail', 'ApprovalAuditTrailItem');

console.log('Final wipe complete.');
