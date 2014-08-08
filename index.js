var mongo = require('mongodb');

mongo.MongoClient.prototype.publish = function(channel, message, callback) {
    if (typeof channel !== 'string') {
        throw new Error('The channel argument to the publish command must be a string');
    }

    if (typeof message !== 'object') {
        throw new Error('The message argument to the publish command must be an object');
    }

    if (callback && typeof callback !== 'function') {
        throw new Error('The callback passed to the publish command must be a function');
    }

    this._db.command({publish: channel, message: message}, function(err, res) {
        if (callback) callback(err, res);
    });
}

mongo.MongoClient.prototype.subscribe = function(channel, timeout, callback) {
    if (typeof timeout === 'function') {
        callback = timeout;
        timeout = 600000; // 10 minute timeout default
    }

    if (typeof channel !== 'string') {
        throw new Error('The channel argument to the subscribe command must be a string');
    }

    if (typeof timeout !== 'number') {
        throw new Error('The timeout argument to the subscribe command must be a number');
    }

    if (typeof callback !== 'function') {
        throw new Error('The callback passed to the subscribe command must be a function');
    }

    var self = this;

    self._db.command({subscribe: channel}, function(err, subscription) {
        var subscriptionId = subscription.subscriptionId;
        poll(self, subscriptionId, timeout, callback);
    });
}

var poll = function(mongoClient, subscriptionId, timeout, callback) {
    mongoClient._db.command({poll: subscriptionId, timeout: timeout}, function(err, res) {
        if (err) {
            throw err
        } else {
            var messages = res.messages[subscriptionId];
            if (messages !== undefined) {
                callback(messages);
            }
        }

        poll(mongoClient, subscriptionId, timeout, callback);
    });
}

mongo.MongoClient.prototype.unsubscribe = function(channel, callback) {
    if (typeof channel !== 'string') {
        throw new Error('The channel argument to the unsubscribe command must be a string');
    }

    if (callback && typeof callback !== 'function') {
        throw new Error('The callback passed to the unsubscribe command must be a function');
    }

    // map channel to subscription ID's
    // this.command({unsubscribe: [ID's]}, function(err, res) {
    //     if (callback) callback(err, res);
    // });
}

module.exports = mongo;
