var React = require("react"),
    data = require('./data'),
    MasterWord = require("./masterWord");

var WordList = React.createClass({
  getInitialState: function() {
    return {};
  },

  render: function() {
    var activeWord = this.props.activeWord;
    var rows = this.props.words.map(function(palabra, i) {
      
      var minusWords = this.props.minusWords ? this.props.minusWords : [];
      var plusWords = this.props.plusWords ? this.props.plusWords : [];

      var className = 'wordlistitem';
      var minus = data.stemInPalabras(palabra.stem, minusWords);
      var plus = data.stemInPalabras(palabra.stem, plusWords);
      if (plus || minus) {
        className += ' disabled';
      }

      return (
        <div key={palabra.stem} className={className}>
          <MasterWord
            active={activeWord.stem == palabra.stem}
            minus={minus}
            plus={plus}
            palabra={palabra}/>
        </div>
      );
    }.bind(this));
    return (
      <div className="wordList">
        {rows}
      </div>
    );
  }
});

module.exports = WordList;