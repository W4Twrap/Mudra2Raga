const fs = require('fs');
const path = require('path');

// Load JSON file
const imageList = JSON.parse(fs.readFileSync('fileList.json', 'utf-8'));
const folderPath = './Mudras_Compiled/';

let missing = [];

for (let filename of imageList) {
  const filePath = path.join(folderPath, filename);
  if (!fs.existsSync(filePath)) {
    missing.push(filename);
  }
}

if (missing.length > 0) {
  console.log(`❌ Missing ${missing.length} file(s):`);
  for (let f of missing) {
    console.log(' -', f);
  }
} else {
  console.log('✅ All files exist!');
}
