# Machine Learning Topic Team

Project for Zuhlke UK Camp 2018

## Test Data Set Creation

A test data set can be created based on recorded audio using the scripts in the speech-text folder.

Each script represents a step in the data processing, where the input data is downloaded from one GCS bucket folder and uploaded to another.

### Prerequisistes

+ A GCP service account key should be located in the repo root called `speech-svc-acc.json`, which should have Object Admin permission on Google Cloud Storage in the `eadred-project` project.
+ The audio conversion script uses the [linear16 npm package](https://www.npmjs.com/package/linear16), which in turn requires the [FFMpeg](https://www.ffmpeg.org/) utility to be on `PATH` or referenced by the `FFMPEG_PATH` variable.

### Scripts

#### convert-audio.js

Run with `npm run convert`.

Input folder: `audio/original`

Output folder: `audio/converted`

This converts the original m4a audio files recorded on an iPhone to uncompressed linear16 audio encoding.

#### to-text.js

Run with `npm run totext`.

Input folder: `audio/converted`

Output folder: `audio/text`

This runs the converted audio through Google's speech to text API to produce a text transcript of each audio recording.

#### sentiment.js

Run with `npm run sentiment`.

Input folder: `audio/text`

Output folder: `audio/text-sentiment`

This runs the transcribed text through Google's language API to produce a sentiment score for each. Each file contains a comma separated row with fields for sentiment score, magnitude and the original text.

#### label.js

Run with `npm run label`.

Input folder: `audio/text-sentiment`

Output folder: `audio/text-labelled`

This takes the sentiment scored text and applies a label based on the following criteria:

+ If the `LABEL_NEUTRAL` constant near the top of the file is set to true, then:
    + Sentiment score > 0.5 => Positive
    + Sentiment score < -0.5 => Negative
    + Otherwise Neutral
+ If `LABEL_NEUTRAL` is set to false, then:
    + Sentiment score > 0.0 => Positive
    + Sentiment score < 0.0 => Negative
    + Otherwise the text is ignored

The output of the script is a single csv file with a line per review, with fields:

+ Sentiment label - 0 (Negative), 2 (Neutral), 4 (Positive)
+ Review text

The name of the file will be either `labelled.csv` (if `LABEL_NEUTRAL` is set to true), or `labelled-binary.csv` (if set to false).