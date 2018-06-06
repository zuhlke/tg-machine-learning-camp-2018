const fs = require('fs');
const path = require('path');
const q = require('q');
const _ = require('lodash');
const rimraf = require('rimraf');
const bucketUtils = require('./bucketUtils');

// Change this to false to create a dataset with just positive and negative labels
const LABEL_NEUTRAL = false;

const inputLocalDir = path.join(__dirname, 'text-sentiment');
const outputLocalDir = path.join(__dirname, 'text-labelled');
const inputRemoteDir = 'audio/text-sentiment';
const outputRemoteDir = 'audio/text-labelled';

const delimiter = ',';
const NEG_LABEL = '0';
const NEUTRAL_LABEL = '2';
const POS_LABEL = '4';

if (fs.existsSync(inputLocalDir)) {
    rimraf.sync(inputLocalDir);
}
fs.mkdir(inputLocalDir);

if (fs.existsSync(outputLocalDir)) {
    rimraf.sync(outputLocalDir);
}
fs.mkdir(outputLocalDir);

bucketUtils.downloadAllFiles(inputRemoteDir, inputLocalDir)
    .then(createLabelledDataFile)
    .then(() => bucketUtils.uploadAllFiles(outputLocalDir, outputRemoteDir, '.csv'))
    .catch(err => console.log(err));

function createLabelledDataFile() {
    const deferred = q.defer();

    fs.readdir(inputLocalDir, (err, files) => {
        var fileLines = _
            .filter(files, f => path.extname(f) === '.txt')
            .map(fileName => getLabelAndText(fileName))
            .filter(line => line !== '');

        deferred.resolve(Promise.all(fileLines));
    });

    return deferred.promise.then(writeLines);
}

function writeLines(lines) {
    const deferred = q.defer();
    const outfile = LABEL_NEUTRAL ? 'labelled.csv' : 'labelled-binary.csv';
    fs.writeFile(path.join(outputLocalDir, outfile), lines.join('\n'), function (err) {
        if (err) {
            console.log('Error writing labelled data set: ', err);
        } else {
            console.log('Successfully wrote labelled data set: ');
        }
        deferred.resolve();
    });

    return deferred.promise;
}

function getLabelAndText(fileName) {
    console.log('Labelling ', fileName);

    const textParts = fs
        .readFileSync(path.join(inputLocalDir, fileName), 'utf8')
        .split(delimiter);

    if (textParts.length !== 3) throw new Error('Unexpect format: ', textParts);

    const sentiment = Number.parseFloat(textParts[0]);
    // Ignore magnitude (textParts[1])

    const createLine = lbl => lbl + delimiter + textParts[2];

    if (LABEL_NEUTRAL) {
        var label = NEUTRAL_LABEL;
        if (sentiment > 0.5) {
            label = POS_LABEL;
        } else if (sentiment < 0.5) {
            label = NEG_LABEL;
        }
        return createLine(label);
    } else {
        if (sentiment > 0.0) {
            return createLine(POS_LABEL);
        } else if (sentiment < 0.0) {
            return createLine(NEG_LABEL);
        } else {
            return ''; //Ignore completely neutral results
        }
    }
}