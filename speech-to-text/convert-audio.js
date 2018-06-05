const linear16 = require('linear16');
const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');
const rimraf = require('rimraf');
const q = require('q');
const _ = require('lodash');
const bucketUtils = require('./bucketUtils');

const inputLocalDir = path.join(__dirname, 'audio-in');
const outputLocalDir = path.join(__dirname, 'audio-converted');
const inputRemoteDir = 'audio/original';
const outputRemoteDir = 'audio/converted';

if (fs.existsSync(inputLocalDir)) {
  rimraf.sync(inputLocalDir);
}
fs.mkdir(inputLocalDir);

if (fs.existsSync(outputLocalDir)) {
  rimraf.sync(outputLocalDir);
}
fs.mkdir(outputLocalDir);

bucketUtils.downloadAllFiles(inputRemoteDir, inputLocalDir)
.then(bucketUtils.deleteAllFiles(outputRemoteDir))
.then(convertFiles)
.then(() => bucketUtils.uploadAllFiles(outputLocalDir, outputRemoteDir, '.wav'))
.catch(err => console.log(err));

function convertFiles() {
  
  const deferred = q.defer();

  fs.readdir(inputLocalDir, (err, files) => {

    var allConversions = _.filter(files, f => path.extname(f) === '.m4a')
    .map(file => {
      console.log('Converting:', file);
      const newFile = replaceExt(file, '.wav');

      try {
        return linear16(path.join(inputLocalDir, file), path.join(outputLocalDir, newFile))
          .then(outPath => console.log('Converted ' + outPath))
          .catch(err => console.log('Failed to convert:', file, err));
      } catch (err) {
        console.log('Failed to convert: ', file, err)
        return Promise.resolve();
      }
    });

    deferred.resolve(Promise.all(allConversions));
  });

  return deferred.promise.then(() => console.log('All converted'));
}