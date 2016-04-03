var DataModule = {
  stemInPalabras: function(stem, palabras) {
    if (typeof stem !== "string") throw "Type of stem should be string";
    if (!Array.isArray(palabras)) throw "Type of palabras should be array";
    for (var i = palabras.length - 1; i >= 0; i--) {
      if (palabras[i].stem == stem) {
        return true;
      }
    }
    return false;
  }  
};

module.exports = DataModule;