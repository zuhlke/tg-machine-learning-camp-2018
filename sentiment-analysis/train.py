import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
import sklearn

tweets = pd.read_csv('tweets-large.csv',error_bad_lines=False)
tweets.columns = ['id', 'label', 'meta', 'text']

X = tweets['text'][1:35000]
y = tweets['label'][1:35000] * 2

custom_stopwords = {"ourselves", "hers", "between", "again", "there", "about", "once", "during", "having", "with", "they", "own", "an", "be", "some", "for", "do", "its", "yours", "such", "into", "of", "itself", "other", "is", "s", "am", "or", "who", "as", "from", "him", "each", "the", "themselves", "are", "we", "these", "your", "his", "through", "me", "were", "her",  "himself", "this", "should", "our", "their", "while",  "both", "up", "to", "ours", "had", "she", "when", "at", "before", "them", "same", "and", "been", "have", "in", "will", "on", "does", "then", "that", "because", "what", "over", "why", "so", "can", "did", "now", "under", "he", "you", "herself", "has", "just", "where", "too", "only", "myself", "which", "those", "i", "after", "whom", "being", "if", "theirs", "my", "a", "by", "doing", "it", "how", "further", "was", "here", "than" }

import re
import string
from nltk.stem.porter import PorterStemmer
def text_process(text):
    '''
    Takes in a string of text, then performs the following:
    0. Remove all links and referneces (@Name ...), digits
    1. Remove all punctuation
    2. Remove all stopwords
    3. Return the cleaned text as a list of words
    4. Convert words ot its infinitve form
    '''
    text = re.sub(r"@\S+", "", text)
    text = re.sub(r"http:\S+", "", text)
    text = re.sub(r"\d\S+", "", text)
    text = re.sub(r"&quot", "", text)
    text = re.sub(r"[;:!?./\-_]", "", text)
    text = re.sub(r"s'", "s", text)
    result = re.sub(r"'s", "", text)
    #nopunc = [char for char in text if char not in string.punctuation]
    #result = ''.join(nopunc)
    
    result = [word for word in result.split() if word.lower() not in custom_stopwords]
    result = ' '.join(result)
    return result

X = [text_process(text) for text in X]
from sklearn.feature_extraction.text import CountVectorizer
bow_transformer = CountVectorizer(ngram_range=(1,2)).fit(X)
X = bow_transformer.transform(X)
print("Vocabulary size is: ",len(bow_transformer.vocabulary_))

# Split data to test and training datasets
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=101)

# Train the classifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.externals import joblib
nb = MultinomialNB()
nb.fit(X_train, y_train)
# Save model
joblib.dump(nb, 'nb-model.pkl')
# Upload model for prediction
nb = joblib.load('nb-model.pkl')
preds = nb.predict(X_test)
from sklearn.metrics import confusion_matrix, classification_report
print(confusion_matrix(y_test, preds))
print('\n')
print(classification_report(y_test, preds))

review = text_process("Not really happy about that")
review_transformed = bow_transformer.transform([review])
print(review_transformed)
print(nb.predict(review_transformed)[0])







