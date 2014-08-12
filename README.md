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

- To be updated

```javascript
var mongo = require('./index.js');

var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  mongoClient.subscribe('channel', function(err, subscription) {
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
    });
    mongoClient.publish('channel', {hello: 'world'});
  });
});
```

# API Documentation

Three basic methods are provided to interact with MongoDB's Pub/Sub system: `publish`, `subscribe`, and `unsubscribe`.

## Publish

The publish command sends a document to the channel specified.

Signature:

```
mongoClient.publish(channel, document, [callback]);
```

Arguments:

- `channel` The channel name to publish to. Must be a string.
- `document` The document to publish. Must be a JavaScript Object.
- `callback` Optional. Takes the form `function(err, res)`.

## Subscribe

Subscribes to a channel using prefix matching. TODO: document subscription behavior
<!--See the [documentation on subscribing](https://github.com/10gen-interns/pubsub/blob/master/README.md#Subscribing) for more information.-->

Signature:

```
mongoClient.subscribe(channel, callback);
```

Arguments:

- `channel` The channel name/prefix to susbcribe to. Must be a string.
- `callback` Required. Takes the form `function(err, subscription)`.

### Subscriptions

The `subscribe` command returns a subscription object which automatically handles polling. It emits the following events:

- `'message'` When a message is received. Message comes in the format `{subscription: ObjectId, channel: <channel>, data: <message>}`.
- `'error'` If polling the database fails with an error.

Example:

```javascript
mongoClient.subscribe('channel', function(err, subscription) {
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
mongoClient.unsubscribe(subscription, [callback]);
```

Arguments:

- `subscription` The subscription object to unsubscribe from. Must be an object returned by the callback of the `subscribe` command.
- `callback` Optional. Takes the form `function(err, res)`.

# Other options

## Poll timeout

Under the hood, MongoDB uses long polling to implement the Publish/Subscribe system. However, the driver handles the mechanics of polling the database and getting the correct messages to the correct subscriptions. TODO: document options and behavior of poll command
<!-- For more information, please see the [documentation on poll options](https://github.com/10gen-interns/pubsub/blob/master/README.md#Polling). -->

For performance, the driver pools all subscriptions on each MongoClient into a single poll database command. Each MongoClient exposes a property `MongoClient.pollLength` which determines the maximum time (in milliseconds) that a poll will spend waiting on the server if there are no messages available. If not set explicitly, the default is 10 minutes (the maximum allowed by the server).

If you need fine-grained control over how long each subscription waits on the server, you must open multiple MongoClients and then set the pollLength property on each one.

# TODO: filters and projections
