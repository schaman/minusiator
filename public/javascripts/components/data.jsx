var DataModule = {
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
  }
};

module.exports = DataModule;