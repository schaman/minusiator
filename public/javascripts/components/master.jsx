var React = require("react"),
    MasterRow = require("./masterRow");

var Master = React.createClass({
  render: function() {
    var phrases = this.props.phrases ? this.props.phrases : [];
    var rows = phrases.map(function(phrase, i) {
      var enabledPhrases = this.props.enabledPhrases ? this.props.enabledPhrases : [];
      var enabled = enabledPhrases.indexOf(phrase) >= 0;
      return (
        <MasterRow
          key={JSON.stringify(phrase)}
          activeWord={this.props.activeWord}
          minusWords={this.props.minusWords}
          plusWords={this.props.plusWords}
          enabled={enabled}
          words={phrase} />
      );
    }.bind(this));
    return (
      <div className="commentList">
        {rows}
      </div>
    );
  }
});

module.exports = Master;