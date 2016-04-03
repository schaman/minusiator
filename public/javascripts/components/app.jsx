var React = require("react"),
    $ = require("jquery"),
    Master = require("./master"),
    MasterWord = require("./masterWord"),
    WordList = require("./wordList"),
    EventEmitterMixin = require('react-event-emitter-mixin'),
    data = require('./data');

var App = React.createClass({
  mixins: [EventEmitterMixin],

  getInitialState() {
    return {
      words: [],                 // все слова отсортированные по весу
      stemCounts: {},            // все стемы с весами
      enabledStemCounts: [],     // частота в неотминусованных фразах
      phrases: [],               // все фразы
      activeWord: {},            // выбранное слово
      activeWordPhrases: [],     // фразы которые содержат выбранное слово
      activeWordEnabledCount: 0, // частота выбранного слова в неотминусованных фразах
      minusWords: [],            // минус-слова
      plusWords: [],             // слова, которые мы игнорируем при расчёте веса фразы
      enabledPhrases: [],        // фразы которые не содержат минус-слов
      disabledPhrases: []        // фразы которые содержат минус-слова
    };
  },

  componentWillMount() {
    this.eventEmitter('on', 'wordClick', this.handleWordClick);
    if (typeof document !== 'undefined')
      document.addEventListener('keydown', this.handleKeydown, false);    
  },

  // следующее по популярности в неотминусованных фразах
  nextWord(goForward) {
    var current = this.state.activeWordEnabledCount;

    // если стоим на отминусованном слове, выбираем следующее в общем списке
    if (current == 0) {
      var next = 0;

      if (this.state.activeWord && this.state.activeWord.stem) {
        // узнать позицию текущего слова в общем списке
        current = data.indexOfStemInPalabras(this.state.activeWord.stem, this.state.words)
      }

      if (goForward) {
        next = current + 1;
      } else {
        next = current - 1;
      }

      // проверить границы списка, и выбрать нужное слово
      if (next >= 0 && next <= this.state.words.length - 1) {
        this.handleWordClick(this.state.words[next]);
      }
    } else {
      // делаем строку, которую удобно сравнивать
      function pad(number, word) {
        var p = "000000000";
        var n = 1000000000 - number;
        return (p+n).slice(-p.length) + word;
      }

      // находим следующее по популярности в неотминусованных
      var currentWord = this.state.activeWord;
      current = pad(current, currentWord.stem);

      var stemCounts = this.state.enabledStemCounts;
      var lastWeight = '';
      if (goForward) lastWeight = 'Z'; // Z больше любой цифры
      var candidate = '';
      for (var stem in stemCounts) {
        var w = pad(stemCounts[stem], stem);
        if (goForward) { // максимальный вес меньше текущего
          if (w > current && w < lastWeight) {
            lastWeight = w;
            candidate = stem;
          }
        } else { // минимальный вес больше текущего
          if (w < current && (w > lastWeight || !lastWeight)) {
            lastWeight = w;
            candidate = stem;
          }
        }
      }

      if (candidate !== '') {
        this.handleWordClick({word: data.stemWords[candidate], stem: candidate});
      }
    }
  },

  handleKeydown(e) {
    var keyCode = e.keyCode;
    if (keyCode == 13) {
    } else if (keyCode == 87 || keyCode == 38) { // w or up
      if (this.handlePlusClick())
        this.nextWord(true);
    } else if (keyCode == 83 || keyCode == 40) { // s or down
      if (this.handleMinusClick())
        this.nextWord(true);
    } else if (keyCode == 65 || keyCode == 37) { // a or left
      this.nextWord(false);
    } else if (keyCode == 68 || keyCode == 39) { // d or right
      this.nextWord(true);
    } else if (keyCode == 88) {
    }
  },

  splitPhrases(phrases, minusWords) {
    // делим фразы на активные и неактивные каждый раз когда меняются минус-слова
    var enabledPhrases = [];
    var disabledPhrases = [];

    phrases.forEach(function(phrase){
      for (var i = 0; i < phrase.length; i++) {
        if (data.stemInPalabras(phrase[i].stem, minusWords)) {
          disabledPhrases.push(phrase);
          return;
        }
      };
      enabledPhrases.push(phrase);
    })

    return {
      enabledPhrases: enabledPhrases,
      disabledPhrases: disabledPhrases,
    };
  },

  sortPhrases(state) {
    var sortedPhrases = [];

    // Измерять вес каждой фразы по самому тяжёлому необработанному слову
    state.phrases.forEach(function(phrase){
      var weight = 0;

      for (var i = 0; i < phrase.length; i++) {
        var palabra = phrase[i];
        var stem = palabra.stem;

        // у заминусованных фраз вес -1
        if (data.stemInPalabras(stem, state.minusWords)) {
          weight = -1;
          break;
        }

        if (!data.stemInPalabras(stem, state.plusWords)) {
          var w = state.stemCounts[stem];
          if (weight < w) {
            weight = w;
          }
        }
      };

      sortedPhrases.push([phrase, weight]);
    })

    // Отсортировать фразы по весу
    sortedPhrases.sort(function(a, b) {return b[1] - a[1]})

    var phrases = sortedPhrases.map(function(sp){
      return sp[0];
    })

    return phrases;
  },

  getSortedWords(phrases) {
    // Для каждого слова найти его вес — в какое количество фраз оно входит
    // узнаём частотность каждого стема и каждой словоформы
    var stemCounts = {}; // "хо": 5

    for (var i = 0; i < phrases.length; i++) {
      for (var k = 0; k < phrases[i].length; k++) {
        var word = phrases[i][k].word;
        var stem = phrases[i][k].stem;
        stemCounts[stem] = (stemCounts[stem] || 0) + 1;
      };
    };

    // Отсортировать слова по весу
    var sortedStems = [];
    for (var stem in stemCounts)
      sortedStems.push([stem, stemCounts[stem]])

    sortedStems.sort(function(a, b) {
      if (b[1] == a[1]) {
        if(a[0] < b[0]) return -1;
        if(a[0] > b[0]) return 1;
        return 0;
      }
      return b[1] - a[1]
    })

    var words = sortedStems.map(function(sw){
      return {word: data.stemWords[sw[0]], stem: sw[0]};
    })

    return {
      words: words,
      stemCounts: stemCounts
    };
  },

  updateMe(newState) {
    var state = {
      words:             this.state.words,
      stemCounts:        this.state.stemCounts,
      phrases:           this.state.phrases,
      plusWords:         this.state.plusWords,
      minusWords:        this.state.minusWords,
      enabledStemCounts: this.state.enabledStemCounts
    }

    for (var attrname in newState) {
      state[attrname] = newState[attrname];
    }

    if (('phrases' in newState) || ('minusWords' in newState)) {
      // делим фразы на активные и неактивные по минус-словам
      var res = this.splitPhrases(state.phrases, state.minusWords);
      state.enabledPhrases = res.enabledPhrases;
      state.disabledPhrases = res.disabledPhrases;

      res = this.getSortedWords(res.enabledPhrases);
      state.words = res.words;
      state.enabledStemCounts = res.stemCounts;
    }

    // Отсортировать фразы по весу самого тяжёлого из входящих в них слов
    state.phrases = this.sortPhrases(state);

    this.setState(state);
  },

  componentDidMount() {
    this.serverRequest = $.get('/data/', function (response) {
      // загружаем фразы
      var minusWords = response.minus;
      var plusWords = response.plus;
      var phrases = response.phrases;

      data.loadDictionary(phrases);
      var res = this.getSortedWords(phrases);

      this.updateMe({
        words:      res.words,
        stemCounts: res.stemCounts,
        phrases:    phrases,
        plusWords:  plusWords,
        minusWords: minusWords
      });
    }.bind(this));
  },

  componentWillUnmount() {
    this.serverRequest.abort();
    document.removeEventListener('keydown', this.handleKeydown, false);
  },

  handleWordClick(word) {
    var activeWordPhrases = this.state.phrases.filter(function(phrase){
      return data.stemInPalabras(word.stem, phrase);
    })

    this.setState({
      activeWord: word,
      activeWordPhrases: activeWordPhrases,
      activeWordEnabledCount: this.state.enabledStemCounts[word.stem]
    });
  },

  handleMinusClick() {
    var minusWords = this.state.minusWords;
    var plusWords = this.state.plusWords;
    var word = this.state.activeWord;

    if (!word) {
      return false;
    }

    var i = minusWords.indexOf(word);

    if (i >= 0) {
      minusWords.splice(i, 1);
      this.updateMe({ minusWords: minusWords });
      return false;
    } else {
      var k = plusWords.indexOf(word);
      if (k >= 0) {
        plusWords.splice(k, 1); // удаляем из плюсов если занесли в минусы
        minusWords.push(word);
        this.updateMe({ minusWords: minusWords, plusWords: plusWords });
      } else {
        minusWords.push(word);
        this.updateMe({ minusWords: minusWords });
      }
      return true;
    }
  },

  // true = добавлено, false = удалено или не найдено
  handlePlusClick() {
    var plusWords = this.state.plusWords;
    var minusWords = this.state.minusWords;
    var word = this.state.activeWord;

    if (!word) {
      return false;
    }

    var i = plusWords.indexOf(word);

    if (i >= 0) {
      plusWords.splice(i, 1);
      this.updateMe({ plusWords: plusWords });
      return false;
    } else {
      var k = minusWords.indexOf(word);
      if (k >= 0) {
        minusWords.splice(k, 1); // удаляем из минусов если занесли в плюсы
        plusWords.push(word);
        this.updateMe({ plusWords: plusWords, minusWords: minusWords });
      } else {
        plusWords.push(word);
        this.updateMe({ plusWords: plusWords });
      }
      return true;
    }
  },
  render() {
    if (this.state.activeWord.stem) {
      var minus = data.stemInPalabras(this.state.activeWord.stem, this.state.minusWords);
      var plus = data.stemInPalabras(this.state.activeWord.stem, this.state.plusWords);
      var activeWord = 
        (<MasterWord
          active={true}
          minus={minus}
          plus={plus}
          palabra={this.state.activeWord} />)
    } else {
      var activeWord = (<span/>);
    }

    return (
      <div className="cols">
        <div id="left1">
          <h2>Слова</h2>
          <WordList
            words={this.state.words}
            minusWords={this.state.minusWords}
            plusWords={this.state.plusWords}
            activeWord={this.state.activeWord}
          />
        </div>
        <div id="left2">
          <h2>Фразы</h2>
          <Master
            phrases={this.state.phrases}
            enabledPhrases={this.state.enabledPhrases}
            activeWord={this.state.activeWord}
            minusWords={this.state.minusWords}
            plusWords={this.state.plusWords}
          />
        </div>
        <div id="left3">
          <h2>
            <button className="btn btn-default" onClick={this.handlePlusClick}>
              plus
            </button>
            &nbsp;
            {activeWord}
            &nbsp;
            <button className="btn btn-default" onClick={this.handleMinusClick}>
              minus
            </button>
          </h2>
          <Master
            phrases={this.state.activeWordPhrases}
            enabledPhrases={this.state.enabledPhrases}
            activeWord={this.state.activeWord}
            minusWords={this.state.minusWords}
            plusWords={this.state.plusWords}
          />
        </div>
        <div id="left4">
          <h2>Минусы</h2>
          <WordList
            words={this.state.minusWords}
            activeWord={this.state.activeWord} />
        </div>
        <div id="left5">
          <h2>Плюсы</h2>
          <WordList
            words={this.state.plusWords}
            activeWord={this.state.activeWord} />
        </div>
      </div>
    )
  }
});

module.exports = App;