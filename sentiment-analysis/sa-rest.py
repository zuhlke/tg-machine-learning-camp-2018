from flask import Flask
app = Flask(__name__)

# Imports the Google Cloud client library
from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types

from flask import request
from flask import jsonify

@app.route('/sentiment-score', methods=['POST'])
def sentiment_score():
    # Instantiates a client
    client = language.LanguageServiceClient()

    # The text to analyze
    text = request.json['text']
    document = types.Document(
        content=text,
        type=enums.Document.Type.PLAIN_TEXT)

    # Detects the sentiment of the text
    sentiment = client.analyze_sentiment(document=document).document_sentiment
    return jsonify(score=sentiment.score)
