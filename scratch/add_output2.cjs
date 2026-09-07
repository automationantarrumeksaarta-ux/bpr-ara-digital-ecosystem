const fs = require('fs');

// 1. Update beis.ts
const beisPath = 'src/types/beis.ts';
let beisContent = fs.readFileSync(beisPath, 'utf8');
beisContent = beisContent.replace(/outputDoD\?: string; \/\/ Definition of Done \/ Expected Output/g, 'outputDoD?: string; // Definition of Done / Expected Output\n  outputDoD2?: string; // Output Target 2');
fs.writeFileSync(beisPath, beisContent, 'utf8');

// 2. Update TaskFormModal.tsx
const modalPath = 'src/components/common/TaskFormModal.tsx';
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Add state
modalContent = modalContent.replace(
  /const \[outputDoD, setOutputDoD\] = useState\(editingTask\?.outputDoD \|\| ''\);/g,
  "const [outputDoD, setOutputDoD] = useState(editingTask?.outputDoD || '');\n  const [outputDoD2, setOutputDoD2] = useState(editingTask?.outputDoD2 || '');"
);

// Add to save payload
modalContent = modalContent.replace(
  /outputDoD: outputDoD,/g,
  "outputDoD: outputDoD,\n      outputDoD2: outputDoD2,"
);

// Update grid and add field
const gridStart = '{/* Output & Outcome */}\n          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">';
const newGridStart = '{/* Output & Outcome */}\n          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">';

const outputFieldHtml = `<div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Output Target <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={outputDoD}
                onChange={(e) => setOutputDoD(e.target.value)}
                placeholder="Target keluaran (Output 1)"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Output Target 2
              </label>
              <input
                type="text"
                value={outputDoD2}
                onChange={(e) => setOutputDoD2(e.target.value)}
                placeholder="Target keluaran (Output 2)"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>`;

modalContent = modalContent.replace(gridStart, newGridStart);

modalContent = modalContent.replace(
  /<div className="space-y-1.5">\s*<label className="block text-xs font-bold text-gray-700 dark:text-gray-300">\s*Output Target <span className="text-red-500">\*<\/span>\s*<\/label>\s*<input\s*type="text"\s*value=\{outputDoD\}\s*onChange=\{\(e\) => setOutputDoD\(e\.target\.value\)\}\s*placeholder="Target keluaran \(Output\)"\s*className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800\/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"\s*\/>\s*<\/div>/g,
  outputFieldHtml
);

fs.writeFileSync(modalPath, modalContent, 'utf8');

console.log('Success');
