var React = require("react"),
    $ = require("jquery"),
    Master = require("./master"),
    WordList = require("./wordList"),
    EventEmitterMixin = require('react-event-emitter-mixin'),
    data = require('./data');

var App = React.createClass({
  mixins: [EventEmitterMixin],

  getInitialState() {
    return {
      words: [],             // все слова отсортированные по весу
      stemCounts: {},        // все слова с весами
      phrases: [],           // все фразы
      activeWord: {},        // выбранное слово
      activeWordPhrases: [], // фразы которые содержат выбранное слово
      minusWords: [],        // минус-слова
      plusWords: [],         // слова, которые мы игнорируем при расчёте веса фразы
      enabledPhrases: [],    // фразы которые не содержат минус-слов
      disabledPhrases: []    // фразы которые содержат минус-слова
    };
  },

  componentWillMount() {
    this.eventEmitter('on', 'wordClick', this.handleWordClick);
    if (typeof document !== 'undefined')
      document.addEventListener('keydown', this.handleKeydown, false);    
  },

  nextWord(goForward) {
    var current = -1;
    var next = 0;

    if (this.state.activeWord && this.state.activeWord.stem) {
      // узнать позицию текущего слова
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
  },

  handleKeydown(e) {
    var keyCode = e.keyCode;
    if (keyCode == 13) {
    } else if (keyCode == 87 || keyCode == 38) { // w or up
      this.handlePlusClick();
    } else if (keyCode == 83 || keyCode == 40) { // s or down
      this.handleMinusClick();
    } else if (keyCode == 65 || keyCode == 37) { // a or left
      this.nextWord(false)
    } else if (keyCode == 68 || keyCode == 39) { // d or right
      this.nextWord(true)
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

    this.setState({
      enabledPhrases: enabledPhrases,
      disabledPhrases: disabledPhrases,
    });
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
          var w = state.stemCounts[stem].cnt;
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

  updateMe(newState) {
    var state = {
      phrases:    this.state.phrases,
      words:      this.state.words,
      stemCounts: this.state.stemCounts,
      plusWords:  this.state.plusWords,
      minusWords: this.state.minusWords
    }

    for (var attrname in newState) {
      state[attrname] = newState[attrname];
    }

    if (('phrases' in newState) || ('minusWords' in newState)) {
      // делим фразы на активные и неактивные по минус-словам
      this.splitPhrases(state.phrases, state.minusWords);
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

      // Составить список входящих туда слов
      // Для каждого слова найти его вес — в какое количество фраз оно входит

      // узнаём частотность каждого стема и каждой словоформы

      var stemCounts = {}; // "хо": {cnt: 5, word: "хочу", words: {"хочу": 3, "хотел": 2}} 

      for (var i = 0; i < phrases.length; i++) {
        for (var k = 0; k < phrases[i].length; k++) {
          var word = phrases[i][k].word;
          var stem = phrases[i][k].stem;
          
          if (!(stem in stemCounts)) {
            stemCounts[stem] = {cnt: 0, words: {}};
          }
          
          stemCounts[stem].cnt++;
          stemCounts[stem].words[word] = (stemCounts[stem].words[word] || 0) + 1;
        };
      };

      // выбираем самую популярную словоформу каждого стема
      for (stem in stemCounts) {
        var maxPopularity = 0;
        var popularWordForm = '';

        for (word in stemCounts[stem].words) {
          if (stemCounts[stem].words[word] > maxPopularity) {
            popularWordForm = word;
            maxPopularity = stemCounts[stem].words[word];
          }
        }

        stemCounts[stem].word = popularWordForm;
      }

      // Отсортировать слова по весу

      var sortedWords = [];
      for (var stem in stemCounts)
        sortedWords.push([stem, stemCounts[stem]])
      sortedWords.sort(function(a, b) {return b[1].cnt - a[1].cnt})

      var words = sortedWords.map(function(sw){
        return {word: sw[1].word, stem: sw[0]};
      })

      this.updateMe({
        phrases:    phrases,
        words:      words,
        stemCounts: stemCounts,
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
      activeWordPhrases: activeWordPhrases
    });
  },

  handleMinusClick() {
    var minusWords = this.state.minusWords;
    var word = this.state.activeWord;

    if (!word) {
      return;
    }

    var i = minusWords.indexOf(word);

    if (i >= 0) {
      minusWords.splice(i);
    } else {
      minusWords.push(word);
    }

    this.updateMe({
      minusWords: minusWords
    });
  },

  handlePlusClick() {
    var plusWords = this.state.plusWords;
    var word = this.state.activeWord;

    if (!word) {
      return;
    }

    var i = plusWords.indexOf(word);

    if (i >= 0) {
      plusWords.splice(i);
    } else {
      plusWords.push(word);
    }

    this.updateMe({
      plusWords: plusWords
    });
  },
  render() {
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
            {this.state.activeWord.word}
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