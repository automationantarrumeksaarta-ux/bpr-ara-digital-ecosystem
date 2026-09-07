const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/components/modules/legacy-dashboards/DashboardPeBisnis.tsx',
  'src/components/modules/LosCreditView.tsx',
  'src/components/modules/legacy-dashboards/AnalisisAgunan.tsx',
  'src/components/modules/legacy-dashboards/DashboardRasioBungaAO.tsx',
  'src/components/modules/legacy-dashboards/DashboardPencapaianBisnis.tsx',
  'src/components/modules/legacy-dashboards/DashboardJanjiBayar.tsx',
  'src/components/modules/legacy-dashboards/DashboardKreditBermasalah.tsx',
  'src/components/modules/legacy-dashboards/DashboardPeKepatuhan.tsx',
  'src/components/modules/legacy-dashboards/DashboardPeAudit.tsx'
];

const basePath = '/Users/ahmadwahyuaji/Downloads/bpr-ara-digital-ecosystem';

filesToProcess.forEach(fileRelPath => {
  const filePath = path.join(basePath, fileRelPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Restore missing emerald/purple colors that were broken by previous AI
    content = content.replace(/ \/20 border/g, ' bg-primary-light border border-primary/20 text-primary');
    content = content.replace(/ \/70 hover:/g, ' bg-surface-muted hover:bg-primary-light text-primary');
    content = content.replace(/className=""/g, 'className="text-primary"');
    content = content.replace(/ hover: \/30 hover: /g, ' hover:bg-primary-light/50 transition-colors ');
    content = content.replace(/ hover: px-2.5/g, ' hover:bg-primary-light text-primary px-2.5');
    
    // Replace hardcoded light/dark colors to semantic variables
    content = content.replace(/bg-white dark:bg-\[#111111\]/g, 'bg-surface');
    content = content.replace(/bg-slate-900 dark:bg-slate-100/g, 'bg-primary text-white');
    content = content.replace(/bg-slate-100 dark:bg-white\/10/g, 'bg-surface-muted');
    content = content.replace(/bg-slate-50 dark:bg-white\/5\/50/g, 'bg-background');
    content = content.replace(/bg-slate-50/g, 'bg-background');
    content = content.replace(/bg-slate-100/g, 'bg-surface-muted');
    
    // Borders
    content = content.replace(/border-slate-200 dark:border-white\/10/g, 'border-border');
    content = content.replace(/border-slate-100/g, 'border-border');
    content = content.replace(/border-slate-200/g, 'border-border');
    content = content.replace(/border-gray-200/g, 'border-border');
    content = content.replace(/border-white\/20/g, 'border-primary-light/20');
    
    // Text colors
    content = content.replace(/text-gray-900 dark:text-white/g, 'text-foreground');
    content = content.replace(/text-slate-900 dark:text-gray-900 dark:text-white/g, 'text-foreground');
    content = content.replace(/text-slate-900 dark:text-white/g, 'text-foreground');
    content = content.replace(/text-slate-900/g, 'text-foreground');
    content = content.replace(/text-slate-800 dark:text-gray-100/g, 'text-foreground');
    content = content.replace(/text-slate-800/g, 'text-foreground');
    content = content.replace(/text-slate-700/g, 'text-foreground');
    
    content = content.replace(/text-slate-500 dark:text-gray-400/g, 'text-muted');
    content = content.replace(/text-slate-600 dark:text-gray-300/g, 'text-muted');
    content = content.replace(/text-slate-400/g, 'text-muted');
    content = content.replace(/text-slate-500/g, 'text-muted');
    content = content.replace(/text-slate-600/g, 'text-muted');
    content = content.replace(/text-gray-500/g, 'text-muted');
    
    content = content.replace(/text-slate-950/g, 'text-foreground');
    
    // Fix broken ternary class strings like `? '' : ''`
    content = content.replace(/className=\{\`([^\`]*)\`\}/g, (match, p1) => {
      // Very basic cleanup of empty string evaluations
      let cleaned = p1.replace(/\? '' : ''/g, "? 'text-primary' : 'text-muted'");
      cleaned = cleaned.replace(/\? ' text-gray-900 dark:text-white ring-2 ' : 'bg-white dark:bg-\[#111111\]\/15 hover:bg-white dark:bg-\[#111111\]\/25 text-gray-900 dark:text-white border-white\/20'/g, "? 'bg-primary text-white shadow-md' : 'bg-surface text-muted border-border hover:bg-background'");
      cleaned = cleaned.replace(/\? ' text-gray-900 dark:text-white shadow-md' : ' \/70 hover:'/g, "? 'bg-primary-light text-primary shadow-md border-primary/20' : 'bg-surface text-muted hover:bg-background border-border'");
      return `className={\`${cleaned}\`}`;
    });
    
    // Some general cleanups
    content = content.replace(/glass-effect/g, 'bg-surface shadow-md');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${fileRelPath}`);
  } else {
    console.log(`File not found: ${fileRelPath}`);
  }
});
