const fs = require('fs');
const content = fs.readFileSync('/Users/ahmadwahyuaji/Downloads/data aji 2.xls', 'utf8');

// Match <Data ss:Type="String">...</Data> and grab some of the first ones to see headers
const regex = /<Data[^>]*>([\s\S]*?)<\/Data>/g;
let match;
let count = 0;
const data = [];

while ((match = regex.exec(content)) !== null && count < 100) {
    const text = match[1].replace(/&#10;/g, ' ').trim();
    if (text) {
        data.push(text);
        count++;
    }
}

console.log(data);
