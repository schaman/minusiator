var React = require("react"),
    MasterWord = require("./masterWord"),
    data = require('./data');

var MasterRow = React.createClass({
  render: function() {
    var activeWord = this.props.activeWord;
    var words = this.props.words.map(function(palabra, i) {
      var minus = data.stemInPalabras(palabra.stem, this.props.minusWords);
      var plus = data.stemInPalabras(palabra.stem, this.props.plusWords);
      return (
        <MasterWord
          key={i}
          active={activeWord.stem == palabra.stem}
          minus={minus}
          plus={plus}
          palabra={palabra} />
      );
    }.bind(this));

    var className = 'phrase';
    if (!this.props.enabled) {
      className += ' disabled';
    }

    return (
      <div className={className}>
        {words}
      </div>
    );
  }
});

module.exports = MasterRow;