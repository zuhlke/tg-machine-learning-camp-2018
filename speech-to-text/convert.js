const linear16 = require('linear16');

const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');

const resourceFilesDir = path.join(__dirname, '../audio');
const convertedDir = path.join(__dirname, 'converted');

if (!fs.existsSync(convertedDir)){
  fs.mkdirSync(convertedDir);
}

fs.readdir(resourceFilesDir, (err, files) => {
  files.forEach(file => {
    const newFile = replaceExt(file, '.wav');
    linear16(path.join(resourceFilesDir, file), path.join(convertedDir, newFile))
    .then(outPath => console.log('Converted ' + outPath)); 
  });
});

