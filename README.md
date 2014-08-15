MongoDB Node.js Driver + Pub/Sub
================================

An example driver to be used with Node.js in conjunction with [10gen-interns/pubsub](https://github.com/10gen-interns/pubsub). This repo provides a wrapper around the [MongoDB Node.js Driver](https://github.com/mongodb/node-mongodb-native).

# Installation

<!--
To install the latest version from NPM, run:

```
npm install mongodb-pubsub
```
-->

To install from source:

```
git clone git@github.com:ajgrover/node-mongodb-pubsub.git
cd node-mongodb-pubsub
npm install
```

# Usage

```javascript
var MongoClient = require('../index.js').MongoClient;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  console.log('Opened a connection.');

  // now you can publish, subscribe, and unsubscribe
  db.subscribe('test', function(err, subscription) {
    console.log('Subscribed to \'test\'.');

    // register event handlers on subscription object
    subscription.on('message', function(message) {

      // message contains fields 'subscription', 'channel', and 'data'
      console.log('Received message. ' + message.channel +
                  ': ' + JSON.stringify(message.data, null, 2));

      // unsubscribe after receiving a single message.
      db.unsubscribe(subscription, function(err, res) {
        console.log('Unsubscribed. All done!');
        process.exit(0);
      });
    });

    // publish a message when the subscriber is ready
    db.publish('test', {hello: 'world'}, function(err, res) {
      console.log('Published message.');
    });

  });

});

// Output:
// - Opened a connection.
// - Subscribed to 'test'.
// - Published message.
// - Received message. test: {
// -   "hello": "world"
// - }
// - Unsubscribed. All done!

```

See `examples/basic.js` for a more in depth example with 2 subscriptions.

# API Documentation

Three basic methods are provided to interact with MongoDB's Pub/Sub system: `publish`, `subscribe`, and `unsubscribe`.

## Publish

The publish command sends a document to the channel specified.

Signature:

```
db.publish(channel, document, [callback]);
```

Arguments:

- `channel` The channel name to publish to. Must be a string.
- `document` The document to publish. Must be a JavaScript Object.
- `callback` Optional. Takes the form `function(err, res)`.

## Subscribe

Subscribes to a channel using prefix matching. TODO: document subscription matching behavior
<!--See the [documentation on subscribing](https://github.com/10gen-interns/pubsub/blob/master/README.md#Subscribing) for more information.-->

Signature:

```
db.subscribe(channel, [options], callback);
```

Arguments:

- `channel` The channel name/prefix to susbcribe to. Must be a string.
- `options` Optional. Used to specify a filter and/or projection for the subscription.
- `callback` Required. Takes the form `function(err, subscription)`.

### Filters and Projections

The optional `options` object recognizes the fields `filter` and `projection`. TODO: document behavior of filters and projections in pubsub in the main repo
<!-- See [here](https://github.com/10gen-interns/pubsub/blob/master/README.md) for documentation about the behavior of filters and projections on subscriptions. -->
They can be used together or independently of each other. The values for these fields must be objects and take the same syntax as the query and projections fields of a read command. See [here](http://docs.mongodb.org/manual/tutorial/query-documents/) for documentation on filter syntax and [here](http://docs.mongodb.org/manual/tutorial/project-fields-from-query-results/) for documentation on projection syntax.

### Subscriptions

The `subscribe` command returns a subscription object which automatically handles polling. It emits the following events:

- `'message'` When a message is received. Message comes in the format `{subscription: ObjectId, channel: <channel>, data: <message>}`.
- `'error'` If polling the database fails with an error.

Example:

```javascript
db.subscribe('channel', function(err, subscription) {
  if (err) // handle subscribe error

  subscription.on('message', function(message) {
    // handle message
  });

  subscription.on('error', function(errmsg) {
    // handle poll error
  });
});
```

## Unsubscribe

Unsubscribes from a given subscription.

Signature:

```
db.unsubscribe(subscription, [callback]);
```

Arguments:

- `subscription` The subscription object to unsubscribe from. Must be an object returned by the callback of the `subscribe` command.
- `callback` Optional. Takes the form `function(err, res)`.

# Other options

### Poll timeout

Under the hood, MongoDB uses long polling to implement the Publish/Subscribe system. However, the driver handles the mechanics of polling the database and getting the correct messages to the correct subscriptions. TODO: document options and behavior of poll command
<!-- For more information, please see the [documentation on poll options](https://github.com/10gen-interns/pubsub/blob/master/README.md#Polling). -->

For performance, the driver pools all subscriptions on each DB connection into a single poll database command. Each DB exposes a property `db.pollLength` which determines the maximum time (in milliseconds) that a poll will spend waiting on the server if there are no messages available. If not set explicitly, the default is 10 minutes (the maximum allowed by the server).

If you need fine-grained control over how long each subscription waits on the server, you must open multiple DB connections and then set the pollLength property on each one.

## Database Event Notifications

# TODO: document database event wrapper methods
