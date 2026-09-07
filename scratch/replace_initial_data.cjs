const fs = require('fs');
const filePath = 'src/mock/initialData.ts';

let content = fs.readFileSync(filePath, 'utf8');

// The new INITIAL_USERS
const newUsers = `export const INITIAL_USERS: User[] = [
  { id: 'usr-dirut', nip: 'ARA-01001', name: 'Demo Dirut', email: 'dirut@bprara.co.id', role: 'Direktur Utama', roleTitle: 'Direktur Utama', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Direksi', status: 'ACTIVE' },
  { id: 'usr-dir-ymfk', nip: 'ARA-01002', name: 'Demo Dir. YMFK', email: 'dirymfk@bprara.co.id', role: 'Direktur YMFK', roleTitle: 'Direktur YMFK', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Direksi', status: 'ACTIVE' },
  { id: 'usr-pe-bisnis', nip: 'ARA-01003', name: 'Demo PE Bisnis', email: 'pebisnis@bprara.co.id', role: 'PE Bisnis & Collection', roleTitle: 'PE Bisnis & Collection', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Eksekutif', status: 'ACTIVE' },
  { id: 'usr-pe-kepatuhan', nip: 'ARA-01004', name: 'Demo PE Kepatuhan', email: 'pekepatuhan@bprara.co.id', role: 'PE Kepatuhan, Manrisk & LK', roleTitle: 'PE Kepatuhan', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Eksekutif', status: 'ACTIVE' },
  { id: 'usr-pe-audit', nip: 'ARA-01005', name: 'Demo PE Audit', email: 'peaudit@bprara.co.id', role: 'PE Audit Intern & Anti Fraud', roleTitle: 'PE Audit', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Eksekutif', status: 'ACTIVE' },
  { id: 'usr-kacab', nip: 'ARA-02001', name: 'Demo Kacab', email: 'kacab@bprara.co.id', role: 'Kepala Cabang', roleTitle: 'Kepala Cabang', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Cabang', status: 'ACTIVE' },
  { id: 'usr-kakas', nip: 'ARA-02002', name: 'Demo Kepala Kas', email: 'kakas@bprara.co.id', role: 'Kepala Kas', roleTitle: 'Kepala Kas', branchId: 'KK_SOLO', branchName: 'KK Solo', department: 'Kantor Kas', status: 'ACTIVE' },
  { id: 'usr-ao', nip: 'ARA-03001', name: 'Demo Account Officer', email: 'ao@bprara.co.id', role: 'Account Officer', roleTitle: 'Account Officer', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Bisnis', status: 'ACTIVE' },
  { id: 'usr-funding', nip: 'ARA-03002', name: 'Demo Funding', email: 'funding@bprara.co.id', role: 'Marketing Dana (Funding)', roleTitle: 'Marketing Dana', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Bisnis', status: 'ACTIVE' },
  { id: 'usr-surveyor', nip: 'ARA-03003', name: 'Demo Surveyor', email: 'surveyor@bprara.co.id', role: 'Surveyor', roleTitle: 'Surveyor', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Bisnis', status: 'ACTIVE' },
  { id: 'usr-analis', nip: 'ARA-04001', name: 'Demo Analis Kredit', email: 'analis@bprara.co.id', role: 'Analis Kredit', roleTitle: 'Analis Kredit', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Operasional', status: 'ACTIVE' },
  { id: 'usr-legal', nip: 'ARA-04002', name: 'Demo Admin Legal', email: 'legal@bprara.co.id', role: 'Admin Legal', roleTitle: 'Admin Legal', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Operasional', status: 'ACTIVE' },
  { id: 'usr-sdm', nip: 'ARA-04003', name: 'Demo HRD', email: 'sdm@bprara.co.id', role: 'Pengembangan SDM', roleTitle: 'HRD', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Operasional', status: 'ACTIVE' },
  { id: 'usr-teller', nip: 'ARA-05001', name: 'Demo Teller', email: 'teller@bprara.co.id', role: 'Teller', roleTitle: 'Teller', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Layanan', status: 'ACTIVE' },
  { id: 'usr-cs', nip: 'ARA-05002', name: 'Demo CS', email: 'cs@bprara.co.id', role: 'Customer Service', roleTitle: 'CS', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Layanan', status: 'ACTIVE' },
  { id: 'usr-kolektor-spv', nip: 'ARA-06001', name: 'Demo Koor. Collection', email: 'kolektorspv@bprara.co.id', role: 'Koordinator Collection', roleTitle: 'Koor Collection', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Collection', status: 'ACTIVE' },
  { id: 'usr-kolektor', nip: 'ARA-06002', name: 'Demo Staff Collection', email: 'kolektor@bprara.co.id', role: 'Staff Collection', roleTitle: 'Staff Collection', branchId: 'KC_PUSAT', branchName: 'KC Pusat', department: 'Collection', status: 'ACTIVE' },
];`;

// Regex replacement
content = content.replace(/export const INITIAL_USERS: User\[\] = \[[\s\S]*?\];/m, newUsers);

// Empty other arrays
const arraysToEmpty = [
  'INITIAL_CUSTOMERS',
  'INITIAL_GREBEK_PASAR_CAMPAIGNS',
  'INITIAL_FUNDING_OPPORTUNITIES',
  'INITIAL_CREDIT_APPLICATIONS',
  'INITIAL_LOAN_FACILITIES',
  'INITIAL_PROMISE_TO_PAY',
  'INITIAL_COLLECTION_CASES',
  'INITIAL_RESTRUCTURING',
  'INITIAL_FLOW_TASKS',
  'INITIAL_EWS_ALERTS',
  'INITIAL_ANTI_FRAUD_FLAGS',
  'INITIAL_AUDIT_TRAIL',
  'INITIAL_ATTENDANCE',
  'INITIAL_EMPLOYEE_SCORES',
  'INITIAL_NOTIFICATIONS'
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
console.log('Successfully wiped dummy data and injected Demo Users.');
