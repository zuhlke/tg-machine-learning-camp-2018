// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');
const q = require('q');
const _ = require('lodash');
const rimraf = require('rimraf');
const bucketUtils = require('./bucketUtils');

const inputLocalDir = path.join(__dirname, 'audio-converted');
const outputLocalDir = path.join(__dirname, 'text');
const inputRemoteDir = 'audio/converted';
const outputRemoteDir = 'audio/text';

if (fs.existsSync(inputLocalDir)) {
  rimraf.sync(inputLocalDir);
}
fs.mkdir(inputLocalDir);

if (fs.existsSync(outputLocalDir)) {
  rimraf.sync(outputLocalDir);
}
fs.mkdir(outputLocalDir);

// Creates a client
const client = new speech.SpeechClient({
  projectId: "eadred-project"
});

bucketUtils.downloadAllFiles(inputRemoteDir, inputLocalDir)
.then(bucketUtils.deleteAllFiles(outputRemoteDir))
.then(convertFiles)
.then(() => bucketUtils.uploadAllFiles(outputLocalDir, outputRemoteDir, '.txt'))
.catch(err => console.log(err));

function convertFiles() {
  const deferred = q.defer();

  fs.readdir(inputLocalDir, (err, files) => {
    var allConversions = _
      .filter(files, f => path.extname(f) === '.wav')
      .map(convert);
  
    deferred.resolve(Promise.all(allConversions));
  });

  return deferred.promise.then(() => console.log('All converted'));
}

function convert(fileName) {
  console.log('Converting: ', fileName);
  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(path.join(inputLocalDir, fileName));
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US'
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  return client
    .recognize(request)
    .then(data => {
      const response = data[0];
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

      const deferred = q.defer();
      fs.writeFile(path.join(outputLocalDir, replaceExt(fileName, '.txt')), transcription, function (err) {
        if (err) {
          console.log('Error writing transcription: ', err);
        } else {
          console.log('Successfully wrote: ', transcription);
        }
        deferred.resolve();
      });

      return deferred.promise;
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}



