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
var folder = './public/data/prednaznachenie/sense-2/';

router.get('/', function(req, res) {
  // загружаем фразы
  var phrases = fs.readFileSync(folder + 'phrases.txt', 'utf8');
  var plus = fs.readFileSync(folder + 'plus.txt', 'utf8');
  var minus = fs.readFileSync(folder + 'minus.txt', 'utf8');

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
