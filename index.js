var mongo = require('mongodb');

mongo.Db.prototype.publish = function(channel, message, callback) {
    // this.command({}, function(err) {});
}

mongo.Db.prototype.subscribe = function(channel, callback) {
    // this.command({}, function(err) {});
}

mongo.Db.prototype.unsubscribe = function(channel, callback) {
    // this.command({}, function(err) {});
}

module.exports = mongo;
