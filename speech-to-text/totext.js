// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const replaceExt = require('replace-ext');

const audioDir = path.join(__dirname, 'converted');
const textDir = path.join(__dirname, 'text');

// Creates a client
const client = new speech.SpeechClient({
  keyFilename: path.join(__dirname, "speech-svc-acc.json"),
  projectId: "eadred-project"
});

fs.readdir(audioDir, (err, files) => {
  files.forEach(file => {
    convert(file);
  });
});

function convert(fileName) {
  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(path.join(audioDir, fileName));
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
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
        .join('\n');
    
        fs.writeFile(path.join(textDir, replaceExt(fileName, '.txt')), transcription, function(err) {
          if(err) {
              return console.log(err);
          }
      
          console.log("The file was saved!");
      }); 
      console.log(`Transcription: ${transcription}`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}



