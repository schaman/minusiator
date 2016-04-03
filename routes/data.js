var express = require('express');
var router = express.Router();
var natural = require('natural');
var fs = require('fs');

// Класс "Palabra" {word: "хочу", stem: "хо"}
function wordToPalabra(word) {
  return {word: word, stem: natural.PorterStemmerRu.stem(word)};
}

function wordArrayToPalabras(wordArray) {
  return wordArray.map(function(word){
    return wordToPalabra(word);
  })
}

function textToPalabras(text) {
  return wordArrayToPalabras(text.split(/\n/));
}

//var folder = './public/data/test/';
var folder = './data/';

function load(filename) {
  var path = folder + filename;

  console.log(path);

  try {
    return fs.readFileSync(path, 'utf8');
  } catch (e) {
    return '';
  }
}

router.get('/', function(req, res) {
  // загружаем фразы
  var phrases = load('phrases.txt');
  var plus = load('plus.txt');
  var minus = load('minus.txt');

  phrases = phrases.split(/\n/).map(function(phrase){
    return wordArrayToPalabras(phrase.split(/\s/));
  })

  res.send({
    phrases: phrases,
    plus: textToPalabras(plus),
    minus: textToPalabras(minus)
  });
});

module.exports = router;
