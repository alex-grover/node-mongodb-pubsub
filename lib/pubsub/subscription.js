// Subscription object - basically just a wrapper for an EventEmitter that can hold an ObjectId
var EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits;

var Subscription = function(_id) {
    EventEmitter.call(this);
    this.id = _id;
}

inherits(Subscription, EventEmitter);

exports.Subscription = Subscription;
