const fs = require('fs');
const path = require('path');

// Folder/File yang akan DIABAIKAN (Penting agar file tidak terlalu besar)
const ignoreList = [
  'node_modules', '.next', '.git', '.vscode', 'public', 
  'package-lock.json', 'yarn.lock', 'bundle.js', 
  'README.md', '.env', '.eslintrc.json', 'postcss.config.js', 'tailwind.config.ts'
];

// Ekstensi file yang akan DIAMBIL
const allowedExtensions = ['.ts', '.tsx', '.prisma', '.css'];

const outputFile = 'full_project_code.txt';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!ignoreList.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (allowedExtensions.includes(path.extname(file)) && !ignoreList.includes(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(__dirname, []);
let content = "";

allFiles.forEach(file => {
  // Buat path relatif agar mudah dibaca
  const relativePath = path.relative(__dirname, file);
  content += `\n\n================================================\n`;
  content += `FILE PATH: ${relativePath}\n`;
  content += `================================================\n`;
  content += fs.readFileSync(file, 'utf8');
});

fs.writeFileSync(outputFile, content);
console.log(`Berhasil! Silakan buka file '${outputFile}' dan copy isinya ke AI.`);