var mongo = require('mongodb')
  , Subscription = require('./subscription').Subscription;

/**
 * Indicates whether there is a poll active.
 * @ignore
 */
var polling = false;


/**
 * Publishes a document to a given channel.
 *
 * @param {String} channel The channel to publish to.
 * @param {Object} message The body of the message to publish.
 * @param {Function} [callback] Optional callback.
 * @return {null}
 * @api public
 */
mongo.Db.prototype.publish = function(channel, message, callback) {
  if (typeof channel !== 'string') {
    throw new Error('The channel argument to the publish command must be a string');
  }

  if (typeof message !== 'object') {
    throw new Error('The message argument to the publish command must be an object');
  }

  if (callback && typeof callback !== 'function') {
    throw new Error('The callback passed to the publish command must be a function');
  }

  this.command({publish: channel, message: message}, function(err, res) {
    if (callback) callback(err, res);
  });
}


/**
 * Subscribes to a channel using prefix matching.
 *
 * @param {String} channel The channel to subscribe to.
 * @param {Function} callback Required callback which passes the Subscription object.
 * @return {null}
 * @api public
 */
mongo.Db.prototype.subscribe = function(channel, options, callback) {
  if (typeof channel !== 'string') {
    throw new Error('The channel argument to the subscribe command must be a string');
  }

  if (typeof options === 'function' && typeof callback === 'undefined') {
    callback = options;
    options = {};
  }

  if (typeof options !== 'object') {
    throw new Error('The options passed to the subscribe command must be an object');
  }

  if (options.filter && typeof options.filter !== 'object') {
    throw new Error('The filter passed to the subscribe command must be an object');
  }

  if (options.projection && typeof options.projection !== 'object') {
    throw new Error('The projection passed to the subscribe command must be an object');
  }

  if (typeof callback !== 'function') {
    throw new Error('The callback passed to the subscribe command must be a function');
  }

  var self = this;
  var subscribeCommand = {subscribe: channel};
  if (options.filter) subscribeCommand.filter = options.filter;
  if (options.projection) subscribeCommand.projection = options.projection;
  this.command(subscribeCommand, function(err, subscription) {
    // set defaults if not set
    if (!self.pollLength) self.pollLength = 600000;
    if (!self.subscriptions) self.subscriptions = {}; // maps ID to Subscription
    if (!self.subscriptionIDs) self.subscriptionIDs = []; // array of ObjectID's
    
    if (err) {
      callback(err);
    } else {
      // create subscription
      var subObj = new Subscription(subscription.subscriptionId);
      self.subscriptionIDs.push(subObj.id);
      self.subscriptions[subObj.id] = subObj;

      // only poll if there are no other subscriptions,
      // indicating that there are not other pollers
      if (!polling) {
        polling = true;
        self.poll();
      }

      callback(err, subObj);
    }

  });
}


/**
 * Polls on all subscriptions on this DB object for new messages.
 * Emits events to Subscription objects for each new message.
 *
 * @return {null}
 * @api public
 */
mongo.Db.prototype.poll = function() {

  // all subscriptions have been unsubscribed
  if (this.subscriptionIDs.length === 0) {
    polling = false;
    return;
  }

  var self = this;
  this.command({poll: this.subscriptionIDs, timeout: this.pollLength}, function(err, res) {
    if (err) {

      // TODO: don't throw error here - figure out how to signal to
      // user that poll failed and then restart polling
      
      throw err
    } else {

      // serialize messages into format to be emitted
      var messages = [];
      for (var id in res.messages) {
        var channels = res.messages[id];
        for (var channel in channels) {
          var docs = channels[channel];
          for (var i = 0; i < docs.length; i++) {
            var data = docs[i];
            messages.push({subscription: id, channel: channel, data: data});
          }
        }
      }

      // emit message data. do this after serializing in case event handling unsubscribes
      // subscriptions we are working with.
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        var subscription = self.subscriptions[message.subscription];
        if (subscription) subscription.emit('message', message);
      }

      // emit any errors that occurred
      for (var id in res.errors) {
        var subscription = self.subscriptions[id];
        if (subscription) subscription.emit('error', res.errors[id]);
      }

    }

    // wrap recursive call in setTimeout to prevent stack overflow for long running processes
    setTimeout(function() {
      self.poll();
    }, 0);
  });
}


/**
 * Unsubscribes a given subscription.
 *
 * @param {Object} subscription The subscription to unsubscribe from.
 * @param {Function} [callback] Optional callback.
 * @return {null}
 * @api public
 */
mongo.Db.prototype.unsubscribe = function(subscription, callback) {
  if (typeof subscription !== 'object' || !subscription.hasOwnProperty('id')) {
    throw new Error('The subscription argument to the unsubscribe command must be a subscription object');
  }

  if (callback && typeof callback !== 'function') {
    throw new Error('The callback passed to the unsubscribe command must be a function');
  }

  // remove subscription
  var index = this.subscriptionIDs.indexOf(subscription.id);
  if (index === -1 || !delete this.subscriptions[subscription.id]) {
    callback(new Error('Subscription passed not associated with this connection'));
  }
  this.subscriptionIDs.splice(index, 1);

  this.command({unsubscribe: subscription.id}, function(err, res) {
    if (callback) callback(err, res);
  });
}


mongo.Db.prototype.watch = function(type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = undefined;
  }

  validateWatchArguments(type, callback);

  var filter = {db: {$regex: '^' + this.databaseName}, collection: {$not: new RegExp('^' + this.databaseName + '\.system')}};
  if (type) {
    filter.type = type;
  }

  this.subscribe('$events', {filter: filter}, function(err, subscription) {
    if (err) {
      throw err
    }

    subscription.on('message', function(message) {
      callback(null, message.data);
    });

    subscription.on('error', function(errmsg) {
      callback(errmsg);
    })
  });
}

mongo.Collection.prototype.watch = function(type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = undefined;
  }

  validateWatchArguments(type, callback);

  var filter = {db: this.db.databaseName, collection: this.collectionName};
  if (type) {
    filter.type = type;
  }

  this.db.subscribe('$events', {filter: filter}, function(err, subscription) {
    if (err) {
      throw err
    }

    subscription.on('message', function(message) {
      callback(null, message.data);
    });

    subscription.on('error', function(errmsg) {
      callback(errmsg);
    })
  });
}

var validateWatchArguments = function(type, callback) {
  if (type && typeof type !== 'string') {
    throw new Error('The type argument to the watch command must be a string');
  }

  if (typeof callback !== 'function') {
    throw new Error('The callback passed to the watch command must be a function');
  }

  if (type && !(type === 'insert' || type === 'update' || type === 'remove')) {
    throw new Error('Type must be one of: \'insert\', \'update\', \'remove\'');
  }
}


// Set our exports to be the entire driver.
module.exports = mongo;
