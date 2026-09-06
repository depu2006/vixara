const fs = require('fs');
const content = fs.readFileSync('vixara.jsx', 'utf8');
const startMatch = '<style>{`';
const endMatch = '`}</style>';

const startIndex = content.indexOf(startMatch);
const endIndex = content.indexOf(endMatch);

if (startIndex !== -1 && endIndex !== -1) {
  const cssContent = content.substring(startIndex + startMatch.length, endIndex);
  fs.writeFileSync('src/index.css', cssContent);
  
  const newVixara = content.substring(0, startIndex) + content.substring(endIndex + endMatch.length);
  fs.writeFileSync('vixara.jsx', newVixara);
  
  // also add import './index.css' to main.jsx if not present
  const mainContent = fs.readFileSync('src/main.jsx', 'utf8');
  if (!mainContent.includes('index.css')) {
    fs.writeFileSync('src/main.jsx', "import './index.css';\n" + mainContent);
  }
  
  console.log('CSS extracted successfully');
}
