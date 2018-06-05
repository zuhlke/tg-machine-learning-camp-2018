import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords

import sklearn

tweets = pd.read_csv('tweets-tweets.csv')
tweets.columns = ['label', 'text']

tweets['text_length'] = tweets['text'].apply(len)
the_longest_tweets = tweets[tweets['text_length'] == tweets['text_length'].max()]

X = tweets['text']
y = tweets['label']

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
    nopunc = [char for char in text if char not in string.punctuation]
    result = ''.join(nopunc)
    
    result = [word for word in result.split() if word.lower() not in stopwords.words('english')]

    stemmer = PorterStemmer()
    result = [ stemmer.stem(word) for word in result ]
    result = ' '.join(result)
    return result

X = [text_process(text) for text in X]
from sklearn.feature_extraction.text import CountVectorizer
bow_transformer = CountVectorizer(ngram_range=(1,1)).fit(X)
X = bow_transformer.transform(X)
print("Vocabulary size is: ",len(bow_transformer.vocabulary_))

# Split data to test and training datasets
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=101)

# Train the classifier
from sklearn.naive_bayes import MultinomialNB
nb = MultinomialNB()
nb.fit(X_train, y_train)
preds = nb.predict(X_test)

review = text_process("the countryside was beautiful but the surroundings were culture list")
review_transformed = bow_transformer.transform([review])
print(review_transformed)
print(nb.predict(review_transformed)[0])




