var DataModule = {
  stemWords: {}, // словарик {"хо": "хочу"}

  stemInPalabras: function(stem, palabras) {
    return this.indexOfStemInPalabras(stem, palabras) >= 0;
  },

  indexOfStemInPalabras: function(stem, palabras) {
    if (typeof stem !== "string") throw "Type of stem should be string";
    if (!Array.isArray(palabras)) throw "Type of palabras should be array";
    for (var i = palabras.length - 1; i >= 0; i--) {
      if (palabras[i].stem == stem) {
        return i;
      }
    }
    return -1;
  },

  loadDictionary: function(phrases) {

    // Составить список входящих туда слов и самую популярную словоформу
    var stemWords = {}; // "хо": {"хочу": 3, "хотел": 2}

    for (var i = 0; i < phrases.length; i++) {
      for (var k = 0; k < phrases[i].length; k++) {
        var word = phrases[i][k].word;
        var stem = phrases[i][k].stem;
        
        if (!(stem in stemWords)) {
          stemWords[stem] = {};
        }
        
        stemWords[stem][word] = (stemWords[stem][word] || 0) + 1;
      };
    };

    // выбираем самую популярную словоформу каждого стема
    for (stem in stemWords) {
      var maxPopularity = 0;
      var popularWordForm = '';

      for (word in stemWords[stem]) {
        if (stemWords[stem][word] > maxPopularity) {
          popularWordForm = word;
          maxPopularity = stemWords[stem][word];
        }
      }

      stemWords[stem] = popularWordForm;
    }

    this.stemWords = stemWords;
  }
};

module.exports = DataModule;