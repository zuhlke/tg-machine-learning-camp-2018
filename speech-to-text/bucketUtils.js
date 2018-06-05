const fs = require('fs');
const path = require('path');
const Storage = require('@google-cloud/storage');
const q = require('q');
const _ = require('lodash');

const projectId = 'eadred-project';
const bucketName = 'zuhlke-mltt-camp2018'

const storage = new Storage({
    projectId: projectId
  });

module.exports = {
    deleteAllFiles: deleteAllFiles,
    downloadAllFiles: downloadAllFiles,
    uploadAllFiles: uploadAllFiles
}

function deleteAllFiles(remoteDirName) {
    const deleteFile = remoteFileName => {
        return storage.bucket(bucketName)
            .file(remoteFileName)
            .delete();
    }

    return listFiles(remoteDirName)
        .then(fileNames => Promise.all(fileNames.map(deleteFile)))
}

function downloadAllFiles(remoteDirName, localDirName) {

    const downloadFile = (remoteFileName) => {
        const remoteFileNameParts = remoteFileName.split('/');
        const localFileName = path.join(localDirName, remoteFileNameParts[remoteFileNameParts.length - 1]);
    
        console.log('Downloading ' + remoteFileName);
    
        return storage.bucket(bucketName)
            .file(remoteFileName)
            .download({ destination: localFileName });
    }

    return listFiles(remoteDirName)
        .then(fileNames => Promise.all(fileNames.map(downloadFile)))
        .then(() => console.log('All downloaded'));
}

function uploadAllFiles(localDirName, remoteDirName, extName) {
    const deferred = q.defer();

    fs.readdir(localDirName, (err, files) => {
      var allUploads = _.filter(files, f => path.extname(f) === extName)
      .map(file => {
        console.log('Uploading:', file);
  
        return storage.bucket(bucketName)
        .upload(path.join(localDirName, file), { destination: path.join(remoteDirName, file)})
        .catch(err => console.log('Failed to upload:', file, err));
      });
  
      deferred.resolve(Promise.all(allUploads));
    });
  
    return deferred.promise.then(() => console.log('All uploaded'));
  }

function listFiles(remoteDirName) {
    return storage.bucket(bucketName)
        .getFiles({ directory: remoteDirName })
        .then(files => files[0].map(f => f.name))
}