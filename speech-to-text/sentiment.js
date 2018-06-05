const lang = require('@google-cloud/language');
const fs = require('fs');
const path = require('path');
const q = require('q');
const _ = require('lodash');
const rimraf = require('rimraf');
const bucketUtils = require('./bucketUtils');

const inputLocalDir = path.join(__dirname, 'text');
const outputLocalDir = path.join(__dirname, 'text-sentiment');
const inputRemoteDir = 'audio/text';
const outputRemoteDir = 'audio/text-sentiment';

const delimiter = ',';

if (fs.existsSync(inputLocalDir)) {
  rimraf.sync(inputLocalDir);
}
fs.mkdir(inputLocalDir);

if (fs.existsSync(outputLocalDir)) {
  rimraf.sync(outputLocalDir);
}
fs.mkdir(outputLocalDir);

const client = new lang.LanguageServiceClient();

bucketUtils.downloadAllFiles(inputRemoteDir, inputLocalDir)
.then(bucketUtils.deleteAllFiles(outputRemoteDir))
.then(convertFiles)
.then(() => bucketUtils.uploadAllFiles(outputLocalDir, outputRemoteDir, '.txt'))
.catch(err => console.log(err));

function convertFiles() {
    const deferred = q.defer();
  
    fs.readdir(inputLocalDir, (err, files) => {
      var allConversions = _
        .filter(files, f => path.extname(f) === '.txt')
        .map(convert);
    
      deferred.resolve(Promise.all(allConversions));
    });
  
    return deferred.promise.then(() => console.log('All converted'));
  }
  
function convert(fileName) {
    console.log('Analysing: ', fileName);

    const text = fs
        .readFileSync(path.join(inputLocalDir, fileName), 'utf8')
        .replace(delimiter, ''); // Strip out anything that would be misinterpreted as a field delimiter

    const document = {
        content: text,
        type: 'PLAIN_TEXT',
    };

    // Detects the sentiment of the text
    return client
        .analyzeSentiment({ document: document })
        .then(results => {
            const sentiment = results[0].documentSentiment;
            const outputText = sentiment.score + delimiter + sentiment.magnitude + delimiter + text;

            const deferred = q.defer();
            fs.writeFile(path.join(outputLocalDir, fileName), outputText, function (err) {
                if (err) {
                    console.log('Error writing sentiment: ', err);
                } else {
                    console.log('Successfully wrote: ', outputText);
                }
                deferred.resolve();
            });

            return deferred.promise;
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}