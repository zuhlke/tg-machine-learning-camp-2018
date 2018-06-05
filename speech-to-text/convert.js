const linear16 = require('linear16');
const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');
const Storage = require('@google-cloud/storage');
const rimraf = require('rimraf');
const q = require('q');
const _ = require('lodash');

const projectId = 'eadred-project';
const bucketName = 'zuhlke-mltt-camp2018'
const inputLocalDir = path.join(__dirname, 'audio-in');
const outputLocalDir = path.join(__dirname, 'audio-converted');
const inputRemoteDir = 'audio/original';
const outputRemoteDir = 'audio/converted';

// convertFiles().then(() => console.log('Done'));

if (fs.existsSync(inputLocalDir)) {
  rimraf.sync(inputLocalDir);
}
fs.mkdir(inputLocalDir);

if (fs.existsSync(outputLocalDir)) {
  rimraf.sync(outputLocalDir);
}
fs.mkdir(outputLocalDir);

const storage = new Storage({
  projectId: projectId
});

downloadAllInputFiles()
.then(deleteAllOutputFiles)
.then(convertFiles)
.then(() => console.log('All converted'))
.then(uploadFiles)
.then(() => console.log('All uploaded'))
.catch(err => console.log(err));

function listFiles(dirName) {
  return storage.bucket(bucketName)
  .getFiles({ directory: dirName})
  .then(files => files[0].map(f => f.name))
}

function deleteAllOutputFiles() {
  const deleteFile = remoteFileName => {
    return storage.bucket(bucketName)
    .file(remoteFileName)
    .delete();
  }

  return listFiles(outputRemoteDir)
  .then(fileNames => Promise.all(fileNames.map(deleteFile)))
}

function downloadAllInputFiles() {
  return listFiles(inputRemoteDir)
  .then(fileNames => Promise.all(fileNames.map(downloadFile)))
  .then(() => console.log('All downloaded'))
}

function downloadFile(remoteFileName) {
  const remoteFileNameParts = remoteFileName.split('/');
  const localFileName = path.join(inputLocalDir, remoteFileNameParts[remoteFileNameParts.length - 1]);

  console.log('Downloading ' + remoteFileName);

  return storage.bucket(bucketName)
  .file(remoteFileName)
  .download({ destination: localFileName });
}

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

  return deferred.promise;
}

function uploadFiles() {
  const deferred = q.defer();

  fs.readdir(outputLocalDir, (err, files) => {
    var allUploads = _.filter(files, f => path.extname(f) === '.wav')
    .map(file => {
      console.log('Uploading:', file);

      return storage.bucket(bucketName)
      .upload(path.join(outputLocalDir, file), { destination: path.join(outputRemoteDir, file)})
      .catch(err => console.log('Failed to upload:', file, err));
    });

    deferred.resolve(Promise.all(allUploads));
  });

  return deferred.promise;
}




