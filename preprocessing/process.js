// Reads the tweets csv and creates a file per tweet, containing the tweet text,
// sorted into directories for positive, negative and neutral tweets
// This would be suitable for an NLTK CategorizedPlaintextCorpusReader - https://groups.google.com/forum/#!topic/nltk-users/YFCKjHbpUkY

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const rimraf = require('rimraf');
const crypto = require('crypto');

const tweetsFile = path.join(__dirname, 'tweets.csv');
const outDir = path.join(__dirname, 'tweets');
const posDir = path.join(outDir, 'pos');
const negDir = path.join(outDir, 'neg');
const neutralDir = path.join(outDir, 'neutral');

createOutputDirs();
sortTweets();

function createOutputDirs() {
    if (fs.existsSync(outDir)) {
        rimraf.sync(outDir);
    }
    fs.mkdirSync(outDir);
    fs.mkdirSync(posDir);
    fs.mkdirSync(negDir);
    fs.mkdirSync(neutralDir);
}

function sortTweets() {
    var lineReader = readline.createInterface({
        input: fs.createReadStream(tweetsFile)
    });
    
    lineReader.on('line', processLine);
}

function processLine(line) {
    const matches = line.split(/([024]),(.+)/)

    // All lines should start with 0, 2 or 4 followed by a comma
    // The capture groups in the regex cause the capture to be spliced into the array,
    // hence why we expect blamnk strings at the start and end of the array
    if (matches.length !== 4 || matches[0] !== '' || matches[3] !== '') {
        throw Error('Unexpected input: ' + line);
    }

    const label = matches[1];
    const tweet = matches[2];

    switch (label) {
        case '0':
            writeTweet(negDir, tweet);
            break;
        case '2':
            writeTweet(neutralDir, tweet);
            break;
        case '4':
            writeTweet(posDir, tweet);
            break;
        default:
            throw Error('Unexpected label: ' + label);
    }
}

function writeTweet(dir, tweet) {
    const hash = crypto.createHash('md5').update(tweet).digest("hex");
    fs.writeFileSync(path.join(dir, hash + '.txt'), tweet);
}
  




