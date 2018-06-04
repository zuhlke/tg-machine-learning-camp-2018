const linear16 = require('linear16');

const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');

const resourceFilesDir = path.join(__dirname, 'resources');
const convertedDir = path.join(__dirname, 'converted');

fs.readdir(resourceFilesDir, (err, files) => {
  files.forEach(file => {
    const newFile = replaceExt(file, '.wav');
    linear16(path.join(resourceFilesDir, file), path.join(convertedDir, newFile))
    .then(outPath => console.log('Converted ' + outPath)); 
  });
});

