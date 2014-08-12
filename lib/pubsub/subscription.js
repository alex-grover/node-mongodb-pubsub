var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits;

/**
 * Subscription class to emit events to.
 * @ignore
 */
var Subscription = function(_id) {
  EventEmitter.call(this);
  this.id = _id;
}

/**
 * @ignore
 */
inherits(Subscription, EventEmitter);

exports.Subscription = Subscription;
