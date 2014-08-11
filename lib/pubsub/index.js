var mongo = require('mongodb')
  , Subscription = require('./subscription').Subscription;

// indicates whether there is a poll active
var polling = false;

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

mongo.MongoClient.prototype.subscribe = function(channel, callback) {
    if (typeof channel !== 'string') {
        throw new Error('The channel argument to the subscribe command must be a string');
    }

    if (typeof callback !== 'function') {
        throw new Error('The callback passed to the subscribe command must be a function');
    }

    var self = this;
    this._db.command({subscribe: channel}, function(err, subscription) {
        // create subscription and allow client to register callbacks
        var subObj = new Subscription(subscription.subscriptionId);
        callback(subObj);

        // set poll length to default if not set
        if (!self.pollLength) self.pollLength = 600000;

        // add subscription to subscriptions array
        if (!self.subscriptions) self.subscriptions = [];
        self.subscriptions.push(subObj);

        // only poll if there are no other subscriptions,
        // indicating that there are not other pollers
        if (!polling) {
            polling = true;
            self.poll();
        }
    });
}

mongo.MongoClient.prototype.poll = function() {
    // all subscriptions have been unsubscribed
    if (this.subscriptions.length === 0) {
        polling = false;
        return;
    }

    // get array of subscription ID's from Subscription objects
    var ids = this.subscriptions.map(function(elem) {
        return elem.id;
    });

    var self = this;
    this._db.command({poll: ids, timeout: self.pollLength}, function(err, res) {
        if (err) {
            throw err
        } else {
            // convert response into message objects and emit 'message' event
            // iterate in reverse in case array members are removed while iterating
            for (var i = self.subscriptions.length - 1; i >= 0; i--) {
                var sub = self.subscriptions[i];
                var channels = res.messages[sub.id];
                for (var channel in channels) {
                    var messages = channels[channel];
                    for (var j = 0; j < messages.length; j++) {
                        var data = messages[j];
                        sub.emit('message', {subscription: sub.id, channel: channel, data: data});
                    }
                }
            }
        }

        self.poll();
    });
}

mongo.MongoClient.prototype.unsubscribe = function(subscription, callback) {
    if (typeof subscription !== 'object') {
        throw new Error('The subscription argument to the unsubscribe command must be an object');
    }

    if (callback && typeof callback !== 'function') {
        throw new Error('The callback passed to the unsubscribe command must be a function');
    }

    // remove subscription
    var index = this.subscriptions.indexOf(subscription);
    if (index !== -1) this.subscriptions.splice(index, 1);

    this._db.command({unsubscribe: subscription.id}, function(err, res) {
        if (callback) callback(err, res);
    });
}

module.exports = mongo;
