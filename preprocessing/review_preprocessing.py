import csv
import collections, itertools
import nltk.classify.util, nltk.metrics
from nltk.classify import NaiveBayesClassifier
from nltk.corpus import movie_reviews, stopwords
from nltk.sentiment.util import CategorizedPlaintextCorpusReader
from nltk.collocations import BigramCollocationFinder
from nltk.metrics import BigramAssocMeasures
from nltk.probability import FreqDist, ConditionalFreqDist


tweets = CategorizedPlaintextCorpusReader('../data/tweets', r'.*\.txt', cat_pattern=r'(\w+)/*')

def evaluate_classifier(featx):
    negids = tweets.fileids('neg')
    posids = tweets.fileids('pos')
    neuids = tweets.fileids('neutral')
 
    negfeats = [(featx(tweets.words(fileids=[f])), 'neg') for f in negids]
    posfeats = [(featx(tweets.words(fileids=[f])), 'pos') for f in posids]
    neufeats = [(featx(tweets.words(fileids=[f])), 'neutral') for f in neuids]
 
    negcutoff = len(negfeats)*3/4
    poscutoff = len(posfeats)*3/4
    neucutoff = len(neufeats)*3/4
 
    trainfeats = negfeats[:negcutoff] + posfeats[:poscutoff] + neufeats[:neucutoff]
    testfeats = negfeats[negcutoff:] + posfeats[poscutoff:] + neufeats[neucutoff:]
 
    classifier = NaiveBayesClassifier.train(trainfeats)
    refsets = collections.defaultdict(set)
    testsets = collections.defaultdict(set)
 
    for i, (feats, label) in enumerate(testfeats):
            refsets[label].add(i)
            observed = classifier.classify(feats)
            testsets[observed].add(i)
 
    print 'accuracy:', nltk.classify.util.accuracy(classifier, testfeats)
    print 'pos precision:', nltk.precision(refsets['pos'], testsets['pos'])
    print 'pos recall:', nltk.recall(refsets['pos'], testsets['pos'])
    print 'neg precision:', nltk.precision(refsets['neg'], testsets['neg'])
    print 'neg recall:', nltk.recall(refsets['neg'], testsets['neg'])
    print 'neutral precision:', nltk.precision(refsets['neutral'], testsets['neutral'])
    print 'neutral recall:', nltk.recall(refsets['neutral'], testsets['neutral'])
    classifier.show_most_informative_features()
 
def word_feats(words):
    return dict([(word, True) for word in words])
 
print 'evaluating single word features'
evaluate_classifier(word_feats)
 
word_fd = FreqDist()
label_word_fd = ConditionalFreqDist()
 
for word in tweets.words(categories=['pos']):
    word_fd.update([word.lower()])
    label_word_fd['pos'].update([word.lower()])

for word in tweets.words(categories=['neg']):
    word_fd.update([word.lower()])
    label_word_fd['neg'].update([word.lower()])

for word in tweets.words(categories=['neutral']):
    word_fd.update([word.lower()])
    label_word_fd['neutral'].update([word.lower()])
 
# n_ii = label_word_fd[label][word]
# n_ix = word_fd[word]
# n_xi = label_word_fd[label].N()
# n_xx = label_word_fd.N()
 
pos_word_count = label_word_fd['pos'].N()
neg_word_count = label_word_fd['neg'].N()
neu_word_count = label_word_fd['neutral'].N()
total_word_count = pos_word_count + neg_word_count + neu_word_count
 
word_scores = {}
 
for word, freq in word_fd.iteritems():
    pos_score = BigramAssocMeasures.chi_sq(label_word_fd['pos'][word],
        (freq, pos_word_count), total_word_count)
    neg_score = BigramAssocMeasures.chi_sq(label_word_fd['neg'][word],
        (freq, neg_word_count), total_word_count)
    neu_score = BigramAssocMeasures.chi_sq(label_word_fd['neutral'][word],
        (freq, neu_word_count), total_word_count)
    word_scores[word] = pos_score + neg_score + neu_score
 
best = sorted(word_scores.iteritems(), key=lambda (w,s): s, reverse=True)[:10000]
bestwords = set([w for w, s in best])
 
def best_word_feats(words):
    return dict([(word, True) for word in words if word in bestwords])
 
print 'evaluating best word features'
evaluate_classifier(best_word_feats)
 
def best_bigram_word_feats(words, score_fn=BigramAssocMeasures.chi_sq, n=200):
    bigram_finder = BigramCollocationFinder.from_words(words)
    bigrams = bigram_finder.nbest(score_fn, n)
    d = dict([(bigram, True) for bigram in bigrams])
    d.update(best_word_feats(words))
    return d
 
print 'evaluating best words + bigram chi_sq word features'
evaluate_classifier(best_bigram_word_feats)
