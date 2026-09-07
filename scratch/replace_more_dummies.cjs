const fs = require('fs');

function wipeArrayState(filePath, varName) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  // Simple regex for useState([...]) -> useState([]) for a specific variable
  const regex = new RegExp(`const \\[${varName}, set${varName.charAt(0).toUpperCase() + varName.slice(1)}\\] = useState\\(\\[[\\s\\S]*?\\]\\);`);
  content = content.replace(regex, `const [${varName}, set${varName.charAt(0).toUpperCase() + varName.slice(1)}] = useState<any[]>([]);`);
  fs.writeFileSync(filePath, content, 'utf8');
}

function wipeUseMemoArray(filePath, varName, type) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`const ${varName}: ${type}\\[\\] = useMemo\\(\\(\\) => \\[[\\s\\S]*?\\], \\[\\]\\);`);
  content = content.replace(regex, `const ${varName}: ${type}[] = useMemo(() => [], []);`);
  fs.writeFileSync(filePath, content, 'utf8');
}

function wipeExportedArray(filePath, varName, type) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`export const ${varName}: ${type}\\[\\] = \\[[\\s\\S]*?\\];`);
  content = content.replace(regex, `export const ${varName}: ${type}[] = [];`);
  fs.writeFileSync(filePath, content, 'utf8');
}

wipeUseMemoArray('src/components/modules/PayrollView.tsx', 'employees', 'EmployeeKPI');
wipeArrayState('src/components/modules/MarketingActivityView.tsx', 'activities');
wipeExportedArray('src/data/funding/sampleRawData.ts', 'RAW_FUNDING_DATA', 'RawFundingData');
wipeExportedArray('src/data/funding/sampleRawData.ts', 'RAW_DAILY_MOVEMENT_DATA', 'RawDailyMovementData');

console.log('Finished wiping more dummy files.');
