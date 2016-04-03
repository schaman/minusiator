var React = require("react"),
    EventEmitterMixin = require('react-event-emitter-mixin');

var MasterWord = React.createClass({
  mixins: [EventEmitterMixin],

  getInitialState: function() {
    return {};
  },

  handleWordClick: function() {
    var palabra = this.props.palabra;
    this.eventEmitter('emit', 'wordClick', palabra);
  },

  render: function() {
    var className = 'word';
    if (this.props.active) {
      className += ' active';
    }
    if (this.props.minus) {
      className += ' minus';
    }
    if (this.props.plus) {
      className += ' plus';
    }

    return (
      <span onClick={this.handleWordClick} className={className}>
        {this.props.palabra.word}{' '}
      </span>
    );
  }
});

module.exports = MasterWord;